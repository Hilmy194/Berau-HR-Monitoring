"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskFilterProps {
  employees: { id: string; name: string }[];
  statuses: string[];
  current: { status?: string; employee?: string };
}

export function TaskFilter({ employees, statuses, current }: TaskFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`/admin/tasks?${params.toString()}`));
  };

  const clear = () => startTransition(() => router.push("/admin/tasks"));
  const hasFilters = current.status || current.employee;

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select defaultValue={current.employee ?? "all"} onValueChange={(v) => update("employee", v)}>
        <SelectTrigger className="sm:w-[220px]"><SelectValue placeholder="All Employees" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Employees</SelectItem>
          {employees.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={current.status ?? "all"} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="sm:w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
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
