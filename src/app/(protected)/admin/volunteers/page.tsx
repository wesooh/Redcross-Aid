import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import { VolunteersTab } from "@/components/admin/volunteers-tab";
import type { Profile } from "@/lib/definitions";

async function getVolunteersData() {
    const supabase = createSupabaseServerAdminClient();
    const { data: volunteers, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'volunteer')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching volunteers:", error);
        return [];
    }
    return (volunteers || []) as Profile[];
}


export default async function AdminVolunteersPage() {
    const volunteers = await getVolunteersData();
    return (
        <div>
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Volunteer Management</h1>
                <p className="text-muted-foreground">Onboard new volunteers and view existing ones.</p>
            </div>
            <VolunteersTab volunteers={volunteers} />
        </div>
    );
}
