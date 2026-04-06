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
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // New state for the pasted URL
  const [recoveryUrl, setRecoveryUrl] = useState('');

  useEffect(() => {
    // If the recovery hash is in the URL on load, start checking.
    // Otherwise, we're waiting for the user to paste a URL, so stop the loader.
    if (!window.location.hash.includes('type=recovery')) {
        setIsCheckingSession(false);
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
        setIsCheckingSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
    setIsSubmitting(false);
  };
  
  const handleUrlSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!recoveryUrl) {
      setError('Please paste the recovery link.');
      return;
    }

    try {
      const url = new URL(recoveryUrl);
      if (!url.hash || !url.hash.includes('type=recovery')) {
        setError('This does not look like a valid Supabase recovery link.');
        return;
      }
      
      // Start the loading spinner and update the URL hash.
      // The `onAuthStateChange` listener in useEffect will detect the change.
      setIsCheckingSession(true);
      window.location.hash = url.hash;

    } catch (err) {
      setError('Invalid URL format. Please paste the full link.');
    }
  };

  const renderContent = () => {
    if (isCheckingSession) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      );
    }

    if (isRecoverySession) {
        return (
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
              {isSubmitting ? 'Resetting Password...' : 'Set New Password'}
            </Button>
          </form>
        );
    }

    // Default state: not checking and no recovery session. Show the URL paste form.
    return (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="recovery-url">Paste Recovery Link</Label>
                <Input
                    id="recovery-url"
                    name="recovery-url"
                    type="url"
                    value={recoveryUrl}
                    onChange={(e) => setRecoveryUrl(e.target.value)}
                    placeholder="Paste the full link here"
                    required
                />
                <p className="text-xs text-muted-foreground pt-1">
                    Get this link from the Supabase dashboard (Users &rarr; Send password recovery) and paste it here.
                </p>
            </div>
            
            {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}

            <Button className="w-full" type="submit" disabled={isCheckingSession}>
                Verify Pasted Link
            </Button>
        </form>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-4">
            <div className="flex items-center justify-center gap-2">
                <HandHeart className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Reset Your Password</CardTitle>
            <CardDescription className="text-center">
                {isRecoverySession ? "Enter a new password below." : "Paste your recovery link to begin."}
            </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
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
