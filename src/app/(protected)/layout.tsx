
import { AppHeader } from '@/components/app-header';
import { MainNav } from '@/components/main-nav';
import { Toaster } from '@/components/ui/toaster';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/definitions';
import { headers } from 'next/headers';
import type { User } from '@supabase/supabase-js';

// This is now a Server Component that gets its data from the middleware via headers.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers();
  const userString = headersList.get('x-user');
  const profileString = headersList.get('x-profile');
  const pathname = headersList.get('x-next-pathname') ?? '';

  // If the middleware didn't add the user header, something is wrong.
  // This is a failsafe that redirects to login.
  if (!userString || !profileString) {
    redirect('/login');
  }

  // Safely parse the user and profile from the headers.
  const user: User = JSON.parse(userString);
  const profile: Profile = JSON.parse(profileString);
  
  // --- Role-Based Authorization ---
  // The layout is now the single source of truth for what a user can see.
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
        <AppHeader user={user} profile={profile} />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
