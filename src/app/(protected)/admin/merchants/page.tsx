import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import { MerchantsTab } from "@/components/admin/merchants-tab";
import type { Merchant } from "@/lib/definitions";

async function getMerchantsData() {
    const supabase = createSupabaseServerAdminClient();
    const { data: merchants, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'merchant')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching merchants:", error);
        return [];
    }
    return (merchants || []) as Merchant[];
}

export default async function AdminMerchantsPage() {
    const merchants = await getMerchantsData();
    return (
        <div>
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Merchant Management</h1>
                <p className="text-muted-foreground">Onboard new merchants and view existing partners.</p>
            </div>
            <MerchantsTab merchants={merchants} />
        </div>
    );
}
