'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerMerchant } from '@/app/actions/admin';
import type { Merchant } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

function RegisterMerchantForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [formKey, setFormKey] = useState(Date.now()); // To reset the form

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = formData.get('fullName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    
    startTransition(async () => {
      const result = await registerMerchant({ fullName, phoneNumber });
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: result.error,
        });
      } else {
        toast({
          title: 'Registration Successful',
          description: result.success,
        });
        setFormKey(Date.now()); // Reset form
      }
    });
  };

  return (
    <Card key={formKey}>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Register New Merchant</CardTitle>
          <CardDescription>Onboard a new local shop owner (Duka) to the platform. A digital wallet will be created for them automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Merchant's Full Name</Label>
            <Input id="fullName" name="fullName" placeholder="e.g., Juma's General Store" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="+254 712 345678" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Register Merchant
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}


function MerchantsList({ merchants }: { merchants: Merchant[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Existing Merchants</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Date Registered</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {merchants.map((merchant) => (
                            <TableRow key={merchant.id}>
                                <TableCell className="font-medium">{merchant.full_name}</TableCell>
                                <TableCell>{merchant.phone_number || 'N/A'}</TableCell>
                                <TableCell>{format(new Date(merchant.created_at), 'PPP')}</TableCell>
                            </TableRow>
                        ))}
                        {merchants.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    No merchants found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export function MerchantsTab({ merchants }: { merchants: Merchant[] }) {
    return (
        <div className="grid gap-8 md:grid-cols-2">
            <RegisterMerchantForm />
            <MerchantsList merchants={merchants} />
        </div>
    )
}
