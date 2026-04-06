import { VolunteersTab } from "@/components/admin/volunteers-tab";

export default function AdminVolunteersPage() {
    return (
        <div>
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Volunteer Management</h1>
                <p className="text-muted-foreground">Onboard new volunteers who can register aid recipients.</p>
            </div>
            <VolunteersTab />
        </div>
    );
}
