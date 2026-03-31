import { OverviewCard } from '@/components/dashboard/overview-card';
import { Wallet, QrCode, MessageCircle } from 'lucide-react';

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
          title="Merchant Terminal"
          description="Process payments from aid recipients by scanning their QR code or entering a code."
          link="/merchant"
          linkText="Open Terminal"
          Icon={QrCode}
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
