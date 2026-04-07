import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Profile } from '@/lib/definitions';

export async function middleware(request: NextRequest) {
  // Create a response object to set cookies on
  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers), // Use new Headers to make them mutable
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
          // The cookie should be set on the response that will be sent back to the browser.
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // The cookie should be deleted from the response.
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
  
  if (user) {
    // If the user is authenticated, fetch their profile and pass it via headers.
    // This makes the middleware the single source of truth for auth data.
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
    );
    const { data: profile, error } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
    
    if (error || !profile) {
        // This indicates an inconsistent state (auth user exists, but profile doesn't).
        // Log the user out to resolve the loop.
        const redirectUrl = new URL('/logout', request.url)
        redirectUrl.searchParams.set('error', 'no_profile')
        return NextResponse.redirect(redirectUrl)
    }

    // Pass user and profile to server components via headers.
    response.headers.set('x-user', JSON.stringify(user));
    response.headers.set('x-profile', JSON.stringify(profile));

    // Rule 2: If user is logged in and tries to access a public-only route, redirect to their dashboard.
    if (isPublicOnlyRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }


  // All good, return the response which now has the updated cookie and auth headers.
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
