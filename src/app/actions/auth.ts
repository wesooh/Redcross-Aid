'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export async function login(prevState: any, formData: FormData) {
  const supabase = createSupabaseServerClient()

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      error: 'Could not authenticate user. Please check your credentials.',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
