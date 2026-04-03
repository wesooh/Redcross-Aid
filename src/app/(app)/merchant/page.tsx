import { PaymentForm } from '@/components/merchant/payment-form';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';

async function getMerchants() {
    const supabase = createSupabaseServerAdminClient();
    const { data: merchants, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'merchant');
    
    if (error) {
        console.error('Error fetching merchants:', error);
        return [];
    }
    return merchants || [];
}

export default async function MerchantPage() {
  const merchants = await getMerchants();
  return (
    <div>
      <PaymentForm merchants={merchants} />
    </div>
  );
}
