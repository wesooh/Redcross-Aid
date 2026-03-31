'use server';

import { z } from 'zod';
import { wallets } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const TransactionSchema = z.object({
  recipientId: z.string().min(1, { message: 'Recipient ID is required.' }),
  merchantId: z.string().min(1, { message: 'Merchant ID is required.' }),
  amount: z.number().positive({ message: 'Amount must be a positive number.' }),
});

export async function processTransaction(formData: { recipientId: string; merchantId: string; amount: number }) {
  const validatedFields = TransactionSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided.',
    };
  }

  const { recipientId, merchantId, amount } = validatedFields.data;

  // In a real app, these would be database transactions
  const recipientWallet = wallets.find((w) => w.userId === recipientId);
  const merchantWallet = wallets.find((w) => w.userId === merchantId);

  if (!recipientWallet) {
    return { error: 'Recipient wallet not found.' };
  }

  if (!merchantWallet) {
    return { error: 'Merchant wallet not found.' };
  }

  if (recipientWallet.balance < amount) {
    return { error: 'Insufficient funds.' };
  }

  // Simulate atomic transaction
  try {
    // Debit recipient
    recipientWallet.balance -= amount;
    recipientWallet.transactions.unshift({
      id: `txn-${Date.now()}`,
      amount: amount,
      type: 'debit',
      description: `Purchase at ${merchantId}`, // In real app, look up merchant name
      timestamp: new Date().toISOString(),
    });

    // Credit merchant
    merchantWallet.balance += amount;
    merchantWallet.transactions.unshift({
        id: `txn-${Date.now()}-credit`,
        amount: amount,
        type: 'credit',
        description: `Payment from ${recipientId}`,
        timestamp: new Date().toISOString(),
    });
    
    revalidatePath('/wallet');
    
    return { success: 'Transaction successful!' };
  } catch (e) {
    // In a real DB transaction, we would roll back here.
    // For this simulation, we'll just log the error.
    console.error('Transaction failed:', e);
    return { error: 'Transaction failed. Please try again.' };
  }
}
