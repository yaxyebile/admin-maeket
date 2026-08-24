-- Dalabaadyada hal checkout (macmiil 3 dukaan ka iibsaday)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS checkout_group_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_checkout_group ON orders(checkout_group_id);
