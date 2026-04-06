'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HandHeart, Loader2 } from 'lucide-react';
import { requestPasswordReset } from '@/app/actions/auth';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? 'Sending Link...' : 'Send Reset Link'}
        </Button>
    );
}

export default function ForgotPasswordPage() {
    const [state, formAction] = useActionState(requestPasswordReset, undefined);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-4">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                        <HandHeart className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center">Forgot Your Password?</CardTitle>
                    <CardDescription className="text-center">
                        No problem. Enter your email address below and we'll send you a link to reset it.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {state?.message ? (
                         <div className="space-y-4 text-center">
                            <p className="text-sm text-green-600 bg-green-500/10 p-3 rounded-md">{state.message}</p>
                            <p className="text-xs text-muted-foreground">Please check your inbox (and spam folder). The link may take a few minutes to arrive.</p>
                            <div className="mt-4 text-center text-sm">
                                <Link href="/login" className="underline hover:text-primary">
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                     ) : (
                        <form action={formAction} className="space-y-4">
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

                            {state?.error && (
                                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                                    {state.error}
                                </p>
                            )}

                            <SubmitButton />
                             <div className="mt-4 text-center text-sm">
                                Remembered your password?{' '}
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
