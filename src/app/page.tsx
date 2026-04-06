import { Button } from '@/components/ui/button';
import { HandHeart, Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="absolute top-0 left-0 right-0 z-20 container mx-auto flex items-center justify-between py-4 px-4 sm:px-6 text-primary-foreground">
        <div className="flex items-center gap-2">
          <HandHeart className="h-8 w-8 text-white" />
          <h1 className="text-2xl font-bold text-white">Redcross Trust</h1>
        </div>
        <Button asChild variant="secondary">
          <Link href="/login">Login</Link>
        </Button>
      </header>

      <main className="flex-1">
        <section className="relative flex flex-col items-center justify-center text-center h-[75vh] min-h-[500px] text-white overflow-hidden">
           <Image
              src="/redcross.jpg"
              alt="Red Cross humanitarian aid background"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 container flex flex-col items-center px-4 sm:px-6">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Smart Trust & PFA Triage
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-neutral-200 mb-8">
              A secure digital voucher ecosystem for aid victims and a bilingual AI triage system, powered by the Red Cross.
            </p>
            <Button asChild size="lg">
              <Link href="/login">Access the Platform</Link>
            </Button>
          </div>
        </section>

        <section className="bg-muted py-20">
          <div className="container mx-auto grid md:grid-cols-3 gap-12 px-4 sm:px-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center bg-primary/10 rounded-full w-16 h-16 mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Transparent</h3>
              <p className="text-muted-foreground">
                Building a circle of trust with an immutable, append-only ledger for all aid transactions, preventing fraud and ensuring accountability.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center bg-primary/10 rounded-full w-16 h-16 mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community-Powered</h3>
              <p className="text-muted-foreground">
                Empowering local merchants and volunteers as key players in the aid distribution and victim onboarding process.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center bg-primary/10 rounded-full w-16 h-16 mb-4">
                <HandHeart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Immediate Support</h3>
              <p className="text-muted-foreground">
                Providing instant psychosocial first aid through a bilingual AI, with a triage system to escalate high-risk cases to human counselors.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto py-6 px-4 sm:px-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Redcross Trust. A Red Cross Initiative.</p>
      </footer>
    </div>
  );
}
