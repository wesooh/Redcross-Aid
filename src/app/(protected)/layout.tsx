import { AppHeader } from '@/components/app-header';
import { MainNav } from '@/components/main-nav';
import { Toaster } from '@/components/ui/toaster';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/definitions';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the user's full profile to determine their role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If there's an error or the profile doesn't exist, the user is in an invalid state.
  // This can happen if an auth user exists without a corresponding profile entry.
  // Redirecting to login and logging the error is the safest course of action.
  if (error || !profile) {
    // When using .single(), Supabase returns an error if no rows are found. This is expected.
    // We create a clean log message for debugging and then log the user out.
    const reason = error ? `(Reason: ${error.message})` : '(Reason: No profile found for this user ID).';
    console.error(`Could not fetch a valid profile for user ${user.id}. ${reason} Logging out.`);
    redirect('/logout');
  }

  const userProfile = profile as Profile;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <MainNav role={userProfile.role} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <AppHeader user={user} profile={userProfile} />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
