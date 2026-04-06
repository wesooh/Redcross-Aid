
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

  let sessionUser: User | null = user;
  let sessionProfile: Profile | null = null;

  if (!sessionUser) {
    // Middleware handles unauthenticated access, so if we reach here without a user,
    // it can only be the "Guest Admin" case allowed by the middleware.
    sessionUser = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'guest@admin.com',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'Guest Admin' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      role: 'authenticated',
      updated_at: new Date().toISOString(),
      phone: '',
      is_anonymous: false,
    } as User;

    sessionProfile = {
      id: sessionUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'Guest Admin',
      email: 'guest@admin.com',
      national_id: null,
      phone_number: null,
      role: 'admin',
      county: null,
    };
  }

  if (sessionUser && !sessionProfile) {
    // For real, logged-in users, fetch their profile.
    // Use the ADMIN client to bypass RLS in case of faulty policies, preventing login loops.
    const supabaseAdmin = createSupabaseServerAdminClient();
    const { data: realProfile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (error || !realProfile) {
      // This can happen due to RLS issues or other database errors.
      // Redirecting to logout clears the session and prevents infinite loops.
      console.error(`Could not fetch a valid profile for user ${sessionUser.id}. Logging out. Reason: ${error?.message}`);
      redirect('/logout');
    }
    sessionProfile = realProfile as Profile;
  }
  
  if (!sessionUser || !sessionProfile) {
    // This is a final safeguard. If we somehow have no user or profile,
    // send the user back to the login page.
     redirect('/login');
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* MainNav and AppHeader are Client Components receiving server-fetched data as props */}
      <MainNav role={sessionProfile.role} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <AppHeader user={sessionUser} profile={sessionProfile} />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
