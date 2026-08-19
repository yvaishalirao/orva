import { Resend } from 'resend';

export async function sendOwnerOrderAlert(orderId: string, total: number, customerName: string) {
  // Constructed lazily — the SDK throws at instantiation if the key is unset,
  // which would otherwise crash module load before RESEND_API_KEY is configured.
  const resend = new Resend(process.env.RESEND_API_KEY!);
  await resend.emails.send({
    from: 'Orva Oils <orders@yourdomain.com>',
    to: process.env.OWNER_EMAIL!,
    subject: `New Order #${orderId.slice(-8).toUpperCase()} — ₹${total}`,
    text: `New paid order from ${customerName}. Order ID: ${orderId}. Total: ₹${total}.`,
  });
}
