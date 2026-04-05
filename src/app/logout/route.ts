import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();

  // This will clear the session cookie and sign the user out.
  await supabase.auth.signOut();

  // Invalidate all cached data to ensure a clean state.
  revalidatePath('/', 'layout');
  
  // Redirect to the login page.
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/login';
  return NextResponse.redirect(redirectUrl);
}
