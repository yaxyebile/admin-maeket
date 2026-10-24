-- Generate property listing IDs in the database when callers omit them.
DO $$
DECLARE
  v_data_type TEXT;
BEGIN
  SELECT data_type
    INTO v_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'property_listings'
    AND column_name = 'id';

  IF v_data_type IS NULL THEN
    RAISE EXCEPTION 'Could not find public.property_listings.id';
  ELSIF v_data_type = 'uuid' THEN
    ALTER TABLE public.property_listings
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
  ELSIF v_data_type = 'text' THEN
    ALTER TABLE public.property_listings
      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  ELSIF v_data_type = 'character varying' THEN
    ALTER TABLE public.property_listings
      ALTER COLUMN id SET DEFAULT gen_random_uuid()::varchar;
  ELSE
    RAISE EXCEPTION 'Unsupported ID column type for property_listings.id: %', v_data_type;
  END IF;
END $$;
