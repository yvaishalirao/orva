import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  return Response.json({ cookies: all.map(c => ({ name: c.name, valueLen: c.value.length })) });
}
