import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            The authentication link is invalid, has expired, or has already been used.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Please try signing in again or request a new link.
          </p>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="underline hover:text-primary">
              Return to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
