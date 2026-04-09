import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInsights } from "@/lib/ai";
import { buildFinancialSummary } from "@/lib/finance";
import { startOfWeek, startOfMonth } from "date-fns";

// GET: return stored insights (newest first)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unread = searchParams.get("unread") === "true";
  const limit  = parseInt(searchParams.get("limit") ?? "10");

  const insights = await prisma.insight.findMany({
    where: unread ? { readAt: null } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(insights);
}

// POST: generate fresh insights via AI and persist them
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const period: "weekly" | "monthly" = body.period ?? "weekly";

  const now  = new Date();
  const from = period === "weekly" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);

  const summary = await buildFinancialSummary(period, from, now);
  const aiInsights = await generateInsights(summary);

  const created = await prisma.$transaction(
    aiInsights.map((ins) =>
      prisma.insight.create({
        data: {
          type:     ins.type,
          severity: ins.severity,
          title:    ins.title,
          body:     ins.body,
          period,
          data:     summary as any,
        },
      })
    )
  );

  return NextResponse.json(created, { status: 201 });
}

// PATCH: mark insight as read
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updated = await prisma.insight.update({
    where: { id },
    data:  { readAt: new Date() },
  });

  return NextResponse.json(updated);
}
