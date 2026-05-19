import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { verifyUserToken } from '@/lib/auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/tasks' ||
    pathname.startsWith('/tasks/') ||
    pathname === '/archive' ||
    pathname.startsWith('/archive/') ||
    pathname === '/reviews' ||
    pathname.startsWith('/reviews/');

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get('todon_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await verifyUserToken(token);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/tasks',
    '/tasks/:path*',
    '/archive',
    '/archive/:path*',
    '/reviews',
    '/reviews/:path*',
  ],
};
