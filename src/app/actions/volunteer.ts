'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';

const RegistrationSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  nationalId: z.string().min(5, { message: 'National ID must be at least 5 characters.'}),
  phoneNumber: z.string().optional(),
});

export async function registerVictim(formData: { fullName: string, nationalId: string, phoneNumber?: string }) {
  const validatedFields = RegistrationSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { fullName, nationalId, phoneNumber } = validatedFields.data;
  const supabase = createSupabaseServerAdminClient();

  // Use the RPC function to ensure atomic creation of profile and wallet
  const { data, error } = await supabase.rpc('register_victim', {
    p_full_name: fullName,
    p_national_id: nationalId,
    p_phone_number: phoneNumber
  });
  
  if (error) {
    console.error('Error registering victim:', error);
    return { error: 'Failed to register victim. ' + error.message };
  }

  revalidatePath('/volunteer');
  revalidatePath('/admin'); // To update victim list on admin page
  return { success: `Successfully registered ${fullName} with ID: ${data}` };
}
