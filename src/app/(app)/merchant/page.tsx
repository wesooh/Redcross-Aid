import { PaymentForm } from '@/components/merchant/payment-form';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';
import type { Merchant } from '@/lib/definitions';

async function getMerchants() {
    const supabase = createSupabaseServerAdminClient();
    const { data: merchants, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'merchant');
    
    if (error) {
        console.error('Error fetching merchants:', error);
        return [];
    }
    return (merchants as Merchant[]) || [];
}

export default async function MerchantPage() {
  const merchants = await getMerchants();
  return (
    <div>
      <PaymentForm merchants={merchants} />
    </div>
  );
}
