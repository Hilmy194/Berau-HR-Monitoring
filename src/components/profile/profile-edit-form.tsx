"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, FileText, Image as ImageIcon, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { profileEditSchema, type ProfileEditInput } from "@/lib/validations";
import { DEPARTMENTS } from "@/lib/constants";
import { toDateInputValue } from "@/lib/utils";

interface ProfileEditFormProps {
  defaults: {
    name: string;
    email: string;
    nik?: string | null;
    phone?: string | null;
    address?: string | null;
    birthDate?: string | null;
    gender?: string | null;
    department?: string | null;
    position?: string | null;
    supervisorName?: string | null;
    cvUrl?: string | null;
    photoUrl?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
  };
}

/**
 * Self-edit form for new hires. Personal/employment/contact fields are
 * editable; documents are uploaded separately via the file uploader so they
 * flow through `/api/profile/documents` (real file storage, not URLs).
 *
 * Probation dates & status are intentionally excluded — those stay under HR
 * control.
 */
export function ProfileEditForm({ defaults }: ProfileEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<string>(defaults.gender ?? "");
  const [department, setDepartment] = useState<string>(defaults.department ?? "");
  // Local mirrors of file URLs so the upload result is reflected immediately
  // without waiting for the next router.refresh().
  const [cvUrl, setCvUrl] = useState<string | null>(defaults.cvUrl ?? null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaults.photoUrl ?? null);

  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<ProfileEditInput>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      nik: defaults.nik ?? "",
      phone: defaults.phone ?? "",
      address: defaults.address ?? "",
      birthDate: defaults.birthDate ? toDateInputValue(defaults.birthDate) : "",
      department: defaults.department ?? "",
      position: defaults.position ?? "",
      supervisorName: defaults.supervisorName ?? "",
      emergencyContactName: defaults.emergencyContactName ?? "",
      emergencyContactPhone: defaults.emergencyContactPhone ?? "",
    },
  });

  const onSubmit = async (data: ProfileEditInput) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        gender: (gender || undefined) as "MALE" | "FEMALE" | undefined,
        department: department || undefined,
        // Persist the latest uploaded URLs alongside any text edits.
        cvUrl: cvUrl ?? "",
        photoUrl: photoUrl ?? "",
      };
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(result.error ?? "Failed to save profile");
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCircle className="h-4 w-4" /> Personal Information</CardTitle>
          <CardDescription>Update your personal details if anything has changed.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <Input defaultValue={defaults.name} readOnly className="bg-muted/50" />
            <p className="text-[11px] text-muted-foreground">Contact HR to change your name.</p>
          </Field>
          <Field label="Email">
            <Input defaultValue={defaults.email} readOnly className="bg-muted/50" />
            <p className="text-[11px] text-muted-foreground">Contact HR to change your email.</p>
          </Field>
          <Field label="NIK (National ID)" error={errors.nik?.message}>
            <Input placeholder="3201234567890001" {...register("nik")} />
          </Field>
          <Field label="Phone Number" error={errors.phone?.message}>
            <Input placeholder="+62 812 ..." {...register("phone")} />
          </Field>
          <Field label="Birth Date" error={errors.birthDate?.message}>
            <Input type="date" {...register("birthDate")} />
          </Field>
          <Field label="Gender" error={errors.gender?.message}>
            <Select
              value={gender}
              onValueChange={(v) => {
                setGender(v);
                setValue("gender", v as "MALE" | "FEMALE");
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" error={errors.address?.message}>
              <Textarea placeholder="Your residential address" {...register("address")} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
          <CardDescription>Your role and team details.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Department" error={errors.department?.message}>
            <Select
              value={department}
              onValueChange={(v) => {
                setDepartment(v);
                setValue("department", v);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Position" error={errors.position?.message}>
            <Input placeholder="Software Engineer" {...register("position")} />
          </Field>
          <Field label="Supervisor Name" error={errors.supervisorName?.message}>
            <Input placeholder="Supervisor full name" {...register("supervisorName")} />
          </Field>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Upload your CV and photo directly — no external links needed.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> CV / Resume</Label>
            <FileUpload
              endpoint="/api/profile/documents"
              fieldName="kind"
              fieldValue="cv"
              deleteEndpoint="/api/profile/documents?kind=cv"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              label="Upload CV"
              hint="PDF, DOC, or DOCX — max 5 MB"
              currentUrl={cvUrl}
              currentName={cvUrl ? decodeFilename(cvUrl) : undefined}
              onUploaded={(d) => setCvUrl(d.url)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Photo</Label>
            <FileUpload
              endpoint="/api/profile/documents"
              fieldName="kind"
              fieldValue="photo"
              deleteEndpoint="/api/profile/documents?kind=photo"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              label="Upload photo"
              hint="JPG, PNG, or WEBP — max 5 MB"
              currentUrl={photoUrl}
              currentName={photoUrl ? decodeFilename(photoUrl) : undefined}
              onUploaded={(d) => setPhotoUrl(d.url)}
            />
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Profile" className="h-24 w-24 rounded-lg object-cover border" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>Who should we contact in case of emergency.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contact Name" error={errors.emergencyContactName?.message}>
            <Input placeholder="Full name" {...register("emergencyContactName")} />
          </Field>
          <Field label="Contact Phone" error={errors.emergencyContactPhone?.message}>
            <Input placeholder="+62 ..." {...register("emergencyContactPhone")} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 sticky bottom-0 bg-background/90 backdrop-blur p-3 -mx-4 border-t lg:-mx-0 lg:border lg:rounded-lg">
        <Button type="submit" size="lg" disabled={loading || !isDirty}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Best-effort human-readable name from an uploaded file URL. */
function decodeFilename(url: string): string {
  const last = url.split("/").pop() ?? url;
  return last;
}
