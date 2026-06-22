import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { listProfiles } from "@/lib/services/employee.service";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeeFormDialog } from "@/components/admin/employee-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { EmployeesSearch } from "@/components/admin/employees-search";
import { DEPARTMENTS, PROBATION_STATUS_OPTIONS } from "@/lib/constants";
import { getInitials, formatDate } from "@/lib/utils";
import { SearchX, Eye, Pencil, Users } from "lucide-react";

export const metadata = { title: "Employees — Berau Coal" };

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string; department?: string }>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const filters = {
    search: sp?.search,
    status: sp?.status,
    department: sp?.department,
  };

  const employees = await listProfiles(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Employee Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage new hires, their profiles, and probation status.
          </p>
        </div>
        <EmployeeFormDialog mode="create" />
      </div>

      <EmployeesSearch
        departments={[...DEPARTMENTS]}
        statuses={[...PROBATION_STATUS_OPTIONS]}
        current={{ search: filters.search, status: filters.status, department: filters.department }}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Position</TableHead>
                <TableHead className="hidden lg:table-cell">Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <SearchX className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">No employees found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/admin/employees/${p.id}`} className="flex items-center gap-3 group">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(p.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium group-hover:text-primary truncate">{p.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.user.email}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{p.department ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{p.position ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(p.joinDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.probationStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/employees/${p.id}`}>
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                            <Eye className="h-4 w-4" />
                          </span>
                        </Link>
                        <EmployeeFormDialog
                          mode="edit"
                          employee={{
                            id: p.id,
                            name: p.user.name,
                            email: p.user.email,
                            department: p.department,
                            position: p.position,
                            joinDate: p.joinDate?.toISOString(),
                            probationStatus: p.probationStatus,
                          }}
                          trigger={
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                              <Pencil className="h-4 w-4" />
                            </span>
                          }
                        />
                        <ConfirmDelete
                          endpoint={`/api/admin/employees/${p.id}`}
                          label="employee"
                          description={`This will permanently delete ${p.user.name} and all their tasks, presentations, and panelists.`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        Showing {employees.length} employee{employees.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
