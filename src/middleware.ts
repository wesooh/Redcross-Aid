import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers), // Make headers mutable
    },
  });

  // Forward the pathname to server components
  response.headers.set('x-next-pathname', request.nextUrl.pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  // This call is essential to refresh the session cookie
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Define route types
  const protectedRoutes = ['/dashboard', '/admin', '/wallet', '/volunteer', '/merchant', '/pfa-chatbot'];
  const publicOnlyRoutes = ['/login', '/signup', '/'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicOnlyRoute = publicOnlyRoutes.includes(pathname);

  // Rule 1: If user is not logged in and tries to access a protected route, redirect to login.
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Rule 2: If user is logged in and tries to access a public-only route, redirect to their dashboard.
  if (user && isPublicOnlyRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // All good, return the response which now has the updated cookie and header.
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
