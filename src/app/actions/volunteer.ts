'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';

const RegistrationSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
});

export async function registerVictim(formData: { fullName: string }) {
  const validatedFields = RegistrationSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { fullName } = validatedFields.data;
  const supabase = createSupabaseServerAdminClient();

  // Use the RPC function to ensure atomic creation of profile and wallet
  const { data, error } = await supabase.rpc('register_victim', {
    full_name: fullName
  });
  
  if (error) {
    console.error('Error registering victim:', error);
    return { error: 'Failed to register victim. ' + error.message };
  }

  revalidatePath('/volunteer');
  revalidatePath('/admin'); // To update victim list on admin page
  return { success: `Successfully registered ${fullName} with ID: ${data}` };
}
