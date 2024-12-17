import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function middleware(request: NextRequest) {
  // Paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/register'];
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('userId', (decoded as any).userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    '/api/jobs/:path*',
    '/api/status/:path*',
    '/jobs/:path*',
    '/status/:path*'
  ]
};