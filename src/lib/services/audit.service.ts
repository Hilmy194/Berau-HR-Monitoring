import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    // Audit logging should never break the main operation
  }
}
