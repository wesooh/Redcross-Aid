import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
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
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Rule 1: If user is not logged in and tries to access a protected route, redirect to login.
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // --- From here, we know the user is logged in OR is on a public route. ---

  // Rule 2: If a logged-in user tries to access the login page or root, redirect them to their dashboard.
  if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role;
    switch(role) {
        case 'admin': return NextResponse.redirect(new URL('/admin', request.url));
        case 'volunteer': return NextResponse.redirect(new URL('/volunteer', request.url));
        case 'merchant': return NextResponse.redirect(new URL('/merchant', request.url));
        case 'victim': return NextResponse.redirect(new URL('/dashboard', request.url));
        default: return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Rule 3: Enforce role-based access for protected routes for logged-in users.
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role;

    // If a user has no profile/role yet, they can only access general pages.
    if (!role) {
        if (pathname !== '/dashboard' && pathname !== '/pfa-chatbot') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    } else {
        // Check authorization for specific roles.
        if (pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (pathname.startsWith('/volunteer') && !['admin', 'volunteer'].includes(role)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (pathname.startsWith('/merchant') && !['admin', 'merchant'].includes(role)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (pathname.startsWith('/wallet') && !['admin', 'victim'].includes(role)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }
  }

  // If all checks pass, allow the request to proceed.
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
