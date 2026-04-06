import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import { TriageTab } from "@/components/admin/triage-tab";
import type { TriageSession, Victim } from "@/lib/definitions";

async function getTriageData() {
    const supabase = createSupabaseServerAdminClient();

    const triagePromise = supabase
        .from('triage_sessions')
        .select(`
            *,
            profiles ( full_name )
        `)
        .eq('status', 'open')
        .order('risk_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
    
    const victimsPromise = supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'victim');

    const [{ data: sessions, error: triageError }, { data: victims, error: victimsError }] = await Promise.all([triagePromise, victimsPromise]);

    if (triageError) console.error("Error fetching triage sessions:", triageError);
    if (victimsError) console.error("Error fetching victims:", victimsError);

    return {
        sessions: (sessions || []) as TriageSession[],
        victims: (victims || []) as Victim[],
    };
}

export default async function AdminTriagePage() {
    const { sessions, victims } = await getTriageData();
    return (
        <div>
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">PFA Triage Queue</h1>
                <p className="text-muted-foreground">Review high-risk conversations flagged by the AI for manual intervention.</p>
            </div>
            <TriageTab sessions={sessions} victims={victims} />
        </div>
    );
}
