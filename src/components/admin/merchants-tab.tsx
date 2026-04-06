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
import { kenyanCounties } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function RegisterMerchantForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [formKey, setFormKey] = useState(Date.now()); // To reset the form
  const [selectedCounty, setSelectedCounty] = useState<string | undefined>();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCounty) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a county.' });
        return;
    }
    const formData = new FormData(event.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    
    startTransition(async () => {
      const result = await registerMerchant({ fullName, email, phoneNumber, county: selectedCounty });
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
        setSelectedCounty(undefined);
      }
    });
  };

  return (
    <Card key={formKey}>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Register New Merchant</CardTitle>
          <CardDescription>Onboard a new local shop owner. They will be sent an email to verify their account and set a password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Merchant's Full Name</Label>
            <Input id="fullName" name="fullName" placeholder="e.g., Juma's General Store" required />
          </div>
           <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="merchant@example.com" required />
          </div>
           <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Select name="county" required onValueChange={setSelectedCounty} value={selectedCounty}>
              <SelectTrigger>
                <SelectValue placeholder="Select merchant's county" />
              </SelectTrigger>
              <SelectContent>
                {kenyanCounties.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
            <div className="flex items-center gap-2">
                <span className="inline-flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">+254</span>
                <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="712 345 678" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Invite & Register Merchant
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
                            <TableHead>County</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Date Registered</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {merchants.map((merchant) => (
                            <TableRow key={merchant.id}>
                                <TableCell className="font-medium">{merchant.full_name}</TableCell>
                                <TableCell>{merchant.county || 'N/A'}</TableCell>
                                <TableCell>{merchant.phone_number || 'N/A'}</TableCell>
                                <TableCell>{format(new Date(merchant.created_at), 'PPP')}</TableCell>
                            </TableRow>
                        ))}
                        {merchants.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
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
