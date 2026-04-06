import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Use Auth.js `auth()` middleware (not `getToken` from `next-auth/jwt`).
 * v5 session cookies are read correctly here; `getToken` often returns null on Vercel
 * while `/api/auth/session` still works — causing redirect loops after login.
 */
export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!request.auth?.user;

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as const,
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (pathname === '/login') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const login = new URL('/login', request.url);
    login.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
