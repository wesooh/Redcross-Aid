'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';

const TransactionSchema = z.object({
  recipientId: z.string().uuid({ message: 'Invalid Recipient ID.' }),
  merchantId: z.string().uuid({ message: 'Invalid Merchant ID.' }),
  amount: z.number().positive({ message: 'Amount must be a positive number.' }),
});

export async function processTransaction(formData: { recipientId: string; merchantId: string; amount: number }) {
  const validatedFields = TransactionSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { recipientId, merchantId, amount } = validatedFields.data;
  const idempotencyKey = crypto.randomUUID();
  const supabase = createSupabaseServerAdminClient();

  const { data, error } = await supabase.rpc('process_aid_purchase', {
    victim_profile_id: recipientId,
    merchant_profile_id: merchantId,
    purchase_amount: amount,
    idempotency_key: idempotencyKey,
  });

  if (error) {
    console.error('Supabase RPC error:', error);
    return { error: error.message };
  }
  
  // Revalidate paths to update UI
  revalidatePath('/wallet');
  revalidatePath('/merchant');
  
  return { success: data };
}
