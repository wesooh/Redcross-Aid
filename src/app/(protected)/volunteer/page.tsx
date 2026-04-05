import { RegistrationForm } from "@/components/volunteer/registration-form";

export default function VolunteerPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight mb-4">Victim Registration</h1>
            <p className="text-muted-foreground mb-6">Use this form to register new aid recipients into the system.</p>
            <RegistrationForm />
        </div>
    );
}
