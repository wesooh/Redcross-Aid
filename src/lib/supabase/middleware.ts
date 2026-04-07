import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  // The 'x-next-pathname' header is required by the protected layout to handle
  // role-based authorization. We add it to the request headers that will be
  // passed down to server components.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-next-pathname', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  // This call is essential to refresh the session cookie
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const protectedRoutes = [
      '/dashboard',
      '/admin',
      '/wallet',
      '/volunteer',
      '/merchant',
      '/pfa-chatbot'
  ];
  
  const publicOnlyRoutes = ['/login', '/signup', '/'];
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Rule 1: If user is not logged in and tries to access a protected route, redirect to login.
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rule 2: If user is logged in and tries to access a public-only route, redirect to the dashboard.
  // The layout will then handle the specific role-based redirect.
  if (user && publicOnlyRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // All other cases, including authenticated users on protected routes, are allowed to proceed.
  // The protected layout will handle role-specific authorization.
  return response
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
