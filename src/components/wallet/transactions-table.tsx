import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
                <TableCell className="font-medium">{format(new Date(tx.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  {tx.description}
                </TableCell>
                <TableCell
                  className={cn('text-right font-semibold', tx.amount >= 0 ? 'text-green-600' : 'text-destructive')}
                >
                  {tx.amount >= 0 ? '+' : ''}{new Intl.NumberFormat('en-KE', {
                    style: 'currency',
                    currency: 'KES',
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
