import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import { DisbursementForm } from "@/components/admin/disbursement-form";
import type { Victim, Campaign } from "@/lib/definitions";

async function getDisbursementData() {
    const supabase = createSupabaseServerAdminClient();
    
    const victimsPromise = supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'victim');

    const campaignsPromise = supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

    const [{ data: victims, error: victimsError }, { data: campaigns, error: campaignsError }] = await Promise.all([victimsPromise, campaignsPromise]);

    if (victimsError) console.error("Error fetching victims:", victimsError);
    if (campaignsError) console.error("Error fetching campaigns:", campaignsError);

    return {
        victims: (victims || []) as Victim[],
        campaigns: (campaigns || []) as Campaign[],
    };
}


export default async function AdminDisbursementPage() {
    const { victims, campaigns } = await getDisbursementData();
    return (
        <div>
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Disburse Aid</h1>
                <p className="text-muted-foreground">Distribute funds to registered victims for a specific campaign.</p>
            </div>
            <DisbursementForm victims={victims} campaigns={campaigns} />
        </div>
    );
}
