
import { AppHeader } from '@/components/app-header';
import { MainNav } from '@/components/main-nav';
import { Toaster } from '@/components/ui/toaster';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/definitions';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';
import { headers } from 'next/headers';
import type { User } from '@supabase/supabase-js';

// This is now the primary gatekeeper for all protected routes.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If middleware somehow lets an unauthenticated user through, block them.
  if (!user) {
    redirect('/login');
  }

  // Fetch the user's profile using a secure, admin-level client to bypass RLS.
  const supabaseAdmin = createSupabaseServerAdminClient();
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // If there's an auth user but no profile, it's an inconsistent state.
  // Log them out to allow them to re-register or contact support.
  if (error || !profile) {
    redirect('/logout');
  }
  
  const headersList = headers();
  const pathname = headersList.get('x-next-pathname') ?? '';

  // --- Role-Based Authorization ---
  // The layout is the single source of truth for what a user can see.
  const role = profile.role;

  // Handle initial redirect from generic '/dashboard' to the correct role-specific page.
  if (pathname === '/dashboard') {
      switch(role) {
          case 'admin': redirect('/admin'); break;
          case 'volunteer': redirect('/volunteer'); break;
          case 'merchant': redirect('/merchant'); break;
          // if role is 'victim', they stay on '/dashboard'
      }
  }

  // Enforce role-based access for all protected routes.
  if (pathname.startsWith('/admin') && role !== 'admin') {
      redirect('/dashboard'); 
  }
  if (pathname.startsWith('/volunteer') && !['admin', 'volunteer'].includes(role)) {
      redirect('/dashboard');
  }
  if (pathname.startsWith('/merchant') && !['admin', 'merchant'].includes(role)) {
      redirect('/dashboard');
  }
  if (pathname.startsWith('/wallet') && !['admin', 'victim'].includes(role)) {
      redirect('/dashboard');
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* MainNav and AppHeader are Client Components receiving server-fetched data as props */}
      <MainNav role={profile.role} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <AppHeader user={user} profile={profile as Profile} />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
