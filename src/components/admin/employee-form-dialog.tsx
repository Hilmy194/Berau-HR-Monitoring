"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, UserPlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { employeeCreateSchema, type EmployeeCreateInput } from "@/lib/validations";
import { DEPARTMENTS, PROBATION_STATUS_OPTIONS, STATUS_LABELS } from "@/lib/constants";

interface EmployeeFormDialogProps {
  mode: "create" | "edit";
  employee?: {
    id: string;
    name: string;
    email: string;
    department?: string | null;
    position?: string | null;
    joinDate?: string | null;
    probationStatus: string;
  };
  trigger?: React.ReactNode;
}

export function EmployeeFormDialog({ mode, employee, trigger }: EmployeeFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState(employee?.department ?? "");
  const [status, setStatus] = useState(employee?.probationStatus ?? "ACTIVE");
  const router = useRouter();

  const isEdit = mode === "edit";

  const { register, handleSubmit, formState: { errors } } = useForm<EmployeeCreateInput>({
    resolver: zodResolver(employeeCreateSchema),
    defaultValues: {
      name: employee?.name ?? "",
      email: employee?.email ?? "",
      password: "",
      department: employee?.department ?? "",
      position: employee?.position ?? "",
      joinDate: employee?.joinDate ? employee.joinDate.split("T")[0] : "",
    },
  });

  const onSubmit = async (data: EmployeeCreateInput) => {
    setLoading(true);
    try {
      if (isEdit && employee) {
        const res = await fetch(`/api/admin/employees/${employee.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            department: department || data.department,
            position: data.position,
            joinDate: data.joinDate,
            probationStatus: status,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error ?? "Failed to update");
          return;
        }
        toast.success("Employee updated");
      } else {
        const res = await fetch("/api/admin/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, department }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error ?? "Failed to create");
          return;
        }
        toast.success("Employee created");
      }
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {isEdit ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {isEdit ? "Edit" : "Add Employee"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the employee's information and probation status."
              : "Create a new hire account. They can complete their profile after first login."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input {...register("name")} placeholder="John Doe" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register("email")} placeholder="john@company.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            {!isEdit && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Temporary Password</Label>
                <Input type="text" {...register("password")} placeholder="Min 6 characters" />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input {...register("position")} placeholder="Software Engineer" />
            </div>
            <div className="space-y-1.5">
              <Label>Join Date <span className="text-destructive">*</span></Label>
              <Input type="date" {...register("joinDate")} />
              {errors.joinDate && <p className="text-xs text-destructive">{errors.joinDate.message}</p>}
            </div>
            {isEdit && (
              <div className="space-y-1.5">
                <Label>Probation Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROBATION_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
