import { prisma } from "@/lib/prisma";
import { getDashboardMetrics, buildFinancialSummary, getRevenueChartData } from "@/lib/finance";
import { pctChange } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ServiceChart } from "@/components/dashboard/ServiceChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { startOfWeek } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, chartData, weekSummary, insights, recentJobs] = await Promise.all([
    getDashboardMetrics(),
    getRevenueChartData(30),
    buildFinancialSummary("weekly", startOfWeek(new Date(), { weekStartsOn: 1 }), new Date()),
    prisma.insight.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.job.findMany({
      where:   { status: "completed" },
      include: { customer: true },
      orderBy: { scheduledAt: "desc" },
      take:    5,
    }),
  ]);

  const weekChange  = metrics.week.revenue  > 0 && weekSummary.priorPeriod
    ? pctChange(metrics.week.revenue, weekSummary.priorPeriod.revenue) : undefined;
  const monthChange = metrics.month.revenue > 0 && weekSummary.priorPeriod
    ? undefined : undefined;

  return (
    <div className="p-7 space-y-7 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Revenue Today"
          value={metrics.today.revenue}
          isCurrency
          sub="vs yesterday"
        />
        <MetricCard
          label="Revenue This Week"
          value={metrics.week.revenue}
          isCurrency
          change={weekChange}
          sub="vs last week"
          accent
        />
        <MetricCard
          label="Revenue This Month"
          value={metrics.month.revenue}
          isCurrency
          sub="month to date"
        />
        <MetricCard
          label="Net Profit (Month)"
          value={metrics.month.profit}
          isCurrency
          sub={`${metrics.month.margin.toFixed(1)}% margin`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue trend */}
        <div className="xl:col-span-2 glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-white">Revenue — Last 30 Days</h3>
            <span className="text-[11px] text-zinc-600">Daily</span>
          </div>
          <RevenueChart data={chartData} />
        </div>

        {/* Service breakdown */}
        <div className="glass p-5">
          <h3 className="text-[13px] font-semibold text-white mb-4">Revenue by Service</h3>
          <ServiceChart data={weekSummary.byServiceType} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent jobs */}
        <div className="xl:col-span-2 glass overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-[13px] font-semibold text-white">Recent Jobs</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Customer", "Service", "Revenue", "Margin"].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10.5px] uppercase tracking-widest font-medium text-zinc-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {recentJobs.map((j) => (
                <tr key={j.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-[12.5px] font-medium text-white">{j.customer.firstName} {j.customer.lastName}</td>
                  <td className="px-5 py-3 text-[12px] text-zinc-400">{j.serviceLabel}</td>
                  <td className="px-5 py-3 text-[13px] font-semibold text-white">${Number(j.price).toFixed(0)}</td>
                  <td className="px-5 py-3 text-[12px] text-emerald-400 font-semibold">{j.profitMargin ? `${Number(j.profitMargin).toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Insights */}
        <InsightsPanel insights={insights.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))} />
      </div>
    </div>
  );
}
