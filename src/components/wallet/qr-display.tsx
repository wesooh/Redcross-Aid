import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode } from 'lucide-react';

export function QrDisplay({ userId }: { userId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Voucher Code</CardTitle>
        <CardDescription>Present this QR code to the merchant to make a payment.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4">
        <div className="rounded-lg border-4 border-primary bg-white p-4">
            <QrCode className="h-36 w-36 sm:h-48 sm:w-48 text-primary" strokeWidth={1} />
        </div>
        <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">ID: {userId}</p>
      </CardContent>
    </Card>
  );
}
