import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisbursementForm } from "@/components/admin/disbursement-form";
import { CampaignsTab } from "@/components/admin/campaigns-tab";
import { MerchantsTab } from "@/components/admin/merchants-tab";
import { VolunteersTab } from "@/components/admin/volunteers-tab";
import { TriageTab } from "@/components/admin/triage-tab";
import type { Victim, Campaign, TriageSession, Merchant } from "@/lib/definitions";
import { StatCard } from "@/components/admin/stat-card";
import { Users, Banknote, ShieldAlert, HeartHandshake } from "lucide-react";

async function getAdminPageData() {
    const supabase = createSupabaseServerAdminClient();
    
    const victimsPromise = supabase
        .from('profiles')
        .select('id, full_name', { count: 'exact' })
        .eq('role', 'victim');

    const campaignsPromise = supabase
        .from('campaigns')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
    
    const triagePromise = supabase
        .from('triage_sessions')
        .select(`
            *,
            profiles ( full_name )
        `, { count: 'exact' })
        .eq('status', 'open')
        .order('risk_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

    const merchantsPromise = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'merchant')
        .order('created_at', { ascending: false });
    
    const disbursementPromise = supabase
        .from('ledger')
        .select('amount')
        .eq('transaction_type', 'AID_DISBURSEMENT')
        .lt('amount', 0); // Disbursements are negative amounts

    const [
        { data: victims, count: victimsCount, error: victimsError }, 
        { data: campaigns, count: campaignsCount, error: campaignsError },
        { data: triageSessions, count: triageCount, error: triageError },
        { data: merchants, error: merchantsError },
        { data: disbursements, error: disbursementError }
    ] = await Promise.all([
        victimsPromise,
        campaignsPromise,
        triagePromise,
        merchantsPromise,
        disbursementPromise
    ]);
    
    if (victimsError) console.error('Error fetching victims:', victimsError);
    if (campaignsError) console.error('Error fetching campaigns:', campaignsError);
    if (triageError) console.error('Error fetching triage sessions:', triageError);
    if (merchantsError) console.error('Error fetching merchants:', merchantsError);
    if (disbursementError) console.error('Error fetching disbursements:', disbursementError);

    const totalDisbursed = disbursements ? disbursements.reduce((sum, current) => sum - current.amount, 0) : 0;

    return { 
        victims: (victims || []) as Victim[],
        victimsCount: victimsCount || 0,
        campaigns: (campaigns || []) as Campaign[],
        campaignsCount: campaignsCount || 0,
        triageSessions: (triageSessions || []) as TriageSession[],
        triageCount: triageCount || 0,
        merchants: (merchants || []) as Merchant[],
        totalDisbursed
    };
}


export default async function AdminPage() {
    const { victims, victimsCount, campaigns, campaignsCount, triageSessions, triageCount, merchants, totalDisbursed } = await getAdminPageData();

    const formattedTotalDisbursed = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES', // Kenya Shillings
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(totalDisbursed);

    return (
        <div className="container mx-auto">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Oversee all platform activities and manage users.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard title="Total Victims" value={victimsCount} icon={Users} description="Total number of registered aid recipients." />
                <StatCard title="Total Disbursed" value={formattedTotalDisbursed} icon={Banknote} description="Total aid disbursed through all campaigns." />
                <StatCard title="Active Campaigns" value={campaignsCount} icon={HeartHandshake} description="Number of ongoing aid campaigns." />
                <StatCard title="Triage Alerts" value={triageCount} icon={ShieldAlert} description="Open high-risk cases needing review." />
            </div>

            <Tabs defaultValue="disbursement">
                <TabsList className="grid w-full max-w-2xl grid-cols-5">
                    <TabsTrigger value="disbursement">Disburse Aid</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="merchants">Register Merchant</TabsTrigger>
                    <TabsTrigger value="volunteers">Register Volunteer</TabsTrigger>
                    <TabsTrigger value="triage">PFA Triage</TabsTrigger>
                </TabsList>
                <TabsContent value="disbursement">
                    <DisbursementForm victims={victims} campaigns={campaigns} />
                </TabsContent>
                <TabsContent value="campaigns">
                    <CampaignsTab campaigns={campaigns} />
                </TabsContent>
                <TabsContent value="merchants">
                    <MerchantsTab merchants={merchants} />
                </TabsContent>
                <TabsContent value="volunteers">
                    <VolunteersTab />
                </TabsContent>
                <TabsContent value="triage">
                    <TriageTab sessions={triageSessions} victims={victims} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
