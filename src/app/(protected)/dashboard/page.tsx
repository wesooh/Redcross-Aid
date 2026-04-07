'use client';

import { OverviewCard } from '@/components/dashboard/overview-card';
import { Wallet, MessageCircle } from 'lucide-react';

// The ProtectedLayout now handles all authentication and role-based redirects.
// This page can now be a simple component that just displays content.
export default function DashboardPage() {
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
