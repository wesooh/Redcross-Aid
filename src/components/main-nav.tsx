'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HandHeart, LayoutDashboard, MessageCircle, QrCode, Wallet, UserCog, UserPlus, LogOut } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { logout } from '@/app/actions/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/wallet', label: 'My Wallet', icon: Wallet },
  { href: '/merchant', label: 'Merchant Terminal', icon: QrCode },
  { href: '/pfa-chatbot', label: 'PFA Support', icon: MessageCircle },
  { href: '/volunteer', label: 'Volunteer', icon: UserPlus },
  { href: '/admin', label: 'Admin', icon: UserCog },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <HandHeart className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">ResilienceLink</span>
        </Link>
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    pathname.startsWith(item.href) && item.href !== '/dashboard' ? 'bg-accent text-accent-foreground' : '',
                    pathname === '/dashboard' && item.href === '/dashboard' ? 'bg-accent text-accent-foreground' : ''
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <form action={logout}>
                        <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8">
                            <LogOut className="h-5 w-5" />
                            <span className="sr-only">Logout</span>
                        </button>
                    </form>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
