'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TriageSession } from '@/lib/definitions';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function getRiskBadgeVariant(score: number | null) {
    if (score === null) return 'secondary';
    if (score > 0.85) return 'destructive';
    if (score > 0.6) return 'default'; // Using primary for medium
    return 'secondary';
}

export function TriageTab({ sessions }: { sessions: TriageSession[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>PFA Triage Sessions</CardTitle>
                <CardDescription>Conversations flagged by the AI for high-risk sentiment. Review and take action as needed.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Victim</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Last Message</TableHead>
                            <TableHead className="text-center">Risk Score</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.map((session) => (
                            <TableRow key={session.id}>
                                <TableCell className="font-medium">{session.profiles?.full_name || 'Unknown'}</TableCell>
                                <TableCell>{format(new Date(session.created_at), 'MMM d, h:mm a')}</TableCell>
                                <TableCell className="max-w-xs truncate">{session.last_message}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={getRiskBadgeVariant(session.risk_score)}>
                                        {(session.risk_score || 0).toFixed(2)}
                                    </Badge>
                                </TableCell>
                                <TableCell className={cn('text-right font-semibold capitalize', session.status === 'open' ? 'text-destructive' : 'text-green-600')}>
                                    {session.status}
                                </TableCell>
                            </TableRow>
                        ))}
                        {sessions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No high-risk sessions have been flagged yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
