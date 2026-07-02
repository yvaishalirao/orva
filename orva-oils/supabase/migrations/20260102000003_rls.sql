-- Enable RLS on all customer-facing tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read active products
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (active = true);

-- Customers: can only read/update own record
CREATE POLICY "customers_own_read" ON customers
  FOR SELECT USING (google_uid = auth.jwt() ->> 'sub');

CREATE POLICY "customers_own_insert" ON customers
  FOR INSERT WITH CHECK (google_uid = auth.jwt() ->> 'sub');

-- Orders: customers can only read their own orders
CREATE POLICY "orders_own_read" ON orders
  FOR SELECT USING (
    customer_id = (SELECT id FROM customers WHERE google_uid = auth.jwt() ->> 'sub')
  );

CREATE POLICY "orders_own_insert" ON orders
  FOR INSERT WITH CHECK (
    customer_id = (SELECT id FROM customers WHERE google_uid = auth.jwt() ->> 'sub')
  );

-- Order items: readable via order ownership
CREATE POLICY "order_items_own_read" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = (
        SELECT id FROM customers WHERE google_uid = auth.jwt() ->> 'sub'
      )
    )
  );

-- Addresses: scoped to order ownership
CREATE POLICY "addresses_own_read" ON addresses
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = (
        SELECT id FROM customers WHERE google_uid = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "addresses_own_insert" ON addresses
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = (
        SELECT id FROM customers WHERE google_uid = auth.jwt() ->> 'sub'
      )
    )
  );

-- Payments: customers can read their own
CREATE POLICY "payments_own_read" ON payments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = (
        SELECT id FROM customers WHERE google_uid = auth.jwt() ->> 'sub'
      )
    )
  );

-- Invoices: readable via order ownership
CREATE POLICY "invoices_own_read" ON invoices
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = (
        SELECT id FROM customers WHERE google_uid = auth.jwt() ->> 'sub'
      )
    )
  );

-- Discount codes: public read for active codes (needed at checkout)
CREATE POLICY "discount_codes_public_read" ON discount_codes
  FOR SELECT USING (active = true);

-- Site settings: public read
CREATE POLICY "site_settings_public_read" ON site_settings
  FOR SELECT USING (true);

-- Role grants: allow anon and authenticated to access tables (RLS policies control row-level access)
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON site_settings TO anon, authenticated;
GRANT SELECT ON discount_codes TO anon, authenticated;
GRANT SELECT, INSERT ON customers TO authenticated;
GRANT SELECT, INSERT ON orders TO authenticated;
GRANT SELECT, INSERT ON order_items TO authenticated;
GRANT SELECT, INSERT ON addresses TO authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT SELECT ON invoices TO authenticated;
