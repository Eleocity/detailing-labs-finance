import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildFinancialSummary, getRevenueChartData } from "@/lib/finance";
import { weeklyReport } from "@/lib/ai";
import { startOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "dashboard"; // dashboard | weekly | monthly | chart | csv

  const now = new Date();

  if (type === "chart") {
    const days = parseInt(searchParams.get("days") ?? "30");
    const data = await getRevenueChartData(days);
    return NextResponse.json(data);
  }

  if (type === "weekly") {
    const from = startOfWeek(now, { weekStartsOn: 1 });
    const summary = await buildFinancialSummary("weekly", from, now);
    const report  = await weeklyReport(summary);
    return NextResponse.json({ summary, report });
  }

  if (type === "monthly") {
    const from = startOfMonth(now);
    const summary = await buildFinancialSummary("monthly", from, now);
    return NextResponse.json(summary);
  }

  if (type === "csv") {
    // Export jobs as CSV
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : startOfMonth(now);
    const to   = searchParams.get("to")   ? new Date(searchParams.get("to")!)   : now;

    const jobs = await prisma.job.findMany({
      where: { scheduledAt: { gte: from, lte: to }, status: "completed" },
      include: { customer: true },
      orderBy: { scheduledAt: "desc" },
    });

    const rows = [
      ["Date", "Customer", "Service", "Revenue", "Est. Cost", "Profit", "Margin %"].join(","),
      ...jobs.map((j) =>
        [
          j.scheduledAt.toISOString().split("T")[0],
          `"${j.customer.firstName} ${j.customer.lastName}"`,
          `"${j.serviceLabel}"`,
          Number(j.price).toFixed(2),
          Number(j.estimatedCost ?? 0).toFixed(2),
          Number(j.profit ?? 0).toFixed(2),
          Number(j.profitMargin ?? 0).toFixed(1) + "%",
        ].join(",")
      ),
    ].join("\n");

    return new NextResponse(rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="detailing-labs-jobs-${from.toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // Default: dashboard summary
  const weekFrom  = startOfWeek(now, { weekStartsOn: 1 });
  const monthFrom = startOfMonth(now);

  const [weekSummary, monthSummary, recentJobs] = await Promise.all([
    buildFinancialSummary("weekly",  weekFrom,  now),
    buildFinancialSummary("monthly", monthFrom, now),
    prisma.job.findMany({
      where: { status: "completed" },
      include: { customer: true },
      orderBy: { scheduledAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({ weekSummary, monthSummary, recentJobs });
}
