import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { REPORTING_LINE_CODE_PREFIX } from "@/lib/reporting-line";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET all positions and departments for selection dropdowns
export async function GET() {
  try {
    const [positions, departments] = await Promise.all([
      prisma.organizationPosition.findMany({
        where: { isActive: true },
        select: {
          id: true,
          positionCode: true,
          positionName: true,
          jobLevel: true,
          currentHolder: true,
          holderPersonnelNumber: true,
          reportsToId: true,
          departmentId: true,
          department: {
            select: {
              name: true,
              division: {
                select: {
                  name: true,
                  directorate: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ positionName: "asc" }],
      }),
      prisma.organizationDepartment.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          division: {
            select: {
              name: true,
              directorate: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ name: "asc" }],
      }),
    ]);

    return NextResponse.json({
      positions: positions.map((p) => ({
        id: p.id,
        positionCode: p.positionCode,
        positionName: p.positionName,
        jobLevel: p.jobLevel,
        currentHolder: p.currentHolder,
        holderPersonnelNumber: p.holderPersonnelNumber,
        reportsToId: p.reportsToId,
        departmentId: p.departmentId,
        departmentName: p.department.name,
        divisionName: p.department.division.name,
        directorateName: p.department.division.directorate.name,
      })),
      departments: departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        divisionName: d.division.name,
        directorateName: d.division.directorate.name,
      })),
    });
  } catch (error) {
    console.error("[API_GET_POSITIONS_ERROR]", error);
    return NextResponse.json({ error: "Gagal memuat daftar posisi." }, { status: 500 });
  }
}

// POST create a new position
export async function POST(req: Request) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const {
      positionName,
      jobLevel,
      currentHolder,
      holderPersonnelNumber,
      reportsToId,
      departmentId,
    } = body;

    if (!positionName || !jobLevel || !departmentId) {
      return NextResponse.json(
        { error: "Nama posisi, level jabatan, dan departemen wajib diisi." },
        { status: 400 },
      );
    }

    const nik = (holderPersonnelNumber || "").trim();
    const positionCode = nik
      ? `${REPORTING_LINE_CODE_PREFIX}${nik}`
      : `${REPORTING_LINE_CODE_PREFIX}POS-${Date.now().toString(36).toUpperCase()}`;

    // Verify department exists
    const dept = await prisma.organizationDepartment.findUnique({
      where: { id: departmentId },
    });
    if (!dept) {
      return NextResponse.json({ error: "Departemen yang dipilih tidak valid." }, { status: 400 });
    }

    const created = await prisma.organizationPosition.create({
      data: {
        positionCode,
        positionName: positionName.trim(),
        jobLevel: jobLevel.trim(),
        currentHolder: currentHolder ? currentHolder.trim() : null,
        holderPersonnelNumber: nik || null,
        reportsToId: reportsToId || null,
        departmentId,
        isActive: true,
      },
      include: {
        department: {
          include: {
            division: {
              include: {
                directorate: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Posisi baru berhasil ditambahkan.",
      position: created,
    }, { status: 201 });
  } catch (error) {
    console.error("[API_CREATE_POSITION_ERROR]", error);
    return NextResponse.json({ error: "Gagal menambahkan posisi." }, { status: 500 });
  }
}
