import { prisma } from "@/lib/prisma";
import { logAudit } from "./audit.service";
import type { TaskInput, TaskStatusUpdate } from "@/lib/validations";
import { TASK_STATUS } from "@/lib/constants";

/**
 * Probation task management service.
 *
 * Every mutating function takes an `actorId` (the HR admin's user id) so the
 * audit log records who performed the action.
 */

type NewHireInductionTaskTemplate = {
  title: string;
  description: string;
  offsetDays: number;
  requiresAttachment?: boolean;
};

const NEW_HIRE_INDUCTION_TEMPLATE: NewHireInductionTaskTemplate[] = [
  { title: "Registrasi kedatangan", description: "Welcoming: registrasi kehadiran new hire pada hari pertama.", offsetDays: 0 },
  { title: "Penyerahan kartu identitas / ID Card", description: "Welcoming: proses penyerahan kartu identitas karyawan.", offsetDays: 0 },
  { title: "Penandatanganan dokumen", description: "Welcoming: penandatanganan dokumen onboarding jika diperlukan.", offsetDays: 0 },
  { title: "Pemberian laptop", description: "Welcoming: serah terima laptop kerja untuk new hire.", offsetDays: 0 },
  { title: "Pembuatan email", description: "Welcoming: aktivasi email perusahaan dan akun dasar.", offsetDays: 0 },
  { title: "Pengambilan seragam", description: "Welcoming: pengambilan seragam kerja jika tersedia.", offsetDays: 1 },
  { title: "Pengurusan akses gedung", description: "Welcoming: aktivasi akses masuk area kerja atau gedung.", offsetDays: 1 },
  { title: "Company profile", description: "Company Introduction: pengenalan profil perusahaan.", offsetDays: 1 },
  { title: "Struktur organisasi", description: "Company Introduction: memahami struktur organisasi perusahaan.", offsetDays: 1 },
  { title: "Nilai perusahaan", description: "Company Introduction: pengenalan culture dan nilai perusahaan.", offsetDays: 1 },
  { title: "Peraturan kerja", description: "Company Introduction: review aturan kerja dan kebijakan internal.", offsetDays: 2 },
  { title: "Benefit dan fasilitas", description: "Company Introduction: pengenalan benefit dan fasilitas karyawan.", offsetDays: 2 },
  { title: "Safety induction", description: "Company Introduction: menyelesaikan safety induction wajib.", offsetDays: 2, requiresAttachment: true },
  { title: "Meet user", description: "Team Integration: perkenalan dengan user atau pihak yang akan bekerja langsung.", offsetDays: 2 },
  { title: "Meet team", description: "Team Integration: sesi perkenalan dengan tim inti.", offsetDays: 2 },
  { title: "Perkenalan stakeholder utama", description: "Team Integration: pengenalan stakeholder utama bila ada.", offsetDays: 3 },
  { title: "Penjelasan Job Description", description: "Role Orientation: memahami job description dan ekspektasi peran.", offsetDays: 3 },
  { title: "KPI / target", description: "Role Orientation: penjelasan target kerja dan KPI awal.", offsetDays: 4 },
  { title: "Cara kerja tim", description: "Role Orientation: memahami workflow dan ritme kerja tim.", offsetDays: 4 },
  { title: "Project yang sedang berjalan", description: "Role Orientation: orientasi project aktif yang akan dikerjakan.", offsetDays: 5 },
  { title: "Training sistem", description: "Role Orientation: training tool atau sistem yang dipakai tim.", offsetDays: 5, requiresAttachment: true },
  { title: "Laptop", description: "Checklist Item: pastikan perangkat laptop telah diterima dan siap dipakai.", offsetDays: 0 },
  { title: "Email", description: "Checklist Item: pastikan email perusahaan sudah aktif.", offsetDays: 0 },
  { title: "ID Card", description: "Checklist Item: pastikan ID Card sudah diterima.", offsetDays: 0 },
  { title: "Akun SAP/Oracle/HRIS sudah dibuat", description: "Checklist Item: seluruh akun sistem utama sudah aktif.", offsetDays: 1 },
  { title: "Meja", description: "Checklist Item: meja kerja tersedia jika dibutuhkan.", offsetDays: 1 },
  { title: "Welcome kit", description: "Checklist Item: tumbler, notebook, atau merchandise welcome kit.", offsetDays: 1 },
  { title: "Video induction", description: "Checklist Item: menonton video pengenalan company profile.", offsetDays: 2 },
  { title: "Pengumuman Welcome New Joiner ke tim", description: "Do not skip this: umumkan kehadiran new joiner ke tim.", offsetDays: 0 },
  { title: "Foto dan pengenalan di grup internal", description: "Do not skip this: bagikan foto dan perkenalan di grup internal.", offsetDays: 0 },
];

export async function createNewHireInductionTasks(profileId: string, joinDate: Date, actorId?: string) {
  const existingCount = await prisma.probationTask.count({ where: { userId: profileId } });
  if (existingCount > 0) return 0;

  await prisma.probationTask.createMany({
    data: NEW_HIRE_INDUCTION_TEMPLATE.map((task) => {
      const dueDate = new Date(joinDate);
      dueDate.setDate(dueDate.getDate() + task.offsetDays);
      return {
        userId: profileId,
        title: task.title,
        description: task.description,
        dueDate,
        status: TASK_STATUS.NOT_STARTED,
        notes: "",
        requiresAttachment: task.requiresAttachment ?? false,
      };
    }),
  });

  if (actorId) {
    await logAudit({
      action: "CREATE",
      entity: "TaskTemplate",
      entityId: profileId,
      userId: actorId,
      details: `Applied new hire induction template (${NEW_HIRE_INDUCTION_TEMPLATE.length} tasks)`,
    });
  }

  return NEW_HIRE_INDUCTION_TEMPLATE.length;
}

export async function listTasks(filters?: { profileId?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  // NOTE: ProbationTask.userId actually stores the Profile id (see schema).
  if (filters?.profileId) where.userId = filters.profileId;
  if (filters?.status) where.status = filters.status;
  return prisma.probationTask.findMany({
    where,
    include: { profile: { include: { user: true } } },
    orderBy: { dueDate: "asc" },
  });
}

export async function getTasksForProfile(profileId: string) {
  return prisma.probationTask.findMany({
    where: { userId: profileId },
    orderBy: { dueDate: "asc" },
  });
}

export async function createTask(actorId: string, profileId: string, input: TaskInput) {
  const task = await prisma.probationTask.create({
    data: {
      userId: profileId,
      title: input.title,
      description: input.description ?? "",
      dueDate: new Date(input.dueDate),
      status: input.status,
      notes: input.notes ?? "",
      requiresAttachment: input.requiresAttachment ?? false,
    },
  });
  await logAudit({ action: "CREATE", entity: "Task", entityId: task.id, userId: actorId, details: `Created task "${input.title}"` });
  return task;
}

export async function updateTask(actorId: string, taskId: string, input: Partial<TaskInput>) {
  const existing = await prisma.probationTask.findUnique({ where: { id: taskId } });
  if (!existing) throw new Error("Task not found");
  const updated = await prisma.probationTask.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.dueDate !== undefined ? { dueDate: new Date(input.dueDate) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.requiresAttachment !== undefined ? { requiresAttachment: input.requiresAttachment } : {}),
    },
  });
  await logAudit({ action: "UPDATE", entity: "Task", entityId: taskId, userId: actorId, details: `Updated task` });
  return updated;
}

export async function deleteTask(actorId: string, taskId: string) {
  await prisma.probationTask.delete({ where: { id: taskId } });
  await logAudit({ action: "DELETE", entity: "Task", entityId: taskId, userId: actorId, details: `Deleted task` });
  return true;
}

export async function updateOwnTaskStatus(actorId: string, taskId: string, input: TaskStatusUpdate) {
  const user = await prisma.user.findUnique({
    where: { id: actorId },
    select: { profile: { select: { id: true } } },
  });

  const profileId = user?.profile?.id;
  if (!profileId) {
    throw new Error("Profile not found");
  }

  const task = await prisma.probationTask.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new Error("Task not found");
  }

  if (task.userId !== profileId) {
    throw new Error("You can only update your own tasks");
  }

  const updated = await prisma.probationTask.update({
    where: { id: taskId },
    data: { status: input.status },
  });

  await logAudit({
    action: "UPDATE",
    entity: "Task",
    entityId: taskId,
    userId: actorId,
    details: `Updated own task status to ${input.status}`,
  });

  return updated;
}
