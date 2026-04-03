'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { disburseAidToVictims } from '@/app/actions/admin';
import type { Victim } from '@/lib/definitions';

export function DisbursementForm({ victims }: { victims: Victim[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [formKey, setFormKey] = useState(Date.now());

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const victimIdsRaw = (formData.get('victimIds') as string) || '';
    const victimIds = victimIdsRaw.split(',').map(id => id.trim()).filter(Boolean);

    if (victimIds.length === 0) {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'Please enter at least one Victim ID.' });
        return;
    }

    startTransition(async () => {
      const result = await disburseAidToVictims({ victimIds, amount });
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Disbursement Failed',
          description: result.error,
        });
      } else {
        toast({
          title: 'Disbursement Successful',
          description: `Disbursed $${amount.toFixed(2)} to ${victimIds.length} victim(s).`,
        });
        setFormKey(Date.now()); // Reset form
      }
    });
  };

  return (
    <Card key={formKey} className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Disburse Aid Funds</CardTitle>
          <CardDescription>
            Add funds to multiple victim wallets at once. Enter a comma-separated list of Victim IDs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="victimIds">Victim IDs</Label>
            <Textarea 
                id="victimIds" 
                name="victimIds" 
                placeholder="Enter comma-separated UUIDs..." 
                required 
                rows={4}
            />
             <p className="text-xs text-muted-foreground pt-2">
                Available victim profiles: {victims.length > 0 ? victims.map(v => `${v.full_name} (${v.id})`).join(', ') : 'None found.'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (per victim)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="100.00" required />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Disburse Funds
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
