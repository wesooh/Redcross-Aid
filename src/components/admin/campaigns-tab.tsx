'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCampaign } from '@/app/actions/admin';
import type { Campaign } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Textarea } from '../ui/textarea';

function CreateCampaignForm() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [formKey, setFormKey] = useState(Date.now());

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        startTransition(async () => {
            const result = await createCampaign({ name, description });
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Success', description: result.success });
                setFormKey(Date.now());
            }
        });
    };

    return (
        <Card key={formKey}>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>Create New Campaign</CardTitle>
                    <CardDescription>Define a new campaign for aid disbursement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input id="name" name="name" placeholder="e.g., Likoni Flood Relief" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="Optional: A brief description of the campaign's goals." />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Campaign
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}


function CampaignsList({ campaigns }: { campaigns: Campaign[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Existing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.map((campaign) => (
                            <TableRow key={campaign.id}>
                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                <TableCell>{campaign.description}</TableCell>
                                <TableCell>{format(new Date(campaign.created_at), 'PPP')}</TableCell>
                            </TableRow>
                        ))}
                        {campaigns.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    No campaigns found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export function CampaignsTab({ campaigns }: { campaigns: Campaign[] }) {
    return (
        <div className="grid gap-8 md:grid-cols-2">
            <CreateCampaignForm />
            <CampaignsList campaigns={campaigns} />
        </div>
    )
}
