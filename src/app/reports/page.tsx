import { buildFinancialSummary } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { startOfWeek, startOfMonth } from "date-fns";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const now        = new Date();
  const weekFrom   = startOfWeek(now, { weekStartsOn: 1 });
  const monthFrom  = startOfMonth(now);

  const [weekSummary, monthSummary] = await Promise.all([
    buildFinancialSummary("weekly",  weekFrom,  now),
    buildFinancialSummary("monthly", monthFrom, now),
  ]);

  const SERVICE_LABELS: Record<string, string> = {
    full_reset: "Full Reset", interior_only: "Interior Only",
    exterior_only: "Exterior Only", ceramic: "Ceramic Coating",
    paint_correction: "Paint Correction", fleet: "Fleet", other: "Other",
  };

  function PctBadge({ val }: { val?: number }) {
    if (val == null) return null;
    const up = val >= 0;
    return (
      <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
        {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {up ? "+" : ""}{val.toFixed(1)}%
      </span>
    );
  }

  const weekRevChange  = weekSummary.priorPeriod && weekSummary.priorPeriod.revenue > 0
    ? ((weekSummary.revenue - weekSummary.priorPeriod.revenue) / weekSummary.priorPeriod.revenue) * 100 : undefined;
  const monthRevChange = monthSummary.priorPeriod && monthSummary.priorPeriod.revenue > 0
    ? ((monthSummary.revenue - monthSummary.priorPeriod.revenue) / monthSummary.priorPeriod.revenue) * 100 : undefined;

  return (
    <div className="p-7 space-y-7 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Reports</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Financial summaries and exports</p>
        </div>
        <a
          href="/api/reports?type=csv"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[13px] font-semibold transition-all"
        >
          <Download size={13} />
          Export CSV
        </a>
      </div>

      {/* Period cards */}
      {[
        { label: "This Week",  summary: weekSummary,  change: weekRevChange },
        { label: "This Month", summary: monthSummary, change: monthRevChange },
      ].map(({ label, summary, change }) => (
        <section key={label} className="glass p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-white">{label}</h2>
            {change != null && <PctBadge val={change} />}
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Revenue",  value: formatCurrency(summary.revenue)  },
              { label: "Expenses", value: formatCurrency(summary.expenses) },
              { label: "Profit",   value: formatCurrency(summary.profit)   },
              { label: "Margin",   value: formatPercent(summary.margin)    },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-[var(--surface-3)] rounded-lg p-3.5 border border-[var(--border)]">
                <p className="text-[10.5px] uppercase tracking-widest text-zinc-600 mb-1.5">{kpi.label}</p>
                <p className="text-[18px] font-bold text-white">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Service breakdown table */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600 mb-3">By Service Type</p>
            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-3)]">
                    {["Service", "Jobs", "Revenue", "Avg Margin"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10.5px] uppercase tracking-widest text-zinc-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {summary.byServiceType.sort((a, b) => b.revenue - a.revenue).map((s) => (
                    <tr key={s.type} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-[12.5px] text-white">{SERVICE_LABELS[s.type] ?? s.type}</td>
                      <td className="px-4 py-3 text-[12px] text-zinc-400">{s.count}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-white">{formatCurrency(s.revenue)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          s.avgMargin >= 75 ? "bg-emerald-500/15 text-emerald-400"
                          : s.avgMargin >= 65 ? "bg-brand-500/15 text-brand-400"
                          : "bg-amber-500/15 text-amber-400"
                        }`}>
                          {formatPercent(s.avgMargin)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expense breakdown */}
          {summary.byExpenseCategory.length > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600 mb-3">Expenses by Category</p>
              <div className="space-y-2">
                {summary.byExpenseCategory.sort((a, b) => b.amount - a.amount).map((cat) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <p className="text-[12px] text-zinc-400 w-32 shrink-0 capitalize">{cat.category}</p>
                    <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${Math.min(cat.pctOfRevenue * 2, 100)}%` }}
                      />
                    </div>
                    <p className="text-[12px] font-semibold text-white w-16 text-right">{formatCurrency(cat.amount)}</p>
                    <p className="text-[11px] text-zinc-600 w-10 text-right">{cat.pctOfRevenue.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
