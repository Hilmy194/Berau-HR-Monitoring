import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryNumber = searchParams.get("categoryNumber");
    const search = searchParams.get("search") || searchParams.get("q");
    const pageNumber = searchParams.get("pageNumber");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (categoryNumber && categoryNumber !== "all") {
      where.categoryNumber = parseInt(categoryNumber, 10);
    }

    if (pageNumber && pageNumber !== "all") {
      where.pageNumber = parseInt(pageNumber, 10);
    }

    if (search) {
      where.OR = [
        { workPermitPosition: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { internalCertificates: { contains: search, mode: "insensitive" } },
        { externalCertificates: { contains: search, mode: "insensitive" } },
        { license: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, rows, categoryCounts] = await Promise.all([
      prisma.positionCertificationRequirement.count({ where }),
      prisma.positionCertificationRequirement.findMany({
        where,
        orderBy: { orderIndex: "asc" },
        skip,
        take: limit,
      }),
      prisma.positionCertificationRequirement.groupBy({
        by: ["categoryNumber", "category"],
        _count: { id: true },
        orderBy: { categoryNumber: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      categoryCounts,
      data: rows,
    });
  } catch (error: any) {
    console.error("Error fetching certification requirements:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch certification requirements" },
      { status: 500 }
    );
  }
}
