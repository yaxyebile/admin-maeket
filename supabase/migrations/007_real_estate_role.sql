-- Adds the dedicated real_estate role to public.profiles.role.
-- Supports text-based roles and PostgreSQL enum-based roles.
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
      'real_estate'
    );
  ELSE
    SELECT COALESCE(array_agg(DISTINCT role::text), ARRAY[]::text[])
      INTO v_existing_roles
    FROM public.profiles
    WHERE role IS NOT NULL;

    v_existing_roles := ARRAY[
      'admin', 'seller', 'restaurant', 'delivery', 'user', 'staff', 'real_estate'
    ]::text[] || v_existing_roles;

    -- Replace any role allow-list checks while retaining role values already in use.
    FOR v_constraint_name IN
      SELECT c.conname
      FROM pg_constraint AS c
      WHERE c.conrelid = 'public.profiles'::regclass
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ~* '\mrole\M'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.profiles DROP CONSTRAINT %I',
        v_constraint_name
      );
    END LOOP;

    EXECUTE format(
      'ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_allowed_check CHECK (role::text = ANY (%L::text[])) NOT VALID',
      v_existing_roles::text
    );

    ALTER TABLE public.profiles
      VALIDATE CONSTRAINT profiles_role_allowed_check;
  END IF;
END $$;
