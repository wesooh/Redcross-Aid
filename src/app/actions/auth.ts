'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client'

export async function login(prevState: any, formData: FormData) {
  const supabase = createSupabaseServerClient()

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return {
      error: 'Could not authenticate user. Please check your credentials.',
    }
  }

  // Fetch role right after login to perform a direct, role-based redirect.
  // Use the ADMIN client to bypass RLS for this critical check.
  const supabaseAdmin = createSupabaseServerAdminClient();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  revalidatePath('/', 'layout')

  // IMPORTANT: This switch statement directs users to the correct dashboard.
  switch(profile?.role) {
    case 'admin':
      redirect('/admin');
      break;
    case 'volunteer':
      redirect('/volunteer');
      break;
    case 'merchant':
      redirect('/merchant');
      break;
    case 'victim':
      redirect('/dashboard');
      break;
    default:
      // This is a fallback. If a user has no role, log them out and show an error.
      await supabase.auth.signOut();
      return {
        error: 'Login failed: Could not determine user role. Please contact support.',
      }
  }
}
