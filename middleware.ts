import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession, getAdminSession, signToken, verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Core Admin Routes (Always Protected)
  const isAdminPath = pathname.startsWith('/admin');
  const isAdminLoginPath = pathname === '/admin-login';
  const isAdminApiPath = pathname.startsWith('/api/admin');
  const isAdminAuthApi = pathname === '/api/admin/auth/login' || pathname === '/api/admin/auth/verify-otp';
  const isAdminSetupApi = pathname === '/api/admin/setup';

  // 2. Sensitive Management APIs (Protected for Write Operations)
  const sensitiveApiPaths = [
    '/api/doctors',
    '/api/departments',
    '/api/diseases',
    '/api/locations',
    '/api/ambulances',
    '/api/blood-donors',
    '/api/hospitals',
    '/api/thana',
    '/api/district',
    '/api/division',
    '/api/app-image',
    '/api/popup',
    '/api/service-sections',
    '/api/blog',
  ];
  
  const isSensitiveApi = sensitiveApiPaths.some(path => pathname.startsWith(path));
  const isWriteOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  // Allow admin login page and API
  if (isAdminLoginPath || isAdminAuthApi || isAdminSetupApi) {
    return NextResponse.next();
  }

  if (isAdminPath || isAdminApiPath || (isSensitiveApi && isWriteOperation)) {
    let session = await getAdminSession(request);
    let response = NextResponse.next();

    // Check if access token is invalid/expired but refresh token is valid
    const hasAccessToken = request.cookies.has('admin_access_token');
    const hasRefreshToken = request.cookies.has('admin_refresh_token');

    if (!hasAccessToken && hasRefreshToken) {
      const refreshToken = request.cookies.get('admin_refresh_token')?.value;
      if (refreshToken) {
        const payload = await verifyToken(refreshToken);
        if (payload && (payload.role === 'admin' || payload.role === 'superadmin')) {
          session = payload;
          const newAccessToken = await signToken({
            id: payload.id,
            email: payload.email,
            role: payload.role,
          }, '15m');

          // Set cookie on response so it updates the client browser
          response.cookies.set('admin_access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 minutes
            path: '/',
          });

          // Set cookie on the request headers so that subsequent middleware/APIs see it
          request.cookies.set('admin_access_token', newAccessToken);
        }
      }
    }

    // Scenario 1: Not Logged In as Admin
    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      if (isAdminPath) {
        url.pathname = '/admin-login';
      } else {
        url.pathname = '/login';
      }
      return NextResponse.redirect(url);
    }

    return response;
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/admin/:path*', 
    '/api/:path*'
  ],
};

