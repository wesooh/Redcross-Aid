
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Victim } from '@/lib/definitions';
import { format } from 'date-fns';
import { deleteUser } from '@/app/actions/admin';
import { DeleteDialogButton } from '@/components/shared/delete-dialog-button';

export function VictimsTab({ victims }: { victims: Victim[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>All Victims</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>County</TableHead>
                            <TableHead>National ID</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Date Registered</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {victims.map((victim) => (
                            <TableRow key={victim.id}>
                                <TableCell className="font-medium">{victim.full_name}</TableCell>
                                <TableCell>{victim.county || 'N/A'}</TableCell>
                                <TableCell>{victim.national_id || 'N/A'}</TableCell>
                                <TableCell>{victim.phone_number || 'N/A'}</TableCell>
                                <TableCell>{format(new Date(victim.created_at), 'PPP')}</TableCell>
                                <TableCell className="text-right">
                                   <DeleteDialogButton
                                       itemId={victim.id}
                                       itemName={victim.full_name || 'victim'}
                                       deleteAction={deleteUser}
                                       actionParamName="userId"
                                       itemType="victim"
                                   />
                                </TableCell>
                            </TableRow>
                        ))}
                        {victims.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No victims found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
