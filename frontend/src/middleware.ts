import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Only redirect bare "/" — all dashboard auth is handled client-side in the layout
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}


export const config = {
  matcher: ['/'],
};
