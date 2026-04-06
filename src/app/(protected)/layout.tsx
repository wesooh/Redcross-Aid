'use client';

import { AppHeader } from '@/components/app-header';
import { MainNav } from '@/components/main-nav';
import { Toaster } from '@/components/ui/toaster';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';
import { redirect, usePathname } from 'next/navigation';
import type { Profile } from '@/lib/definitions';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const supabase = createSupabaseServerClient();
      const { data: { user: realUser } } = await supabase.auth.getUser();

      let sessionUser: User | null = realUser;
      let sessionProfile: Profile | null = null;

      if (!sessionUser) {
        if (pathname.startsWith('/admin')) {
          // Create a mock user and profile for guest admin access
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
        } else {
          redirect('/login');
          return;
        }
      }

      if (sessionUser && !sessionProfile) {
        // This block runs for REAL users to fetch their profile
        const supabaseAdmin = createSupabaseServerAdminClient();
        const { data: realProfile, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (error || !realProfile) {
          console.error(`Could not fetch a valid profile for user ${sessionUser.id}. Logging out.`);
          redirect('/logout');
          return;
        }
        sessionProfile = realProfile as Profile;
      }
      
      setUser(sessionUser);
      setProfile(sessionProfile);
      setIsLoading(false);
    };

    fetchSession();
  }, [pathname]);

  if (isLoading || !user || !profile) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
                <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </nav>
            </aside>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Skeleton className="h-8 w-8 sm:hidden" />
                    <div className="flex-1">
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    <Skeleton className="h-64 w-full" />
                </main>
            </div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
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
