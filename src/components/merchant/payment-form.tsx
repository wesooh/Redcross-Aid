'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processTransaction } from '@/app/actions/wallet';
import type { Merchant } from '@/lib/definitions';

export function PaymentForm({ merchants }: { merchants: Merchant[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [formKey, setFormKey] = useState(Date.now()); // To reset the form

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const recipientId = formData.get('recipientId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const merchantId = formData.get('merchantId') as string;

    startTransition(async () => {
      const result = await processTransaction({ recipientId, merchantId, amount });
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Transaction Failed',
          description: result.error,
        });
      } else {
        toast({
          title: 'Transaction Successful',
          description: `Processed payment of $${amount.toFixed(2)}.`,
        });
        setFormKey(Date.now()); // Reset form by changing key
      }
    });
  };

  return (
    <Card key={formKey} className="max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Merchant Payment Terminal</CardTitle>
          <CardDescription>Enter recipient ID and amount to process a payment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientId">Recipient ID (from QR Code)</Label>
            <Input id="recipientId" name="recipientId" placeholder="e.g., a UUID like 123e4567-..." required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchantId">Your Merchant Profile</Label>
               <select
                id="merchantId"
                name="merchantId"
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {merchants.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>
                    {merchant.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Process Payment
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
