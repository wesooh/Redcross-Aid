'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/app/actions/auth';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { HandHeart, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
                    <CardTitle className="text-2xl text-center">Redcross Trust Login</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials or continue as a guest.
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
                                <Link
                                    href="/auth/forgot-password"
                                    className="ml-auto inline-block text-sm underline hover:text-primary"
                                >
                                    Forgot your password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input 
                                    id="password" 
                                    name="password" 
                                    type={showPassword ? "text" : "password"} 
                                    required 
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
                        </div>
                        {state?.error && (
                            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                                {state.error}
                            </p>
                        )}
                        <LoginButton />
                    </form>

                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="underline hover:text-primary">
                            Sign up
                        </Link>
                    </div>

                    <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-muted"></div>
                        <span className="flex-shrink mx-4 text-xs text-muted-foreground">OR</span>
                        <div className="flex-grow border-t border-muted"></div>
                    </div>

                    <Button variant="secondary" className="w-full" asChild>
                        <Link href="/admin">Continue as Guest Admin</Link>
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}
