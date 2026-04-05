'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/app/actions/auth';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { HandHeart } from 'lucide-react';
import Image from 'next/image';

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" type="submit" disabled={pending}>
            {pending ? 'Signing In...' : 'Sign In'}
        </Button>
    );
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, undefined);

    return (
        <div className="relative flex min-h-screen items-center justify-center p-4">
             <Image
                src="/redcross.jpg"
                alt="Red Cross humanitarian aid background"
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
             <Card className="mx-auto max-w-sm w-full z-10">
                <CardHeader className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                        <HandHeart className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center">ResilienceLink Login</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            </div>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {state?.error && (
                            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                                {state.error}
                            </p>
                        )}
                        <LoginButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
