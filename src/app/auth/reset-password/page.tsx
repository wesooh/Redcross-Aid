'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HandHeart, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);

  useEffect(() => {
    // This listener handles the case where the user lands on this page
    // after clicking a password recovery link. The link contains a hash
    // that Supabase uses to create a temporary recovery session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCanUpdate(true);
      }
    });

    // This handles the case where an invited user (e.g., merchant/volunteer)
    // is logged in via a magic link and redirected here to set their password.
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCanUpdate(true);
        }
    };
    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        setIsSubmitting(false);
        return;
    }

    // This single function works for both password recovery (using the token from the URL)
    // and for an already logged-in user setting their password for the first time.
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('Your password has been set successfully! You can now log in.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
    setIsSubmitting(false);
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-4">
            <div className="flex items-center justify-center gap-2">
                <HandHeart className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Set Your Password</CardTitle>
            <CardDescription className="text-center">
                Please enter a new password for your account below.
            </CardDescription>
        </CardHeader>
        <CardContent>
          {canUpdate ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  name="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  minLength={6}
                />
              </div>
              
              {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}
              {message && <p className="text-sm text-green-600 bg-green-500/10 p-2 rounded-md">{message}</p>}

              <Button className="w-full" type="submit" disabled={isSubmitting || !!message}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving Password...' : 'Set New Password'}
              </Button>
            </form>
          ) : (
            <div className="text-center text-sm text-destructive space-y-4">
                 <p>This link is invalid or has expired. Please request a new one.</p>
                 <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/forgot-password">Request New Link</Link>
                </Button>
            </div>
          )}
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="underline hover:text-primary">
                Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
