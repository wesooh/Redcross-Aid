import { OverviewCard } from '@/components/dashboard/overview-card';
import { Wallet, MessageCircle } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server-admin-client';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const supabaseAdmin = createSupabaseServerAdminClient();
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    // An admin should never see this page; redirect them to the real admin dashboard.
    if (profile?.role === 'admin') {
        redirect('/admin');
    }
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to ResilienceLink</h1>
        <p className="text-muted-foreground">Your hub for aid and support. Here’s what you can do:</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <OverviewCard
          title="Digital Wallet"
          description="View your digital voucher balance and see your complete transaction history."
          link="/wallet"
          linkText="Go to My Wallet"
          Icon={Wallet}
        />
        <OverviewCard
          title="PFA Support Chat"
          description="Speak with our bilingual AI assistant for psychosocial first aid and support."
          link="/pfa-chatbot"
          linkText="Start Conversation"
          Icon={MessageCircle}
        />
      </div>
    </div>
  );
}
