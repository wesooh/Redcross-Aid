import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisbursementForm } from "@/components/admin/disbursement-form";
import { CampaignsTab } from "@/components/admin/campaigns-tab";
import { MerchantsTab } from "@/components/admin/merchants-tab";
import type { Victim, Campaign } from "@/lib/definitions";

async function getAdminPageData() {
    const supabase = createSupabaseServerAdminClient();
    
    const victimsPromise = supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'victim');

    const campaignsPromise = supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

    const [{ data: victims, error: victimsError }, { data: campaigns, error: campaignsError }] = await Promise.all([
        victimsPromise,
        campaignsPromise,
    ]);
    
    if (victimsError) {
        console.error('Error fetching victims:', victimsError);
    }
    if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
    }

    return { 
        victims: (victims || []) as Victim[],
        campaigns: (campaigns || []) as Campaign[],
    };
}


export default async function AdminPage() {
    const { victims, campaigns } = await getAdminPageData();

    return (
        <div className="container mx-auto">
            <Tabs defaultValue="disbursement">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="disbursement">Disburse Aid</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="merchants">Register Merchant</TabsTrigger>
                </TabsList>
                <TabsContent value="disbursement">
                    <DisbursementForm victims={victims} campaigns={campaigns} />
                </TabsContent>
                <TabsContent value="campaigns">
                    <CampaignsTab campaigns={campaigns} />
                </TabsContent>
                <TabsContent value="merchants">
                    <MerchantsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
