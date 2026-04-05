'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerVolunteer } from '@/app/actions/admin';

export function VolunteersTab() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [formKey, setFormKey] = useState(Date.now()); // To reset the form

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    
    startTransition(async () => {
      const result = await registerVolunteer({ fullName, email, phoneNumber });
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
    <Card key={formKey} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Register New Volunteer</CardTitle>
          <CardDescription>Onboard a new volunteer. They will be sent an email to verify their account and set a password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Volunteer's Full Name</Label>
            <Input id="fullName" name="fullName" placeholder="e.g., John Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="volunteer@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="+254 712 345678" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Invite & Register Volunteer
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
