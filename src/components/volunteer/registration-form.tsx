'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerVictim } from '@/app/actions/volunteer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { kenyanCounties } from '@/lib/data';

export function RegistrationForm() {
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
    const nationalId = formData.get('nationalId') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    
    startTransition(async () => {
      const result = await registerVictim({ fullName, nationalId, phoneNumber, county: selectedCounty });
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
    <Card key={formKey} className="max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Register New Victim</CardTitle>
          <CardDescription>Onboard a new aid recipient. This will create their profile and a linked digital wallet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" placeholder="e.g., Jane Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID</Label>
            <Input id="nationalId" name="nationalId" placeholder="Victim's official ID number" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Select name="county" required onValueChange={setSelectedCounty} value={selectedCounty}>
              <SelectTrigger>
                <SelectValue placeholder="Select victim's county" />
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
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="+254 712 345678" />
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
