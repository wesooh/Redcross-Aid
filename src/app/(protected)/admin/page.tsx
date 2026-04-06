import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import { StatCard } from "@/components/admin/stat-card";
import { Users, Banknote, ShieldAlert, HeartHandshake } from "lucide-react";

async function getAdminPageData() {
    const supabase = createSupabaseServerAdminClient();
    
    const victimsPromise = supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'victim');

    const campaignsPromise = supabase
        .from('campaigns')
        .select('id', { count: 'exact' });
    
    const triagePromise = supabase
        .from('triage_sessions')
        .select('id', { count: 'exact' })
        .eq('status', 'open');

    const disbursementPromise = supabase
        .from('ledger')
        .select('amount')
        .eq('transaction_type', 'AID_DISBURSEMENT')
        .lt('amount', 0); // Disbursements are negative amounts

    const [
        { count: victimsCount, error: victimsError }, 
        { count: campaignsCount, error: campaignsError },
        { count: triageCount, error: triageError },
        { data: disbursements, error: disbursementError }
    ] = await Promise.all([
        victimsPromise,
        campaignsPromise,
        triagePromise,
        disbursementPromise
    ]);
    
    if (victimsError) console.error('Error fetching victims count:', victimsError);
    if (campaignsError) console.error('Error fetching campaigns count:', campaignsError);
    if (triageError) console.error('Error fetching triage sessions count:', triageError);
    if (disbursementError) console.error('Error fetching disbursements:', disbursementError);

    const totalDisbursed = disbursements ? disbursements.reduce((sum, current) => sum - current.amount, 0) : 0;

    return { 
        victimsCount: victimsCount || 0,
        campaignsCount: campaignsCount || 0,
        triageCount: triageCount || 0,
        totalDisbursed
    };
}


export default async function AdminPage() {
    const { victimsCount, campaignsCount, triageCount, totalDisbursed } = await getAdminPageData();

    const formattedTotalDisbursed = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES', // Kenya Shillings
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(totalDisbursed);

    return (
        <div className="container mx-auto">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
                <p className="text-muted-foreground">A high-level overview of all platform activities.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard title="Total Victims" value={victimsCount} icon={Users} description="Total number of registered aid recipients." />
                <StatCard title="Total Disbursed" value={formattedTotalDisbursed} icon={Banknote} description="Total aid disbursed through all campaigns." />
                <StatCard title="Active Campaigns" value={campaignsCount} icon={HeartHandshake} description="Number of ongoing aid campaigns." />
                <StatCard title="Triage Alerts" value={triageCount} icon={ShieldAlert} description="Open high-risk cases needing review." />
            </div>
             <div className="bg-card border rounded-lg p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">Welcome, Admin!</h2>
                <p className="text-muted-foreground">Use the sidebar navigation to manage campaigns, disburse aid, register users, and review PFA triage sessions.</p>
            </div>
        </div>
    );
}
