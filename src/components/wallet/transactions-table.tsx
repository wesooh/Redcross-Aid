import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">{format(new Date(tx.timestamp), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  {tx.description}
                </TableCell>
                <TableCell
                  className={cn('text-right font-semibold', tx.type === 'credit' ? 'text-green-600' : 'text-destructive')}
                >
                  {tx.type === 'credit' ? '+' : '-'}{new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(tx.amount)}
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No transactions yet.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
