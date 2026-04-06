import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import { CampaignsTab } from "@/components/admin/campaigns-tab";
import type { Campaign } from "@/lib/definitions";

async function getCampaignsData() {
    const supabase = createSupabaseServerAdminClient();
    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching campaigns:", error);
        return [];
    }
    return (campaigns || []) as Campaign[];
}

export default async function AdminCampaignsPage() {
    const campaigns = await getCampaignsData();
    return (
        <div>
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Campaign Management</h1>
                <p className="text-muted-foreground">Create new aid campaigns and view existing ones.</p>
            </div>
            <CampaignsTab campaigns={campaigns} />
        </div>
    );
}
