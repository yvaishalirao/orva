ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0);

-- Existing catalog rows predate stock tracking — give them a starting count
-- so the storefront doesn't suddenly show everything as out of stock.
UPDATE products SET stock = 50;

-- Atomic multi-item stock decrement for a paid order (mirrors the discount-code
-- pattern: no read-then-write in application code). Runs as one implicit
-- transaction — if any line item lacks sufficient stock, the exception rolls
-- back every decrement already applied earlier in the loop, all or nothing.
CREATE OR REPLACE FUNCTION decrement_stock_for_order(p_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  item JSONB;
  updated_rows INTEGER;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE products
    SET stock = stock - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::UUID
      AND stock >= (item->>'quantity')::INTEGER;

    GET DIAGNOSTICS updated_rows = ROW_COUNT;

    IF updated_rows = 0 THEN
      RAISE EXCEPTION 'insufficient_stock: product %', item->>'product_id';
    END IF;
  END LOOP;
END;
$$;
