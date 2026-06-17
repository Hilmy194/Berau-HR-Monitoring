import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileSetupSchema = z.object({
  // Personal
  nik: z.string().min(1, "NIK is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  // Employment
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  joinDate: z.string().min(1, "Join date is required"),
  supervisorName: z.string().min(1, "Supervisor name is required"),
  // Documents
  cvUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  photoUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  // Emergency
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
});

export const taskSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional().default(""),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  notes: z.string().optional().default(""),
});

/**
 * Used by employees to self-check their own tasks. Unlike `taskSchema`, this
 * intentionally exposes ONLY the status field — employees cannot rename,
 * reschedule, or otherwise alter a task's content. Ownership is verified in
 * the service layer against the authenticated user's profile.
 */
export const taskStatusUpdateSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
});

export const presentationSchema = z.object({
  presentationDate: z.string().min(1, "Presentation date is required"),
  presentationTime: z.string().min(1, "Presentation time is required"),
  location: z.string().min(1, "Location is required"),
  meetingLink: z.string().url("Must be a valid URL").or(z.literal("")),
  score: z.number().min(0, "Score must be at least 0").max(100, "Score must be at most 100").nullable(),
  remarks: z.string().optional().default(""),
  resultStatus: z.enum(["SCHEDULED", "PASSED", "FAILED", "EXTENDED"]),
});

export const panelistSchema = z.object({
  name: z.string().min(2, "Panelist name is required"),
  position: z.string().optional().default(""),
});

export const employeeCreateSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  department: z.string().optional().default(""),
  position: z.string().optional().default(""),
  // Required: every HR-created employee needs a join date so the 100-day
  // probation timeline (start/end) can be computed up front. Without it the
  // dashboard would be stuck on "Day 0/100" forever.
  joinDate: z.string().min(1, "Join date is required"),
});

export const scoreSchema = z.object({
  score: z.number().min(0, "Score must be at least 0").max(100, "Score must be at most 100"),
  remarks: z.string().optional().default(""),
  recommendation: z.enum(["PASSED", "FAILED", "EXTENDED"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type TaskStatusUpdate = z.infer<typeof taskStatusUpdateSchema>;
export type PresentationInput = z.infer<typeof presentationSchema>;
export type PanelistInput = z.infer<typeof panelistSchema>;
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type ScoreInput = z.infer<typeof scoreSchema>;
