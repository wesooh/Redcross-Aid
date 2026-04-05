'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HandHeart, LayoutDashboard, Menu, MessageCircle, QrCode, UserCircle, Wallet, UserPlus, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/definitions';

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'volunteer', 'merchant', 'victim'] },
  { href: '/wallet', label: 'My Wallet', icon: Wallet, roles: ['admin', 'victim'] },
  { href: '/merchant', label: 'Merchant Terminal', icon: QrCode, roles: ['admin', 'merchant'] },
  { href: '/pfa-chatbot', label: 'PFA Support', icon: MessageCircle, roles: ['admin', 'volunteer', 'merchant', 'victim'] },
  { href: '/volunteer', label: 'Register Victim', icon: UserPlus, roles: ['admin', 'volunteer'] },
  { href: '/admin', label: 'Admin', icon: UserCog, roles: ['admin'] },
];

function getNavItemsForRole(role: Profile['role']) {
    return allNavItems.filter(item => item.roles.includes(role));
}

export function AppHeader({ user, profile }: { user: User, profile: Profile }) {
  const pathname = usePathname();
  const navItems = getNavItemsForRole(profile.role);
  
  // Use allNavItems to find the title, ensuring it displays correctly even if the link is hidden for the current role
  // (e.g. an admin viewing a victim's wallet page). The `startsWith` check handles nested routes.
  const pageTitle = allNavItems.find((item) => pathname.startsWith(item.href))?.label || 'Dashboard';
  const displayName = profile.full_name || user.email;

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <HandHeart className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">ResilienceLink</span>
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-2.5 ${
                  pathname === item.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <h1 className="font-semibold text-lg">{pageTitle}</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            {/* TODO: Add Avatar with fallback */}
            <UserCircle className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
           <DropdownMenuItem asChild>
              <Link href="/logout" className="w-full cursor-pointer">
                Logout
              </Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
