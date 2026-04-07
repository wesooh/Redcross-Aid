import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote } from 'lucide-react';

export function BalanceCard({ balance }: { balance: number }) {
  const formattedBalance = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(balance);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
        <Banknote className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-primary">{formattedBalance}</div>
        <p className="text-xs text-muted-foreground">Available to spend at approved merchants</p>
      </CardContent>
    </Card>
  );
}
