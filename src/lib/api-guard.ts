import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  if (session.user.role !== "HR_ADMIN") {
    return {
      error: NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}
