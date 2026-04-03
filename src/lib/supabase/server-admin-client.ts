import { createClient } from '@supabase/supabase-js'

// Note: This is a server-only client for use in server actions and route handlers.
// It is used to make calls to Supabase with service_role privileges to bypass RLS.
// BE VERY CAREFUL with this client.
export function createSupabaseServerAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
    );
}
