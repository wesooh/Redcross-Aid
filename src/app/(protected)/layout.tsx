
import { AppHeader } from '@/components/app-header';
import { MainNav } from '@/components/main-nav';
import { Toaster } from '@/components/ui/toaster';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/definitions';
import type { User } from '@supabase/supabase-js';

// This is now a Server Component to correctly handle session and profile data.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // If no user is authenticated, always redirect to login.
    // The middleware should have already caught this, but this is a final safeguard.
    redirect('/login');
  }

  // For a real, logged-in user, fetch their profile.
  // We use the ADMIN client to bypass RLS in case of faulty policies, preventing login loops.
  const supabaseAdmin = createSupabaseServerAdminClient();
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // This can happen due to RLS issues, database errors, or if the profile wasn't created.
    // Redirecting to logout clears the session and prevents infinite loops.
    console.error(`Could not fetch a valid profile for user ${user.id}. Logging out. Reason: ${error?.message}`);
    redirect('/logout');
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* MainNav and AppHeader are Client Components receiving server-fetched data as props */}
      <MainNav role={profile.role} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <AppHeader user={user} profile={profile} />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
