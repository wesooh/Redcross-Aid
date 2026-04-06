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
  const origin = headers().get('origin');
  const redirectUrl = `${origin}/auth/callback`;

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

  // Create the user in Supabase Auth.
  // A database trigger is expected to automatically create the corresponding
  // user profile in the `public.profiles` table.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      // This 'data' object is passed to the database trigger.
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    // Supabase will prevent creating a user with a duplicate email.
    // The error message is user-friendly enough to show directly.
    return {
      error: 'Could not create user: ' + authError.message,
    };
  }
  
  if (!authData.user) {
      return {
          error: "An unexpected error occurred. Account not created, please try again."
      }
  }

  // The manual profile creation has been removed from here to prevent race condition errors.
  // Your Supabase project should have a trigger that creates the profile automatically.
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
