import { prisma } from "./prisma";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, subWeeks, subMonths } from "date-fns";
import type { FinancialSummary } from "./ai";

// ─── Revenue & Expense queries ────────────────────────────────────────────────

export async function getRevenueForPeriod(from: Date, to: Date): Promise<number> {
  const result = await prisma.job.aggregate({
    where: {
      status: "completed",
      scheduledAt: { gte: from, lte: to },
    },
    _sum: { price: true },
  });
  return Number(result._sum.price ?? 0);
}

export async function getExpensesForPeriod(from: Date, to: Date): Promise<number> {
  const result = await prisma.expense.aggregate({
    where: { date: { gte: from, lte: to } },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

export async function getProfitForPeriod(from: Date, to: Date) {
  const revenue  = await getRevenueForPeriod(from, to);
  const expenses = await getExpensesForPeriod(from, to);
  const profit   = revenue - expenses;
  const margin   = revenue > 0 ? (profit / revenue) * 100 : 0;
  return { revenue, expenses, profit, margin };
}

// ─── Dashboard metric cards ───────────────────────────────────────────────────

export async function getDashboardMetrics() {
  const now   = new Date();
  const today = startOfDay(now);
  const weekStart  = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const [todayData, weekData, monthData, jobCount] = await Promise.all([
    getProfitForPeriod(today, endOfDay(now)),
    getProfitForPeriod(weekStart, now),
    getProfitForPeriod(monthStart, now),
    prisma.job.count({ where: { status: "completed", scheduledAt: { gte: monthStart } } }),
  ]);

  return {
    today:     todayData,
    week:      weekData,
    month:     monthData,
    jobsThisMonth: jobCount,
  };
}

// ─── Full financial summary for AI ───────────────────────────────────────────

export async function buildFinancialSummary(
  period: "daily" | "weekly" | "monthly",
  from: Date,
  to: Date
): Promise<FinancialSummary> {
  const [jobs, expenses] = await Promise.all([
    prisma.job.findMany({
      where: { status: "completed", scheduledAt: { gte: from, lte: to } },
      include: { customer: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
    }),
  ]);

  const revenue  = jobs.reduce((s, j) => s + Number(j.price), 0);
  const expTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const costEst  = jobs.reduce((s, j) => s + Number(j.estimatedCost ?? 0), 0);
  const totalCost = expTotal || costEst;
  const profit   = revenue - totalCost;
  const margin   = revenue > 0 ? (profit / revenue) * 100 : 0;

  // By service type
  const byType = new Map<string, { revenue: number; count: number; margins: number[] }>();
  for (const j of jobs) {
    const entry = byType.get(j.serviceType) ?? { revenue: 0, count: 0, margins: [] };
    const cost  = Number(j.estimatedCost ?? j.price * 0.18);
    const m     = ((Number(j.price) - cost) / Number(j.price)) * 100;
    entry.revenue += Number(j.price);
    entry.count++;
    entry.margins.push(m);
    byType.set(j.serviceType, entry);
  }

  const byServiceType = Array.from(byType.entries()).map(([type, v]) => ({
    type,
    revenue:   v.revenue,
    count:     v.count,
    avgMargin: v.margins.reduce((a, b) => a + b, 0) / v.margins.length,
  }));

  // By expense category
  const byCat = new Map<string, number>();
  for (const e of expenses) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount));
  }

  const byExpenseCategory = Array.from(byCat.entries()).map(([category, amount]) => ({
    category,
    amount,
    pctOfRevenue: revenue > 0 ? (amount / revenue) * 100 : 0,
  }));

  // Prior period
  let priorPeriodFrom: Date;
  if      (period === "daily")   priorPeriodFrom = new Date(from.getTime() - 86400000);
  else if (period === "weekly")  priorPeriodFrom = subWeeks(from, 1);
  else                           priorPeriodFrom = subMonths(from, 1);

  const priorTo   = new Date(from.getTime() - 1);
  const priorData = await getProfitForPeriod(priorPeriodFrom, priorTo);
  const priorJobs = await prisma.job.count({
    where: { status: "completed", scheduledAt: { gte: priorPeriodFrom, lte: priorTo } },
  });

  return {
    period,
    revenue,
    expenses: totalCost,
    profit,
    margin,
    jobCount:    jobs.length,
    avgJobValue: jobs.length > 0 ? revenue / jobs.length : 0,
    byServiceType,
    byExpenseCategory,
    priorPeriod: {
      revenue:  priorData.revenue,
      expenses: priorData.expenses,
      profit:   priorData.profit,
      jobCount: priorJobs,
    },
  };
}

// ─── Revenue chart data (last N days) ────────────────────────────────────────

export async function getRevenueChartData(days = 30) {
  const from = startOfDay(new Date(Date.now() - days * 86400000));

  const jobs = await prisma.job.findMany({
    where: { status: "completed", scheduledAt: { gte: from } },
    select: { scheduledAt: true, price: true },
    orderBy: { scheduledAt: "asc" },
  });

  // Group by date
  const byDate = new Map<string, number>();
  for (const j of jobs) {
    const dateKey = j.scheduledAt.toISOString().split("T")[0];
    byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + Number(j.price));
  }

  // Fill missing dates with 0
  const result: { date: string; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split("T")[0];
    result.push({ date: key, revenue: byDate.get(key) ?? 0 });
  }

  return result;
}
