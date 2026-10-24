-- Adds the dedicated second_hand role and assigns listings to their manager.
-- Supports text/check-constraint and PostgreSQL enum role columns.
-- The admin interface also expects a bookings table, which may be missing from older databases.
CREATE TABLE IF NOT EXISTS public.second_hand_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_title TEXT NOT NULL,
  user_name TEXT,
  transaction_phone TEXT,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE
  v_type_kind "char";
  v_type_schema TEXT;
  v_type_name TEXT;
  v_existing_roles TEXT[];
  v_constraint_name TEXT;
BEGIN
  SELECT t.typtype, type_schema.nspname, t.typname
    INTO v_type_kind, v_type_schema, v_type_name
  FROM pg_attribute AS a
  JOIN pg_type AS t ON t.oid = a.atttypid
  JOIN pg_namespace AS type_schema ON type_schema.oid = t.typnamespace
  WHERE a.attrelid = 'public.profiles'::regclass
    AND a.attname = 'role'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF v_type_kind IS NULL THEN
    RAISE EXCEPTION 'Could not find public.profiles.role';
  END IF;

  IF v_type_kind = 'e' THEN
    EXECUTE format(
      'ALTER TYPE %I.%I ADD VALUE IF NOT EXISTS %L',
      v_type_schema,
      v_type_name,
      'second_hand'
    );
  ELSE
    SELECT COALESCE(array_agg(DISTINCT role::text), ARRAY[]::text[])
      INTO v_existing_roles
    FROM public.profiles
    WHERE role IS NOT NULL;

    v_existing_roles := ARRAY[
      'admin', 'seller', 'restaurant', 'delivery', 'user', 'staff', 'real_estate', 'second_hand'
    ]::text[] || v_existing_roles;

    FOR v_constraint_name IN
      SELECT c.conname
      FROM pg_constraint AS c
      WHERE c.conrelid = 'public.profiles'::regclass
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ~* '\mrole\M'
    LOOP
      EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', v_constraint_name);
    END LOOP;

    EXECUTE format(
      'ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_allowed_check CHECK (role::text = ANY (%L::text[])) NOT VALID',
      v_existing_roles::text
    );

    ALTER TABLE public.profiles
      VALIDATE CONSTRAINT profiles_role_allowed_check;
  END IF;
END $$;

DO $$
DECLARE
  v_profile_id_type TEXT;
  v_listing_owner_type TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO v_profile_id_type
  FROM pg_attribute AS a
  WHERE a.attrelid = 'public.profiles'::regclass
    AND a.attname = 'id'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF v_profile_id_type IS NULL THEN
    RAISE EXCEPTION 'Could not find public.profiles.id';
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod)
    INTO v_listing_owner_type
  FROM pg_attribute AS a
  WHERE a.attrelid = 'public.second_hand_items'::regclass
    AND a.attname = 'owner_id'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF v_listing_owner_type IS NULL THEN
    EXECUTE format(
      'ALTER TABLE public.second_hand_items ADD COLUMN owner_id %s',
      v_profile_id_type
    );
  ELSIF v_listing_owner_type <> v_profile_id_type THEN
    RAISE EXCEPTION 'second_hand_items.owner_id type (%) does not match profiles.id type (%)',
      v_listing_owner_type, v_profile_id_type;
  END IF;

  -- Assign old listings only when there is exactly one second-hand manager.
  -- If there are multiple managers, leave old unowned listings unassigned.
  UPDATE public.second_hand_items
  SET owner_id = (
    SELECT id FROM public.profiles WHERE role::text = 'second_hand' LIMIT 1
  )
  WHERE owner_id IS NULL
    AND (SELECT count(*) FROM public.profiles WHERE role::text = 'second_hand') = 1;
END $$;

CREATE INDEX IF NOT EXISTS second_hand_items_owner_id_idx
  ON public.second_hand_items(owner_id);

DO $$
DECLARE
  v_profile_id_type TEXT;
  v_booking_owner_type TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO v_profile_id_type
  FROM pg_attribute AS a
  WHERE a.attrelid = 'public.profiles'::regclass
    AND a.attname = 'id'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod)
    INTO v_booking_owner_type
  FROM pg_attribute AS a
  WHERE a.attrelid = 'public.second_hand_bookings'::regclass
    AND a.attname = 'owner_id'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF v_booking_owner_type IS NULL THEN
    EXECUTE format(
      'ALTER TABLE public.second_hand_bookings ADD COLUMN owner_id %s',
      v_profile_id_type
    );
  ELSIF v_booking_owner_type <> v_profile_id_type THEN
    RAISE EXCEPTION 'second_hand_bookings.owner_id type (%) does not match profiles.id type (%)',
      v_booking_owner_type, v_profile_id_type;
  END IF;
END $$;

-- Connect existing bookings only when the item title identifies one manager.
UPDATE public.second_hand_bookings AS booking
SET owner_id = listing_owners.owner_id
FROM (
  SELECT title, (array_agg(owner_id))[1] AS owner_id
  FROM public.second_hand_items
  WHERE owner_id IS NOT NULL
  GROUP BY title
  HAVING count(DISTINCT owner_id) = 1
) AS listing_owners
WHERE booking.owner_id IS NULL
  AND booking.item_title = listing_owners.title;

CREATE INDEX IF NOT EXISTS second_hand_bookings_owner_id_idx
  ON public.second_hand_bookings(owner_id);

-- New bookings are linked by title only when that title belongs to one manager.
CREATE OR REPLACE FUNCTION public.set_second_hand_booking_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.owner_id := NULL;
  ELSIF NEW.item_title IS DISTINCT FROM OLD.item_title THEN
    NEW.owner_id := NULL;
  END IF;

  IF NEW.owner_id IS NULL THEN
    SELECT (array_agg(owner_id))[1]
      INTO NEW.owner_id
    FROM public.second_hand_items
    WHERE title = NEW.item_title
      AND owner_id IS NOT NULL
    HAVING count(DISTINCT owner_id) = 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS second_hand_booking_owner_trigger
  ON public.second_hand_bookings;

CREATE TRIGGER second_hand_booking_owner_trigger
BEFORE INSERT OR UPDATE OF item_title
ON public.second_hand_bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_second_hand_booking_owner();

NOTIFY pgrst, 'reload schema';
