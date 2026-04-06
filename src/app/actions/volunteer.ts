'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';
import { kenyanCounties } from '@/lib/data';

const RegistrationSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  nationalId: z.string().min(5, { message: 'National ID must be at least 5 characters.'}),
  phoneNumber: z.string().optional(),
  county: z.string().refine(val => kenyanCounties.includes(val), { message: "Invalid county selected." }),
});

export async function registerVictim(formData: { fullName: string, nationalId: string, phoneNumber?: string, county: string }) {
  const validatedFields = RegistrationSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { fullName, nationalId, phoneNumber, county } = validatedFields.data;
  const supabase = createSupabaseServerAdminClient();

  const formattedPhoneNumber = phoneNumber && phoneNumber.trim() !== ''
    ? `+254${phoneNumber.trim().replace(/^0|^\+254/, '')}`
    : undefined;

  // Use the RPC function to ensure atomic creation of profile and wallet, now including the county.
  const { data: victimId, error } = await supabase.rpc('register_victim', {
    p_full_name: fullName,
    p_national_id: nationalId,
    p_phone_number: formattedPhoneNumber,
    p_county: county
  });
  
  if (error) {
    console.error('Error registering victim:', error);
    return { error: 'Failed to register victim. ' + error.message };
  }

  revalidatePath('/volunteer');
  revalidatePath('/admin'); // To update victim list on admin page
  return { success: `Successfully registered ${fullName} with ID: ${victimId}` };
}
