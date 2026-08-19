-- Atomic discount code redemption (INV-09): check + increment in a single statement.
-- No read-then-write in application code — race-safe under concurrent requests.
CREATE OR REPLACE FUNCTION redeem_discount_code(p_code TEXT)
RETURNS TABLE (id UUID, type TEXT, value NUMERIC)
LANGUAGE sql
AS $$
  UPDATE discount_codes
  SET uses_count = uses_count + 1
  WHERE code = p_code
    AND active = true
    AND (expiry IS NULL OR expiry > NOW())
    AND (max_uses IS NULL OR uses_count < max_uses)
  RETURNING discount_codes.id, discount_codes.type, discount_codes.value;
$$;
