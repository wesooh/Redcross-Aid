import { PaymentForm } from '@/components/merchant/payment-form';
import { merchants } from '@/lib/data';

export default function MerchantPage() {
  return (
    <div>
      <PaymentForm merchants={merchants} />
    </div>
  );
}
