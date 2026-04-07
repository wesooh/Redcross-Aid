import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // On successful email verification, redirect to the login page with a success message.
      // This provides a better user experience than a direct, sometimes jarring, redirect to the dashboard.
      return NextResponse.redirect(`${origin}/login?message=verification_success`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
