'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
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

export async function signup(prevState: any, formData: FormData) {
  const supabase = createSupabaseServerClient();

  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Basic validation
  if (!fullName || !email || !password) {
      return { error: 'Please fill out all fields.' };
  }
  if (password.length < 6) {
      return { error: 'Password must be at least 6 characters long.' };
  }

  // The on_auth_user_created trigger in the database will create a public.profiles entry.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return {
      error: 'Could not create user: ' + error.message,
    };
  }

  return {
    message: 'Sign up successful! Please check your email for a verification link to complete your registration.',
  };
}


export async function requestPasswordReset(prevState: any, formData: FormData) {
  const supabase = createSupabaseServerClient()
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Please enter your email address.' }
  }

  // Get the redirect URL from the request headers
  const origin = headers().get('origin');
  const redirectUrl = `${origin}/auth/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    console.error('Password reset error:', error);
    // Don't reveal if the user exists or not for security reasons.
    return {
      message: 'If an account exists for this email, a password reset link has been sent. Please also check your spam folder.',
    };
  }

  return {
    message: 'If an account exists for this email, a password reset link has been sent. Please also check your spam folder.',
  };
}
