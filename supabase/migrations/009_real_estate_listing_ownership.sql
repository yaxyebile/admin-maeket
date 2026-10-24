-- Adds ownership to listings so each real estate manager only manages their own stock.
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
  WHERE a.attrelid = 'public.property_listings'::regclass
    AND a.attname = 'owner_id'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF v_listing_owner_type IS NULL THEN
    EXECUTE format(
      'ALTER TABLE public.property_listings ADD COLUMN owner_id %s',
      v_profile_id_type
    );
  ELSIF v_listing_owner_type <> v_profile_id_type THEN
    RAISE EXCEPTION 'property_listings.owner_id type (%) does not match profiles.id type (%)',
      v_listing_owner_type, v_profile_id_type;
  END IF;

  -- If there is exactly one real estate manager, assign legacy listings to them.
  -- With multiple managers, leave unassigned rows untouched to prevent cross-account access.
  UPDATE public.property_listings
  SET owner_id = (
    SELECT id FROM public.profiles WHERE role::text = 'real_estate' LIMIT 1
  )
  WHERE owner_id IS NULL
    AND (SELECT count(*) FROM public.profiles WHERE role::text = 'real_estate') = 1;
END $$;

CREATE INDEX IF NOT EXISTS property_listings_owner_id_idx
  ON public.property_listings(owner_id);
