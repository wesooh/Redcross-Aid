'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerVictim } from '@/app/actions/volunteer';

export function RegistrationForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [formKey, setFormKey] = useState(Date.now()); // To reset the form

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = formData.get('fullName') as string;
    
    startTransition(async () => {
      const result = await registerVictim({ fullName });
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
    <Card key={formKey} className="max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Register New Victim</CardTitle>
          <CardDescription>Create a new profile and digital wallet for an aid recipient.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" placeholder="e.g., Jane Doe" required />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Register Victim
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
