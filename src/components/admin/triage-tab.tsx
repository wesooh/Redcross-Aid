'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TriageSession, Victim } from '@/lib/definitions';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

function getRiskBadgeVariant(score: number | null) {
    if (score === null) return 'secondary';
    if (score > 0.85) return 'destructive';
    if (score > 0.6) return 'default'; // Using primary for medium
    return 'secondary';
}

export function TriageTab({ sessions, victims }: { sessions: TriageSession[], victims: Victim[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>PFA Triage Sessions</CardTitle>
                <CardDescription>Conversations flagged by the AI for high-risk sentiment. Review and take action as needed.</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
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
                                    <TableCell className="max-w-xs truncate">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <p className="truncate text-left">{session.last_message}</p>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-sm">{session.last_message}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
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
                </TooltipProvider>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 border-t pt-4 text-sm text-muted-foreground">
                 <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <p className="font-semibold">How to Test PFA Triage:</p>
                 </div>
                 <p>To test the chatbot, you must use a valid Victim ID from your database. The triage system will only log a conversation if the AI detects a high risk score (&gt;0.85) AND the user ID exists.</p>
                 <p>Copy an ID below and paste it as the `FAKE_USER_ID` in <code className="font-mono bg-muted p-1 rounded">src/components/pfa-chatbot/chat-layout.tsx</code>.</p>
                 <ul className="list-disc pl-5 space-y-1 mt-2 max-h-24 overflow-y-auto">
                    {victims.length > 0 ? victims.map(v => (
                        <li key={v.id}>
                            <span className="font-medium text-foreground">{v.full_name}:</span> <code className="font-mono text-xs">{v.id}</code>
                        </li>
                    )) : (
                        <li>No victims found. Please register one via the 'Volunteer' page.</li>
                    )}
                 </ul>
            </CardFooter>
        </Card>
    );
}
