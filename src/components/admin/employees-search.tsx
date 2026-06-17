"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmployeesSearchProps {
  departments: string[];
  statuses: string[];
  current: { search?: string; status?: string; department?: string };
}

export function EmployeesSearch({ departments, statuses, current }: EmployeesSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => router.push(`/admin/employees?${params.toString()}`));
  };

  const clear = () => {
    startTransition(() => router.push("/admin/employees"));
  };

  const hasFilters = current.search || current.status || current.department;

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, department..."
          defaultValue={current.search}
          className="pl-9"
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) params.set("search", e.target.value);
            else params.delete("search");
            const val = e.target.value;
            clearTimeout((window as unknown as { _st?: number })._st);
            (window as unknown as { _st?: number })._st = window.setTimeout(() => {
              startTransition(() => router.push(`/admin/employees?${params.toString()}`));
            }, val ? 400 : 0);
            // immediate update when empty
            if (!val) update("search", "");
          }}
        />
      </div>
      <Select defaultValue={current.department ?? "all"} onValueChange={(v) => update("department", v)}>
        <SelectTrigger className="sm:w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={current.status ?? "all"} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="outline" size="icon" onClick={clear} disabled={isPending}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
