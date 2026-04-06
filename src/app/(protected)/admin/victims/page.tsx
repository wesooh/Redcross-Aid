
import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import { VictimsTab } from "@/components/admin/victims-tab";
import type { Victim } from "@/lib/definitions";

async function getVictimsData() {
    const supabase = await createSupabaseServerAdminClient();
    const { data: victims, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'victim')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching victims:", error);
        return [];
    }
    return (victims || []) as Victim[];
}

export default async function AdminVictimsPage() {
    const victims = await getVictimsData();
    return (
        <div>
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Victim Management</h1>
                <p className="text-muted-foreground">View and manage all registered aid recipients.</p>
            </div>
            <VictimsTab victims={victims} />
        </div>
    );
}
