'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';
import Twilio from 'twilio';

const DisbursementSchema = z.object({
  victimIds: z.array(z.string().uuid()),
  amount: z.number().positive(),
  campaignId: z.string().uuid(),
});

export async function disburseAidToVictims(formData: { victimIds: string[], amount: number, campaignId: string }) {
  const validatedFields = DisbursementSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { victimIds, amount, campaignId } = validatedFields.data;
  const supabase = createSupabaseServerAdminClient();

  const { data, error } = await supabase.rpc('disburse_aid', {
    victim_profile_ids: victimIds,
    disbursement_amount: amount,
    idempotency_key_prefix: `batch-${crypto.randomUUID()}`,
    p_campaign_id: campaignId,
  });

  if (error) {
    console.error('Disbursement RPC error:', error);
    return { error: error.message };
  }

  // --- SMS Notification Logic ---
  const { data: victims, error: victimsError } = await supabase
    .from('profiles')
    .select('full_name, phone_number')
    .in('id', victimIds)
    .not('phone_number', 'is', null);

  if (victimsError) {
    console.error('Error fetching victim profiles for SMS notification:', victimsError);
    // Do not block the entire process if fetching for SMS fails.
  }

  if (victims && victims.length > 0) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber || accountSid === 'YOUR_TWILIO_ACCOUNT_SID') {
      console.warn('Twilio credentials are not set in .env. Skipping SMS notifications.');
    } else {
      try {
        const client = new Twilio(accountSid, authToken);
        const smsPromises = victims.map(victim => {
          if (victim.phone_number) {
            const message = `Habari ${victim.full_name || ''}, Red Cross has sent you ${amount} KES for food via ResilienceLink. Use your QR code at any partner shop.`;
            return client.messages.create({
              body: message,
              from: twilioPhoneNumber,
              to: victim.phone_number,
            });
          }
          return null;
        }).filter(Boolean);

        if (smsPromises.length > 0) {
            await Promise.all(smsPromises);
            console.log(`Successfully initiated ${smsPromises.length} SMS notifications.`);
        }

      } catch (smsError: any) {
        console.error('Twilio SMS sending failed:', smsError.message);
        // Do not return error to UI, just log it. The primary action (disbursement) was successful.
      }
    }
  }
  // --- End SMS Notification Logic ---


  revalidatePath('/admin');
  revalidatePath('/wallet'); // affects victim wallets
  return { success: data };
}

const CampaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters.'),
  description: z.string().optional(),
});

export async function createCampaign(formData: { name: string, description?: string }) {
    const validatedFields = CampaignSchema.safeParse(formData);
    if (!validatedFields.success) {
        return { error: 'Invalid data: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
    }

    const { name, description } = validatedFields.data;
    const supabase = createSupabaseServerAdminClient();

    const { error } = await supabase.from('campaigns').insert({ name, description });

    if (error) {
        console.error('Error creating campaign:', error);
        return { error: error.message };
    }

    revalidatePath('/admin');
    return { success: `Campaign "${name}" created successfully.`};
}

const MerchantRegistrationSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  phoneNumber: z.string().optional(),
});

export async function registerMerchant(formData: { fullName: string, phoneNumber?: string }) {
  const validatedFields = MerchantRegistrationSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { fullName, phoneNumber } = validatedFields.data;
  const supabase = createSupabaseServerAdminClient();

  const { data, error } = await supabase.rpc('register_merchant', {
    p_full_name: fullName,
    p_phone_number: phoneNumber,
  });

  if (error) {
    console.error('Error registering merchant:', error);
    return { error: 'Failed to register merchant. ' + error.message };
  }

  revalidatePath('/admin'); // Revalidate admin to show new merchants if listed
  revalidatePath('/merchant'); // Revalidate merchant page to update dropdown
  return { success: `Successfully registered merchant ${fullName} with ID: ${data}` };
}

const VolunteerRegistrationSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  phoneNumber: z.string().optional(),
});

export async function registerVolunteer(formData: { fullName: string, phoneNumber?: string }) {
  const validatedFields = VolunteerRegistrationSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { fullName, phoneNumber } = validatedFields.data;
  const supabase = createSupabaseServerAdminClient();

  const { data, error } = await supabase.rpc('register_volunteer', {
    p_full_name: fullName,
    p_phone_number: phoneNumber,
  });

  if (error) {
    console.error('Error registering volunteer:', error);
    return { error: 'Failed to register volunteer. ' + error.message };
  }

  revalidatePath('/admin');
  return { success: `Successfully registered volunteer ${fullName} with ID: ${data}` };
}
