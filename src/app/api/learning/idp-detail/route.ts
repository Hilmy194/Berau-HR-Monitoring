import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getIdpDetailForEmployee } from "@/lib/services/idp-detail.service";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ error: "Parameter name wajib diisi." }, { status: 400 });
  }

  try {
    const result = await getIdpDetailForEmployee(name);
    if (!result.employee) {
      return NextResponse.json(
        { error: `Data IDP untuk ${name} tidak ditemukan.` },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat detail IDP.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
