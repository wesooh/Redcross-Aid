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
  
  if (!user) {
    // If user is not logged in and is trying to access a protected route, redirect to login
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
    return response;
  }

  // --- From here, we know the user is logged in ---
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  const role = profile?.role;
  
  // 1. Redirect from root or login page to role-specific dashboard
  if (pathname === '/' || pathname === '/login') {
    switch(role) {
      case 'admin':
        return NextResponse.redirect(new URL('/admin', request.url));
      case 'volunteer':
        return NextResponse.redirect(new URL('/volunteer', request.url));
      case 'merchant':
        return NextResponse.redirect(new URL('/merchant', request.url));
      case 'victim':
        return NextResponse.redirect(new URL('/dashboard', request.url));
      default: // Fallback for users without a role yet
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. Enforce access control on protected routes
  if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/volunteer') && role !== 'volunteer' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/merchant') && role !== 'merchant' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  // Wallet is primarily for victims, but admins might need access for inspection.
  if (pathname.startsWith('/wallet') && role !== 'victim' && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

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
