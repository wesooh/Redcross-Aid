import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface OverviewCardProps {
  title: string;
  description: string;
  link: string;
  linkText: string;
  Icon: LucideIcon;
}

export function OverviewCard({ title, description, link, linkText, Icon }: OverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-center bg-primary/10 rounded-full w-12 h-12 mb-4">
            <Icon className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild className="w-full" variant="secondary">
          <Link href={link}>
            {linkText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
