import { getCurrentProfile } from "@/lib/session";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Pencil } from "lucide-react";

export const metadata = { title: "My Profile — Berau Coal" };

export default async function ProfileEditPage() {
  const { session, profile } = await getCurrentProfile();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            My Profile
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Keep your personal data accurate. Update any incorrect details and upload your CV and photo.
          </p>
        </div>
        <StatusBadge status={profile.probationStatus} className="text-sm px-3 py-1" />
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 text-sm">
          <p className="text-muted-foreground">
            Probation-sensitive fields (join date, probation timeline, and final status) are managed by HR.
            Need to change your <strong>name</strong> or <strong>email</strong>? Reach out to your HR contact.
          </p>
        </CardContent>
      </Card>

      <ProfileEditForm
        defaults={{
          name: session.user.name,
          email: session.user.email,
          nik: profile.nik,
          phone: profile.phone,
          address: profile.address,
          birthDate: profile.birthDate ? profile.birthDate.toISOString() : null,
          gender: profile.gender,
          department: profile.department,
          position: profile.position,
          supervisorName: profile.supervisorName,
          cvUrl: profile.cvUrl,
          photoUrl: profile.photoUrl,
          emergencyContactName: profile.emergencyContactName,
          emergencyContactPhone: profile.emergencyContactPhone,
        }}
      />
    </div>
  );
}
