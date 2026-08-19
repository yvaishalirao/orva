import twilio from 'twilio';

export async function sendCustomerWhatsApp(phone: string, message: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: `whatsapp:${phone}`,
    body: message,
  });
}
