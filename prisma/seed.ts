import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const ROLE = { HR_ADMIN: "HR_ADMIN", NEW_HIRE: "NEW_HIRE" } as const;
const PROBATION_STATUS = {
  ACTIVE: "ACTIVE",
  PASSED: "PASSED",
  FAILED: "FAILED",
  EXTENDED: "EXTENDED",
} as const;
const TASK_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;
const RESULT_STATUS = {
  SCHEDULED: "SCHEDULED",
  PASSED: "PASSED",
  FAILED: "FAILED",
  EXTENDED: "EXTENDED",
} as const;

type EmployeeSeed = {
  name: string;
  email: string;
  password: string;
  department: string;
  position: string;
  joinDate: string;
  probationStatus: string;
  phone?: string;
  address?: string;
  gender?: string;
  supervisorName?: string;
  tasks: Array<{
    title: string;
    description?: string;
    dueOffsetDays: number;
    status: string;
    notes?: string;
    requiresAttachment?: boolean;
  }>;
  presentations: Array<{
    presentationDate: string;
    presentationTime: string;
    location: string;
    score?: number;
    remarks?: string;
    resultStatus: string;
    panelists: Array<{ name: string; position?: string }>;
  }>;
  coachings: Array<{
    coachName: string;
    coachingDate: string;
    goals: string;
    discussionNotes: string;
    resultOutcome: string;
    followUpAction: string;
  }>;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function seedTasks(profileId: string, joinDate: Date, tasks: EmployeeSeed["tasks"]) {
  await prisma.probationTask.createMany({
    data: tasks.map((task) => {
      const dueDate = addDays(joinDate, task.dueOffsetDays);
      return {
        userId: profileId,
        title: task.title,
        description: task.description ?? "",
        dueDate,
        status: task.status,
        notes: task.notes ?? "",
        requiresAttachment: task.requiresAttachment ?? false,
      };
    }),
  });
}

async function seedPresentations(
  profileId: string,
  presentations: EmployeeSeed["presentations"]
) {
  for (const presentation of presentations) {
    await prisma.presentation.create({
      data: {
        userId: profileId,
        presentationDate: new Date(presentation.presentationDate),
        presentationTime: presentation.presentationTime,
        location: presentation.location,
        score: presentation.score ?? null,
        remarks: presentation.remarks ?? null,
        resultStatus: presentation.resultStatus,
        panelists: {
          create: presentation.panelists.map((panelist) => ({
            name: panelist.name,
            position: panelist.position ?? null,
          })),
        },
      },
    });
  }
}

async function seedCoachings(
  profileId: string,
  coachings: EmployeeSeed["coachings"]
) {
  for (const coaching of coachings) {
    await prisma.coachingRecord.create({
      data: {
        profileId,
        coachName: coaching.coachName,
        coachingDate: new Date(coaching.coachingDate),
        goals: coaching.goals,
        discussionNotes: coaching.discussionNotes,
        resultOutcome: coaching.resultOutcome,
        followUpAction: coaching.followUpAction,
      },
    });
  }
}

async function main() {
  console.log("Seeding database with demo data...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const employeePassword = await bcrypt.hash("demo123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hrdigital.com" },
    update: {
      name: "HR Admin",
      password: adminPassword,
      role: ROLE.HR_ADMIN,
    },
    create: {
      name: "HR Admin",
      email: "admin@hrdigital.com",
      password: adminPassword,
      role: ROLE.HR_ADMIN,
    },
  });

  const employees: EmployeeSeed[] = [
    {
      name: "Alya Putri",
      email: "alya.putri@berau.co.id",
      password: "demo123",
      department: "HR",
      position: "HR Officer",
      joinDate: "2026-02-03",
      probationStatus: PROBATION_STATUS.ACTIVE,
      phone: "081234567801",
      address: "Tanjung Redeb",
      gender: "FEMALE",
      supervisorName: "Mira Sari",
      tasks: [
        { title: "Registrasi kedatangan", dueOffsetDays: 0, status: TASK_STATUS.COMPLETED, notes: "Sudah dicatat di logbook." },
        { title: "Pembuatan email", dueOffsetDays: 0, status: TASK_STATUS.COMPLETED },
        { title: "Safety induction", dueOffsetDays: 2, status: TASK_STATUS.COMPLETED, requiresAttachment: true },
        { title: "KPI / target", dueOffsetDays: 4, status: TASK_STATUS.IN_PROGRESS, notes: "Masih finalisasi bersama supervisor." },
        { title: "Project yang sedang berjalan", dueOffsetDays: 5, status: TASK_STATUS.NOT_STARTED },
      ],
      presentations: [
        {
          presentationDate: "2026-05-20",
          presentationTime: "09:00",
          location: "Meeting Room HR-1",
          score: 82,
          remarks: "Stabil, perlu penguatan pada prioritas kerja.",
          resultStatus: RESULT_STATUS.EXTENDED,
          panelists: [
            { name: "Mira Sari", position: "HR Manager" },
            { name: "Dedi Pratama", position: "HR Supervisor" },
          ],
        },
      ],
      coachings: [
        {
          coachName: "Mira Sari",
          coachingDate: "2026-06-10",
          goals: "Meningkatkan ketepatan prioritas harian.",
          discussionNotes: "Sudah paham alur kerja, tetapi masih perlu lebih agresif update progres.",
          resultOutcome: "Progress baik dan responsif.",
          followUpAction: "Review mingguan selama 2 minggu.",
        },
      ],
    },
    {
      name: "Bima Nugraha",
      email: "bima.nugraha@berau.co.id",
      password: "demo123",
      department: "Operations",
      position: "Operations Staff",
      joinDate: "2026-03-17",
      probationStatus: PROBATION_STATUS.PASSED,
      phone: "081234567802",
      address: "Samarinda",
      gender: "MALE",
      supervisorName: "Andi Kurnia",
      tasks: [
        { title: "Company profile", dueOffsetDays: 1, status: TASK_STATUS.COMPLETED },
        { title: "Meet team", dueOffsetDays: 2, status: TASK_STATUS.COMPLETED },
        { title: "Peraturan kerja", dueOffsetDays: 2, status: TASK_STATUS.COMPLETED },
        { title: "Training sistem", dueOffsetDays: 5, status: TASK_STATUS.COMPLETED, requiresAttachment: true, notes: "Sertifikat training diunggah." },
        { title: "KPI / target", dueOffsetDays: 4, status: TASK_STATUS.COMPLETED },
      ],
      presentations: [
        {
          presentationDate: "2026-06-12",
          presentationTime: "13:30",
          location: "Conference Room A",
          score: 91,
          remarks: "Konsisten dan siap lanjut ke status passed.",
          resultStatus: RESULT_STATUS.PASSED,
          panelists: [
            { name: "Andi Kurnia", position: "Operations Supervisor" },
            { name: "Rina Melati", position: "Plant Coordinator" },
          ],
        },
      ],
      coachings: [
        {
          coachName: "Andi Kurnia",
          coachingDate: "2026-04-18",
          goals: "Meningkatkan pemahaman SOP lapangan.",
          discussionNotes: "Bima cepat belajar dan mulai mandiri dalam dokumentasi harian.",
          resultOutcome: "Target coaching tercapai.",
          followUpAction: "Cukup monitoring bulanan.",
        },
      ],
    },
    {
      name: "Citra Lestari",
      email: "citra.lestari@berau.co.id",
      password: "demo123",
      department: "Finance",
      position: "Finance Trainee",
      joinDate: "2026-05-05",
      probationStatus: PROBATION_STATUS.EXTENDED,
      phone: "081234567803",
      address: "Berau",
      gender: "FEMALE",
      supervisorName: "Rani Oktavia",
      tasks: [
        { title: "Penandatanganan dokumen", dueOffsetDays: 0, status: TASK_STATUS.COMPLETED },
        { title: "Akun SAP/Oracle/HRIS sudah dibuat", dueOffsetDays: 1, status: TASK_STATUS.COMPLETED },
        { title: "Peraturan kerja", dueOffsetDays: 2, status: TASK_STATUS.IN_PROGRESS, notes: "Masih menunggu review kebijakan finance." },
        { title: "Benefit dan fasilitas", dueOffsetDays: 2, status: TASK_STATUS.NOT_STARTED },
        { title: "KPI / target", dueOffsetDays: 4, status: TASK_STATUS.IN_PROGRESS },
      ],
      presentations: [
        {
          presentationDate: "2026-06-20",
          presentationTime: "10:00",
          location: "Meeting Room Finance",
          score: 78,
          remarks: "Pemahaman dasar baik, tetapi perlu tambahan waktu adaptasi.",
          resultStatus: RESULT_STATUS.EXTENDED,
          panelists: [
            { name: "Rani Oktavia", position: "Finance Manager" },
            { name: "Hendra Wijaya", position: "Senior Accountant" },
          ],
        },
      ],
      coachings: [
        {
          coachName: "Rani Oktavia",
          coachingDate: "2026-06-14",
          goals: "Memperkuat ketelitian input data dan alur approval.",
          discussionNotes: "Sudah bagus untuk detail, tetapi ritme kerja masih perlu distabilkan.",
          resultOutcome: "Perlu perpanjangan probation.",
          followUpAction: "Pendampingan 30 hari dan evaluasi ulang.",
        },
      ],
    },
    {
      name: "Dimas Saputra",
      email: "dimas.saputra@berau.co.id",
      password: "demo123",
      department: "IT",
      position: "Junior Developer",
      joinDate: "2026-06-16",
      probationStatus: PROBATION_STATUS.ACTIVE,
      phone: "081234567804",
      address: "Balikpapan",
      gender: "MALE",
      supervisorName: "Fajar Nugroho",
      tasks: [
        { title: "Laptop", dueOffsetDays: 0, status: TASK_STATUS.COMPLETED },
        { title: "Email", dueOffsetDays: 0, status: TASK_STATUS.COMPLETED },
        { title: "Meet user", dueOffsetDays: 2, status: TASK_STATUS.IN_PROGRESS },
        { title: "Cara kerja tim", dueOffsetDays: 4, status: TASK_STATUS.NOT_STARTED },
        { title: "Project yang sedang berjalan", dueOffsetDays: 5, status: TASK_STATUS.NOT_STARTED },
      ],
      presentations: [],
      coachings: [],
    },
    {
      name: "Eka Prameswari",
      email: "eka.prameswari@berau.co.id",
      password: "demo123",
      department: "Procurement",
      position: "Procurement Officer",
      joinDate: "2026-01-12",
      probationStatus: PROBATION_STATUS.FAILED,
      phone: "081234567805",
      address: "Bontang",
      gender: "FEMALE",
      supervisorName: "Nanda Putra",
      tasks: [
        { title: "Registrasi kedatangan", dueOffsetDays: 0, status: TASK_STATUS.COMPLETED },
        { title: "Pengurusan akses gedung", dueOffsetDays: 1, status: TASK_STATUS.COMPLETED },
        { title: "Penjelasan Job Description", dueOffsetDays: 3, status: TASK_STATUS.COMPLETED },
        { title: "Project yang sedang berjalan", dueOffsetDays: 5, status: TASK_STATUS.NOT_STARTED, notes: "Tidak sempat masuk tahap ini." },
        { title: "KPI / target", dueOffsetDays: 4, status: TASK_STATUS.NOT_STARTED },
      ],
      presentations: [
        {
          presentationDate: "2026-04-10",
          presentationTime: "15:00",
          location: "Meeting Room Procurement",
          score: 64,
          remarks: "Belum memenuhi ekspektasi role.",
          resultStatus: RESULT_STATUS.FAILED,
          panelists: [
            { name: "Nanda Putra", position: "Procurement Manager" },
            { name: "Sinta Dewi", position: "Head of Operations" },
          ],
        },
      ],
      coachings: [
        {
          coachName: "Nanda Putra",
          coachingDate: "2026-03-22",
          goals: "Meningkatkan disiplin follow-up vendor dan dokumentasi.",
          discussionNotes: "Sudah diberikan arahan berulang, namun progres masih lambat.",
          resultOutcome: "Tidak mencapai target probation.",
          followUpAction: "Evaluasi akhir status probation dan replacement plan.",
        },
      ],
    },
  ];

  for (const employee of employees) {
    const password = employee.password === "demo123" ? employeePassword : await bcrypt.hash(employee.password, 10);
    const joinDate = new Date(employee.joinDate);

    const user = await prisma.user.upsert({
      where: { email: employee.email },
      update: {
        name: employee.name,
        password,
        role: ROLE.NEW_HIRE,
      },
      create: {
        name: employee.name,
        email: employee.email,
        password,
        role: ROLE.NEW_HIRE,
      },
    });

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    const profile = existingProfile
      ? await prisma.profile.update({
          where: { userId: user.id },
          data: {
            department: employee.department,
            position: employee.position,
            joinDate,
            probationStartDate: joinDate,
            probationEndDate: addDays(joinDate, 90),
            probationStatus: employee.probationStatus,
            phone: employee.phone ?? null,
            address: employee.address ?? null,
            gender: employee.gender ?? null,
            supervisorName: employee.supervisorName ?? null,
          },
        })
      : await prisma.profile.create({
          data: {
            userId: user.id,
            department: employee.department,
            position: employee.position,
            joinDate,
            probationStartDate: joinDate,
            probationEndDate: addDays(joinDate, 90),
            probationStatus: employee.probationStatus,
            phone: employee.phone ?? null,
            address: employee.address ?? null,
            gender: employee.gender ?? null,
            supervisorName: employee.supervisorName ?? null,
          },
        });

    const taskCount = await prisma.probationTask.count({ where: { userId: profile.id } });
    if (taskCount === 0) {
      await seedTasks(profile.id, joinDate, employee.tasks);
    }

    const presentationCount = await prisma.presentation.count({ where: { userId: profile.id } });
    if (presentationCount === 0) {
      await seedPresentations(profile.id, employee.presentations);
    }

    const coachingCount = await prisma.coachingRecord.count({ where: { profileId: profile.id } });
    if (coachingCount === 0) {
      await seedCoachings(profile.id, employee.coachings);
    }
  }

  const seedAuditExists = await prisma.auditLog.findFirst({
    where: {
      action: "SEED",
      entity: "System",
      entityId: "seed-demo",
    },
  });

  if (!seedAuditExists) {
    await prisma.auditLog.create({
      data: {
        action: "SEED",
        entity: "System",
        entityId: "seed-demo",
        userId: admin.id,
        details: "Database seeded with demo admin, employees, tasks, presentations, and coaching records.",
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log("  HR Admin: admin@hrdigital.com / admin123");
  console.log("  Demo employee password: demo123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
