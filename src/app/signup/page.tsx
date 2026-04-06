'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HandHeart, Loader2, Eye, EyeOff } from 'lucide-react';
import { signup } from '@/app/actions/auth';
import Image from 'next/image';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? 'Creating Account...' : 'Create Account'}
        </Button>
    );
}

export default function SignupPage() {
    const [state, formAction] = useActionState(signup, undefined);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative flex min-h-screen items-center justify-center p-4">
            <Image
                src="/redcross.jpg"
                alt="Red Cross humanitarian aid background"
                fill
                className="object-cover"
                priority
                sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/40" />
            <Card className="mx-auto max-w-sm w-full z-10">
                <CardHeader className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                        <HandHeart className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
                    <CardDescription className="text-center">
                        Enter your details to register. You will receive a verification email.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {state?.message ? (
                         <div className="space-y-4 text-center">
                            <p className="text-sm text-green-600 bg-green-500/10 p-3 rounded-md">{state.message}</p>
                            <div className="mt-4 text-center text-sm">
                                <Link href="/login" className="underline hover:text-primary">
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                     ) : (
                        <form action={formAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="Jane Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input 
                                        id="password" 
                                        name="password" 
                                        type={showPassword ? "text" : "password"} 
                                        required 
                                        minLength={6}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">Must be at least 6 characters long.</p>
                            </div>

                            {state?.error && (
                                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                                    {state.error}
                                </p>
                            )}

                            <SubmitButton />
                             <div className="mt-4 text-center text-sm">
                                Already have an account?{' '}
                                <Link href="/login" className="underline hover:text-primary">
                                    Login
                                </Link>
                            </div>
                        </form>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
