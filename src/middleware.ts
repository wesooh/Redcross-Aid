import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Add the pathname to the request headers for use in server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-pathname', request.nextUrl.pathname);

  // Pass the enriched request to the session handler
  const response = await updateSession(NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  }));

  // The updateSession function returns a response, which we return here.
  // We need to handle the request object within the updateSession function to avoid this complexity.
  // Let's refactor this slightly for clarity.

  const newRequest = new NextRequest(request.url, {
    headers: requestHeaders,
  });

  return await updateSession(newRequest);
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
