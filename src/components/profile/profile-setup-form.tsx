"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { profileSetupSchema, type ProfileSetupInput } from "@/lib/validations";

export function ProfileSetupForm({ defaults }: { defaults: { name: string; email: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<string>("");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      cvUrl: "",
      photoUrl: "",
    },
  });

  const onSubmit = async (data: ProfileSetupInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, gender: gender || "MALE" }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Failed to save profile");
        return;
      }
      toast.success("Profile saved! Welcome aboard.");
      router.push("/dashboard");
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
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Tell us about yourself.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <Input defaultValue={defaults.name} readOnly className="bg-muted/50" />
          </Field>
          <Field label="Email">
            <Input defaultValue={defaults.email} readOnly className="bg-muted/50" />
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
            <Input placeholder="Engineering" {...register("department")} />
          </Field>
          <Field label="Position" error={errors.position?.message}>
            <Input placeholder="Software Engineer" {...register("position")} />
          </Field>
          <Field label="Join Date" error={errors.joinDate?.message}>
            <Input type="date" {...register("joinDate")} />
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
          <CardDescription>Provide links to your CV and photo.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CV URL" error={errors.cvUrl?.message}>
            <Input placeholder="https://..." {...register("cvUrl")} />
          </Field>
          <Field label="Photo URL" error={errors.photoUrl?.message}>
            <Input placeholder="https://..." {...register("photoUrl")} />
          </Field>
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
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? "Saving..." : "Complete Profile"}
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
