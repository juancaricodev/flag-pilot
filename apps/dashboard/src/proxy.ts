import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'access_token';

const protectedRoutes = ['/flags', '/audit', '/metrics'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Root: redirect based on auth status
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = token ? '/flags' : '/login';
    return NextResponse.redirect(url);
  }

  // Login page: redirect to flags if already authenticated
  if (pathname === '/login' && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/flags';
    return NextResponse.redirect(url);
  }

  // Protected routes: redirect to login if not authenticated
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
