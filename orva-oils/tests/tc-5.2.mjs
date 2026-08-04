/**
 * TC-5.2 — Integration tests for POST /api/payments/init
 * Requires: dev server on :3000, Supabase local on :54321, Razorpay test keys set
 *
 * Run: node tests/tc-5.2.mjs
 */

const SUPABASE = 'http://127.0.0.1:54321';
const ANON    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const BASE    = 'http://localhost:3000';

const P1 = { id: '00000000-0000-0000-0000-000000000001', price: 280 };
const ADDR = { name: 'Test', phone: '9876543210', line1: '1 St', city: 'Bengaluru', pincode: '560001', state: 'Karnataka' };

let passed = 0, failed = 0;
function pass(msg) { console.log(`  ✓ ${msg}`); passed++; }
function fail(msg, detail = '') { console.log(`  ✗ ${msg}${detail ? '  (' + detail + ')' : ''}`); failed++; }

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

async function createTestUser(tag) {
  const email = `tc52_${tag}_${Date.now()}@test.local`;
  const password = 'pass1234Test!';

  const cr = await sbAdmin('POST', '/auth/v1/admin/users', { email, password, email_confirm: true });
  if (cr.status !== 200) throw new Error('Create user: ' + JSON.stringify(cr.data));

  const sr = await fetch(SUPABASE + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const session = await sr.json();
  if (!sr.ok) throw new Error('Sign in: ' + JSON.stringify(session));

  const sessionCookie = `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;

  const cust = await sbAdmin('POST', '/rest/v1/customers', { google_uid: cr.data.id, name: 'Test', email });
  if (cust.status !== 201) throw new Error('Create customer: ' + JSON.stringify(cust.data));

  return { userId: cr.data.id, customerId: cust.data[0].id, sessionCookie };
}

async function createOrder(sessionCookie) {
  const res = await fetch(`${BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({ items: [{ productId: P1.id, quantity: 1 }], address: ADDR }),
  });
  return res.json();
}

async function appPost(path, body, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(BASE + path, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
}

// ── State ──────────────────────────────────────────────────────────────────

let userA = null, userB = null;
let orderAId = '';

// ── Setup ──────────────────────────────────────────────────────────────────

async function setup() {
  console.log('\n── Setup ────────────────────────────────────────────────────');
  userA = await createTestUser('a');
  userB = await createTestUser('b');
  console.log(`  userA: ${userA.userId}`);
  console.log(`  userB: ${userB.userId}`);

  // Create an order for userA via /api/orders
  const order = await createOrder(userA.sessionCookie);
  if (!order.orderId) throw new Error('Create order failed: ' + JSON.stringify(order));
  orderAId = order.orderId;
  console.log(`  orderA: ${orderAId} (total ₹${order.total})`);
}

// ── Teardown ───────────────────────────────────────────────────────────────

async function teardown() {
  console.log('\n── Teardown ─────────────────────────────────────────────────');
  for (const u of [userA, userB]) {
    if (!u) continue;
    await sbAdmin('DELETE', `/rest/v1/payments?order_id=eq.${orderAId}`, null);
    await sbAdmin('DELETE', `/rest/v1/orders?customer_id=eq.${u.customerId}`, null);
    await sbAdmin('DELETE', `/rest/v1/customers?id=eq.${u.customerId}`, null);
    await sbAdmin('DELETE', `/auth/v1/admin/users/${u.userId}`, null);
  }
  console.log('  done');
}

// ── TC-1: Unauthenticated → 401 ────────────────────────────────────────────

async function tc1() {
  console.log('\n── TC-1: Unauthenticated → 401 ─────────────────────────────');
  const { status, body } = await appPost('/api/payments/init', { orderId: orderAId }, null);
  status === 401 && body.error === 'Unauthorised'
    ? pass('no session → 401 Unauthorised')
    : fail('expected 401', `got ${status} ${JSON.stringify(body)}`);
}

// ── TC-2: Amount in response matches DB order total ────────────────────────

async function tc2() {
  console.log('\n── TC-2: Response amount = DB order total ───────────────────');
  const { status, body } = await appPost('/api/payments/init', { orderId: orderAId }, userA.sessionCookie);
  if (status !== 200) {
    fail('expected 200', `got ${status} ${JSON.stringify(body)}`);
    return;
  }

  // Fetch order total from DB
  const { data: orders } = await sbAdmin('GET', `/rest/v1/orders?id=eq.${orderAId}&select=total`, null);
  const dbTotal = Number(orders?.[0]?.total);

  Number(body.amount) === dbTotal
    ? pass(`response amount = ₹${body.amount} (matches DB total ₹${dbTotal})`)
    : fail('amount mismatch', `response ₹${body.amount} vs DB ₹${dbTotal}`);

  body.razorpayOrderId?.startsWith('order_')
    ? pass(`razorpayOrderId present: ${body.razorpayOrderId}`)
    : fail('razorpayOrderId missing/invalid', String(body.razorpayOrderId));

  body.keyId === process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || body.keyId?.startsWith('rzp_')
    ? pass('keyId returned')
    : fail('keyId missing', String(body.keyId));
}

// ── TC-3: Wrong customer → 403 ─────────────────────────────────────────────

async function tc3() {
  console.log('\n── TC-3: Wrong customer → 403 ───────────────────────────────');
  // userB tries to init payment on userA's order
  const { status, body } = await appPost('/api/payments/init', { orderId: orderAId }, userB.sessionCookie);
  status === 403 && body.error === 'Forbidden'
    ? pass('userB cannot init userA\'s order → 403 Forbidden')
    : fail('expected 403', `got ${status} ${JSON.stringify(body)}`);
}

// ── TC-4: payments.amount equals DB orders.total ───────────────────────────

async function tc4() {
  console.log('\n── TC-4: payments.amount = DB orders.total ──────────────────');
  // Fetch the payment record created by TC-2
  const { data: payments } = await sbAdmin('GET', `/rest/v1/payments?order_id=eq.${orderAId}&select=amount,status`, null);
  const payment = payments?.[0];

  if (!payment) {
    fail('no payment record found for order');
    return;
  }

  const { data: orders } = await sbAdmin('GET', `/rest/v1/orders?id=eq.${orderAId}&select=total`, null);
  const dbTotal = Number(orders?.[0]?.total);

  Number(payment.amount) === dbTotal
    ? pass(`payments.amount = ₹${payment.amount} (matches orders.total ₹${dbTotal})`)
    : fail('amount mismatch', `payment ₹${payment.amount} vs order ₹${dbTotal}`);

  payment.status === 'pending'
    ? pass('payments.status = pending')
    : fail('unexpected status', payment.status);
}

// ── Main ───────────────────────────────────────────────────────────────────

try {
  await setup();
  await tc1();
  await tc2();
  await tc3();
  await tc4();
} finally {
  await teardown();
}

console.log(`\n════════════════════════════════════════════════════════════`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`════════════════════════════════════════════════════════════`);
process.exit(failed > 0 ? 1 : 0);
