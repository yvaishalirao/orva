-- Products (idempotent via ON CONFLICT)
INSERT INTO products (id, name, description, price, active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Groundnut Oil 1L',   'Cold-pressed groundnut oil. Rich flavour.', 280.00, true),
  ('00000000-0000-0000-0000-000000000002', 'Groundnut Oil 5L',   'Cold-pressed groundnut oil. Family pack.',  1200.00, true),
  ('00000000-0000-0000-0000-000000000003', 'Sesame Oil 500ml',   'Traditional wooden-pressed sesame oil.',    320.00, true),
  ('00000000-0000-0000-0000-000000000004', 'Coconut Oil 1L',     'Pure cold-pressed virgin coconut oil.',     450.00, true),
  ('00000000-0000-0000-0000-000000000005', 'Mustard Oil 1L',     'Kachi ghani mustard oil. Pungent & pure.',  240.00, true)
ON CONFLICT (id) DO NOTHING;

-- Site settings
INSERT INTO site_settings (key, value) VALUES
  ('contact_whatsapp',  '+919876543210'),
  ('contact_address',   'Orva Oils, Bangalore, Karnataka'),
  ('carousel_1_image',  ''),
  ('carousel_1_caption','Pure. Cold-pressed. Delivered.'),
  ('carousel_2_image',  ''),
  ('carousel_2_caption','Farm to your kitchen.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
