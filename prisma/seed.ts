import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROLE = { HR_ADMIN: "HR_ADMIN", NEW_HIRE: "NEW_HIRE" } as const;
const GENDER = { FEMALE: "FEMALE" } as const;
const PROBATION = { ACTIVE: "ACTIVE" } as const;
const TASK = { COMPLETED: "COMPLETED", IN_PROGRESS: "IN_PROGRESS", NOT_STARTED: "NOT_STARTED" } as const;
const RESULT = { SCHEDULED: "SCHEDULED" } as const;

async function main() {
  console.log("🌱 Seeding database...");

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const employeePassword = await bcrypt.hash("employee123", 10);

  // ---------------- HR ADMIN ----------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@hrdigital.com" },
    update: {},
    create: {
      name: "HR Admin",
      email: "admin@hrdigital.com",
      password: adminPassword,
      role: ROLE.HR_ADMIN,
    },
  });

  // ---------------- NEW HIRE ----------------
  const joinDate = new Date("2024-01-15");
  const probationStart = joinDate;
  const probationEnd = new Date(joinDate);
  probationEnd.setDate(probationEnd.getDate() + 100);

  const employee = await prisma.user.upsert({
    where: { email: "employee@hrdigital.com" },
    update: {},
    create: {
      name: "Sarah Johnson",
      email: "employee@hrdigital.com",
      password: employeePassword,
      role: ROLE.NEW_HIRE,
      profile: {
        create: {
          nik: "3201234567890001",
          phone: "+62 812 3456 7890",
          address: "Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10220",
          birthDate: new Date("1998-05-20"),
          gender: GENDER.FEMALE,
          department: "Engineering",
          position: "Software Engineer",
          joinDate,
          supervisorName: "Budi Santoso",
          cvUrl: "https://example.com/cv/sarah-johnson.pdf",
          photoUrl: "https://example.com/photo/sarah-johnson.jpg",
          emergencyContactName: "Michael Johnson",
          emergencyContactPhone: "+62 813 9876 5432",
          probationStartDate: probationStart,
          probationEndDate: probationEnd,
          probationStatus: PROBATION.ACTIVE,
        },
      },
    },
    include: { profile: true },
  });

  if (!employee.profile) throw new Error("Employee profile not created");

  // ---------------- PROBATION TASKS ----------------
  const taskDefs = [
    { title: "Complete Onboarding", description: "Finish all onboarding paperwork and orientation sessions", offset: 7, status: TASK.COMPLETED, notes: "Completed on time." },
    { title: "Collect Employee ID Card", description: "Receive physical employee ID card from HR office", offset: 3, status: TASK.COMPLETED, notes: "Collected from HR desk." },
    { title: "Receive Laptop & Equipment", description: "Get assigned laptop, monitor, and office equipment", offset: 5, status: TASK.COMPLETED, notes: "MacBook Pro issued." },
    { title: "Activate Email & Accounts", description: "Set up corporate email and internal system accounts", offset: 4, status: TASK.COMPLETED, notes: "All accounts active." },
    { title: "HR Induction", description: "Attend HR induction covering policies, benefits, and company culture", offset: 10, status: TASK.COMPLETED, notes: "Attended session." },
    { title: "Department Induction", description: "Meet the team and understand department workflows", offset: 14, status: TASK.IN_PROGRESS, notes: "Ongoing with team lead." },
    { title: "Safety Training", description: "Complete mandatory workplace safety training", offset: 21, status: TASK.IN_PROGRESS, notes: "Scheduled next week." },
    { title: "Mid Probation Review", description: "30-day check-in with supervisor to review progress", offset: 30, status: TASK.NOT_STARTED, notes: "" },
    { title: "Presentation Preparation", description: "Prepare slides and demo for final probation presentation", offset: 90, status: TASK.NOT_STARTED, notes: "" },
  ];

  for (const t of taskDefs) {
    const due = new Date(joinDate);
    due.setDate(due.getDate() + t.offset);
    await prisma.probationTask.create({
      data: {
        userId: employee.profile.id,
        title: t.title,
        description: t.description,
        dueDate: due,
        status: t.status,
        notes: t.notes,
      },
    });
  }

  // ---------------- PRESENTATION ----------------
  const presentationDate = new Date(joinDate);
  presentationDate.setDate(presentationDate.getDate() + 95);

  const presentation = await prisma.presentation.create({
    data: {
      userId: employee.profile.id,
      presentationDate,
      presentationTime: "10:00",
      location: "Conference Room A, 5th Floor",
      meetingLink: "https://meet.example.com/probation-sarah",
      score: null,
      remarks: null,
      resultStatus: RESULT.SCHEDULED,
      panelists: {
        create: [
          { name: "Anita Wijaya", position: "HR Manager" },
          { name: "Rizki Pratama", position: "Engineering Manager" },
          { name: "Dewi Lestari", position: "Department Head" },
        ],
      },
    },
  });

  // ---------------- AUDIT LOG ----------------
  await prisma.auditLog.create({
    data: {
      action: "SEED",
      entity: "System",
      entityId: "seed",
      userId: admin.id,
      details: "Database seeded with initial HR Admin and sample new hire.",
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("   HR Admin:    admin@hrdigital.com / admin123");
  console.log("   New Hire:    employee@hrdigital.com / employee123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
