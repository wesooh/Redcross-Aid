import { DisbursementForm } from "@/components/admin/disbursement-form";
import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";

async function getVictims() {
    const supabase = createSupabaseServerAdminClient();
    const { data: victims, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'victim');
    
    if (error) {
        console.error('Error fetching victims:', error);
        return [];
    }
    return victims || [];
}


export default async function AdminPage() {
    const victims = await getVictims();
    return (
        <div>
            <DisbursementForm victims={victims} />
        </div>
    );
}
