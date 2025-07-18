import { NextResponse } from 'next/server';
import rateLimit from 'next-rate-limit';

const limiter = rateLimit({
  window: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique IPs per minute
});

const TRUSTED_ORIGINS = [
  'http://localhost:3000', // local dev
  'https://link-preview-gules.vercel.app/' // production
];

const CSRF_TOKEN = process.env.CSRF_TOKEN || 'demo-csrf-token';

function setSecurityHeaders(response) {
  response.headers.set('Content-Security-Policy', "default-src 'self'");
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return response;
}

export async function middleware(request) {
  const { pathname, origin } = request.nextUrl;
  const method = request.method;

  // CORS restriction for API routes
  if (pathname.startsWith('/api/')) {
    const originHeader = request.headers.get('origin');
    if (originHeader && !TRUSTED_ORIGINS.includes(originHeader)) {
      const res = new NextResponse(
        JSON.stringify({ success: false, message: 'CORS: Origin not allowed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
      return setSecurityHeaders(res);
    }
  }

  // CSRF protection for state-changing requests
  if ((pathname.startsWith('/api/problems') || pathname.startsWith('/api/admin-auth')) && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
    const csrfHeader = request.headers.get('x-csrf-token');
    if (!csrfHeader || csrfHeader !== CSRF_TOKEN) {
      const res = new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid or missing CSRF token.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
      return setSecurityHeaders(res);
    }
  }

  // Rate limit for /api/problems and /api/admin-auth
  if (pathname.startsWith('/api/problems') || pathname.startsWith('/api/admin-auth')) {
    try {
      // Lower limit for state-changing requests
      if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        await limiter.check(request, 10, 'RATE_LIMIT_STATE'); // 10 per minute per IP
      } else {
        await limiter.check(request, 60, 'RATE_LIMIT_GET'); // 60 per minute per IP
      }
    } catch {
      const res = new NextResponse(
        JSON.stringify({ success: false, message: 'Too many requests, please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
      return setSecurityHeaders(res);
    }
  }
  // Only protect /api/problems for POST, PUT, DELETE
  if (pathname.startsWith('/api/problems')) {
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      const cookie = request.cookies.get('admin_token');
      const validToken = process.env.ADMIN_TOKEN || 'admin-secret-token';
      if (!cookie || cookie.value !== validToken) {
        const res = new NextResponse(
          JSON.stringify({ success: false, message: 'Unauthorized: Admins only' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
        return setSecurityHeaders(res);
      }
    }
  }
  // Set security headers for all API responses
  const response = NextResponse.next();
  return setSecurityHeaders(response);
}

export const config = {
  matcher: ['/api/:path*']
}; 