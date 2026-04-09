import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from        = searchParams.get("from");
  const to          = searchParams.get("to");
  const serviceType = searchParams.get("serviceType");
  const limit       = parseInt(searchParams.get("limit") ?? "50");
  const skip        = parseInt(searchParams.get("skip")  ?? "0");

  const where: any = { status: "completed" };
  if (from || to) {
    where.scheduledAt = {};
    if (from) where.scheduledAt.gte = new Date(from);
    if (to)   where.scheduledAt.lte = new Date(to);
  }
  if (serviceType) where.serviceType = serviceType;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { customer: true },
      orderBy: { scheduledAt: "desc" },
      take:   limit,
      skip,
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({ jobs, total });
}
