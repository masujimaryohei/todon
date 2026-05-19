import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { COOKIE_NAME } from '@/lib/auth/jwt';

export async function POST() {
  const store = await cookies();
  store.delete(COOKIE_NAME);

  const res = NextResponse.json({ ok: true });

  res.cookies.delete(COOKIE_NAME);

  return res;
}
