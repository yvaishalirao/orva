/**
 * TC-5.1 — Integration tests for POST /api/orders
 * Requires: dev server running on :3000, Supabase local on :54321
 *
 * Run: node tests/tc-5.1.mjs
 */

const SUPABASE = 'http://127.0.0.1:54321';
const ANON    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const BASE    = 'http://localhost:3000';

// Known seed products
const P1 = { id: '00000000-0000-0000-0000-000000000001', price: 280  }; // Groundnut Oil 1L
const P4 = { id: '00000000-0000-0000-0000-000000000004', price: 450  }; // Coconut Oil 1L
const P5 = { id: '00000000-0000-0000-0000-000000000005', price: 240  }; // Mustard Oil 1L (TC-2 target)

const ADDR = { name: 'Test User', phone: '9876543210', line1: '1 Test St', city: 'Bengaluru', pincode: '560001', state: 'Karnataka' };

// ── Helpers ────────────────────────────────────────────────────────────────

async function sbAdmin(method, path, body) {
  const res = await fetch(SUPABASE + path, {
    method,
    headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

async function appPost(path, body, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(BASE + path, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
}

let passed = 0, failed = 0;
function pass(msg) { console.log(`  ✓ ${msg}`); passed++; }
function fail(msg, detail = '') { console.log(`  ✗ ${msg}${detail ? '  (' + detail + ')' : ''}`); failed++; }

// ── State ──────────────────────────────────────────────────────────────────
let testUserId = '';
let customerId = '';
let sessionCookie = '';
let discountCode = '';
let discountCodeId = '';

// ── Setup ──────────────────────────────────────────────────────────────────
async function setup() {
  console.log('\n── Setup ────────────────────────────────────────────────────');
  const email = `tc51_${Date.now()}@test.local`;
  const password = 'pass1234Test!';

  // 1. Create test user via admin REST API
  const create = await sbAdmin('POST', '/auth/v1/admin/users', { email, password, email_confirm: true });
  if (create.status !== 200) throw new Error('Create user: ' + JSON.stringify(create.data));
  testUserId = create.data.id;
  console.log(`  user: ${email} (${testUserId})`);

  // 2. Sign in to get session
  const signinRes = await fetch(SUPABASE + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const session = await signinRes.json();
  if (!signinRes.ok) throw new Error('Sign in: ' + JSON.stringify(session));

  // Cookie name: sb-{first hostname segment}-auth-token (derived by @supabase/supabase-js createClient)
  // Cookie value: "base64-" + base64url(JSON.stringify(session))  (cookieEncoding defaults to "base64url")
  const sessionBase64 = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
  sessionCookie = `sb-127-auth-token=${sessionBase64}`;

  // 3. Create customer record
  const cust = await sbAdmin('POST', '/rest/v1/customers', { google_uid: testUserId, name: 'Test User', email });
  if (cust.status !== 201) throw new Error('Create customer: ' + JSON.stringify(cust.data));
  customerId = cust.data[0].id;
  console.log(`  customer: ${customerId}`);

  // 4. Create discount code: ₹9999 fixed (for TC-4)
  const code = `BIG9999_${Date.now()}`;
  const disc = await sbAdmin('POST', '/rest/v1/discount_codes', { code, type: 'fixed', value: 9999, active: true });
  if (disc.status !== 201) throw new Error('Create discount: ' + JSON.stringify(disc.data));
  discountCode = code;
  discountCodeId = disc.data[0].id;
  console.log(`  discount: ${code} (₹9999 fixed)`);
}

// ── Teardown ───────────────────────────────────────────────────────────────
async function teardown() {
  console.log('\n── Teardown ─────────────────────────────────────────────────');
  // Restore P5 active (in case TC-2 left it inactive)
  await sbAdmin('PATCH', '/rest/v1/products?id=eq.' + P5.id, { active: true });
  // Delete orders (cascades order_items + addresses)
  await sbAdmin('DELETE', '/rest/v1/orders?customer_id=eq.' + customerId, null);
  // Delete discount code
  if (discountCodeId)
    await sbAdmin('DELETE', '/rest/v1/discount_codes?id=eq.' + discountCodeId, null);
  // Delete customer
  await sbAdmin('DELETE', '/rest/v1/customers?id=eq.' + customerId, null);
  // Delete auth user
  await sbAdmin('DELETE', '/auth/v1/admin/users/' + testUserId, null);
  console.log('  done');
}

// ── TC-1: Unauthenticated → 401 ────────────────────────────────────────────
async function tc1() {
  console.log('\n── TC-1: Unauthenticated → 401 ─────────────────────────────');
  const { status, body } = await appPost('/api/orders', { items: [], address: ADDR }, null);
  status === 401 && body.error === 'Unauthorised'
    ? pass('no session cookie → 401 Unauthorised')
    : fail('expected 401 Unauthorised', `got ${status} ${JSON.stringify(body)}`);
}

// ── TC-2: Inactive product → 400 ──────────────────────────────────────────
async function tc2() {
  console.log('\n── TC-2: Inactive product → 400 ────────────────────────────');
  // Set P5 inactive
  await sbAdmin('PATCH', '/rest/v1/products?id=eq.' + P5.id, { active: false });
  const { status, body } = await appPost('/api/orders',
    { items: [{ productId: P5.id, quantity: 1 }], address: ADDR },
    sessionCookie
  );
  // Restore P5
  await sbAdmin('PATCH', '/rest/v1/products?id=eq.' + P5.id, { active: true });

  status === 400 && body.error?.includes(P5.id)
    ? pass(`inactive product → 400 with product ID in message`)
    : fail('expected 400 with product ID', `got ${status} ${JSON.stringify(body)}`);
}

// ── TC-3: unit_price comes from DB, not client body ────────────────────────
async function tc3() {
  console.log('\n── TC-3: unit_price from DB ────────────────────────────────');
  // Pass a fake unit_price in the item — CartItemInput interface ignores it
  // but we want to confirm the DB stores the real price
  const { status, body } = await appPost('/api/orders',
    { items: [{ productId: P1.id, quantity: 1, unit_price: 0.01 }], address: ADDR },
    sessionCookie
  );
  if (status !== 200) {
    fail('expected 200', `got ${status} ${JSON.stringify(body)}`);
    return;
  }

  // Fetch the stored order_item
  const res = await sbAdmin('GET', `/rest/v1/order_items?order_id=eq.${body.orderId}&select=unit_price`, null);
  const storedPrice = Number(res.data?.[0]?.unit_price);

  storedPrice === P1.price
    ? pass(`stored unit_price = ₹${storedPrice} (DB price, not ₹0.01 from body)`)
    : fail('unit_price mismatch', `stored ₹${storedPrice}, expected ₹${P1.price}`);

  Number(body.total) === P1.price
    ? pass(`returned total = ₹${body.total} (1 × DB price)`)
    : fail('returned total wrong', `got ${body.total}, expected ${P1.price}`);
}

// ── TC-4: Discount floors total at 0 (never negative) ─────────────────────
async function tc4() {
  console.log('\n── TC-4: Discount ₹9999 on ₹280 order → total = 0 ─────────');
  const { status, body } = await appPost('/api/orders',
    { items: [{ productId: P1.id, quantity: 1 }], address: ADDR, discountCode },
    sessionCookie
  );
  if (status !== 200) {
    fail('expected 200', `got ${status} ${JSON.stringify(body)}`);
    return;
  }

  Number(body.total) === 0
    ? pass(`returned total = ₹0 (floored, not ₹${P1.price - 9999})`)
    : fail('total not floored at 0', `got ₹${body.total}`);

  const res = await sbAdmin('GET', `/rest/v1/orders?id=eq.${body.orderId}&select=total`, null);
  Number(res.data?.[0]?.total) === 0
    ? pass(`DB orders.total = 0`)
    : fail('DB total wrong', `got ${res.data?.[0]?.total}`);
}

// ── TC-5: Returned total matches DB-calculated subtotal ────────────────────
async function tc5() {
  console.log('\n── TC-5: Multi-item total matches DB calculation ────────────');
  // P1 × 2 (₹560) + P4 × 1 (₹450) = ₹1010
  const expected = P1.price * 2 + P4.price * 1;

  const { status, body } = await appPost('/api/orders',
    {
      items: [
        { productId: P1.id, quantity: 2 },
        { productId: P4.id, quantity: 1 },
      ],
      address: ADDR,
    },
    sessionCookie
  );
  if (status !== 200) {
    fail('expected 200', `got ${status} ${JSON.stringify(body)}`);
    return;
  }

  Number(body.total) === expected
    ? pass(`returned total = ₹${body.total} (₹${P1.price}×2 + ₹${P4.price}×1)`)
    : fail('returned total wrong', `got ₹${body.total}, expected ₹${expected}`);

  const res = await sbAdmin('GET', `/rest/v1/orders?id=eq.${body.orderId}&select=total`, null);
  Number(res.data?.[0]?.total) === expected
    ? pass(`DB orders.total = ₹${res.data?.[0]?.total}`)
    : fail('DB total wrong', `got ₹${res.data?.[0]?.total}`);
}

// ── Main ───────────────────────────────────────────────────────────────────
try {
  await setup();
  await tc1();
  await tc2();
  await tc3();
  await tc4();
  await tc5();
} finally {
  await teardown();
}

console.log(`\n════════════════════════════════════════════════════════════`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`════════════════════════════════════════════════════════════`);
process.exit(failed > 0 ? 1 : 0);
