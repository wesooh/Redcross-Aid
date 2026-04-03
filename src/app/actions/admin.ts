'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';

const DisbursementSchema = z.object({
  victimIds: z.array(z.string().uuid()),
  amount: z.number().positive(),
});

export async function disburseAidToVictims(formData: { victimIds: string[], amount: number }) {
  const validatedFields = DisbursementSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { victimIds, amount } = validatedFields.data;
  const supabase = createSupabaseServerAdminClient();

  const { data, error } = await supabase.rpc('disburse_aid', {
    victim_profile_ids: victimIds,
    disbursement_amount: amount,
    idempotency_key_prefix: `batch-${crypto.randomUUID()}`
  });

  if (error) {
    console.error('Disbursement RPC error:', error);
    return { error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/wallet'); // affects victim wallets
  return { success: data };
}
