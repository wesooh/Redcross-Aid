import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from 'lucide-react';
import Link from "next/link";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    href?: string;
}

export function StatCard({ title, value, icon: Icon, description, href }: StatCardProps) {
    const card = (
        <Card className="transition-colors hover:bg-muted h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );

    if (href) {
        return (
            <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg block h-full">
                {card}
            </Link>
        )
    }

    return card;
}
