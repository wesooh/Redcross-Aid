'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';
import Twilio from 'twilio';
import { kenyanCounties } from '@/lib/data';

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
  county: z.string().refine(val => kenyanCounties.includes(val), { message: "Invalid county selected." }),
});

export async function registerMerchant(formData: { fullName: string, phoneNumber?: string, county: string }) {
  const validatedFields = MerchantRegistrationSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { fullName, phoneNumber, county } = validatedFields.data;
  const supabase = createSupabaseServerAdminClient();

  const { data: merchantId, error } = await supabase.rpc('register_merchant', {
    p_full_name: fullName,
    p_phone_number: phoneNumber,
  });

  if (error) {
    console.error('Error registering merchant:', error);
    return { error: 'Failed to register merchant. ' + error.message };
  }

  if (merchantId) {
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ county: county })
        .eq('id', merchantId);
    
    if (updateError) {
        console.error('Error updating merchant county:', updateError);
        // Don't fail the whole process, just log it.
    }
  }

  revalidatePath('/admin'); // Revalidate admin to show new merchants if listed
  revalidatePath('/merchant'); // Revalidate merchant page to update dropdown
  return { success: `Successfully registered merchant ${fullName} with ID: ${merchantId}` };
}

const VolunteerRegistrationSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.'}),
  phoneNumber: z.string().optional(),
  county: z.string().refine(val => kenyanCounties.includes(val), { message: "Invalid county selected." }),
});

export async function registerVolunteer(formData: { fullName: string, email: string, phoneNumber?: string, county: string }) {
  const validatedFields = VolunteerRegistrationSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      error: 'Invalid data provided: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { fullName, email, phoneNumber, county } = validatedFields.data;
  const supabase = createSupabaseServerAdminClient();

  // This will create the user in Supabase Auth and send them a magic link to set their password
  const { data: { user }, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);

  if (inviteError) {
    console.error('Error inviting volunteer:', inviteError);
    return { error: 'Failed to invite volunteer. ' + inviteError.message };
  }

  // This RPC creates their profile in the public.profiles table
  const { error } = await supabase.rpc('register_volunteer', {
    p_full_name: fullName,
    p_email: email, // Pass email to store in profile
    p_phone_number: phoneNumber,
  });

  if (error) {
    console.error('Error registering volunteer profile:', error);
    // TODO: We should probably delete the invited user if the profile creation fails.
    return { error: 'Failed to register volunteer profile. ' + error.message };
  }

  // Update the new profile with the county
  if (user) {
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ county: county })
        .eq('id', user.id);
    
    if (updateError) {
        console.error('Error updating volunteer county:', updateError);
        // Don't fail the whole process, just log it.
    }
  }

  revalidatePath('/admin');
  return { success: `Successfully invited and registered volunteer ${fullName}.` };
}
