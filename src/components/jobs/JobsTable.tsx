import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SERVICE_LABELS: Record<string, string> = {
  full_reset:       "Full Reset",
  interior_only:    "Interior Only",
  exterior_only:    "Exterior Only",
  ceramic:          "Ceramic Coating",
  paint_correction: "Paint Correction",
  fleet:            "Fleet",
  other:            "Other",
};

interface Job {
  id:           string;
  serviceType:  string;
  serviceLabel: string;
  price:        number;
  profit:       number | null;
  profitMargin: number | null;
  scheduledAt:  string;
  status:       string;
  customer: {
    firstName: string;
    lastName:  string;
  };
}

interface JobsTableProps {
  jobs: Job[];
}

export function JobsTable({ jobs }: JobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="glass p-10 text-center">
        <p className="text-zinc-600 text-sm">No jobs found. Sync Urable to pull in jobs.</p>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {["Date", "Customer", "Service", "Revenue", "Profit", "Margin"].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-zinc-600"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {jobs.map((job) => {
            const margin = Number(job.profitMargin ?? 0);
            return (
              <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5 text-[12px] text-zinc-500">
                  {formatDate(job.scheduledAt)}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-white font-medium">
                  {job.customer.firstName} {job.customer.lastName}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[12px] text-zinc-300">
                    {SERVICE_LABELS[job.serviceType] ?? job.serviceLabel}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-white">
                  {formatCurrency(Number(job.price))}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-emerald-400">
                  {job.profit != null ? formatCurrency(Number(job.profit)) : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <span className={cn(
                    "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                    margin >= 75 ? "bg-emerald-500/15 text-emerald-400"
                    : margin >= 65 ? "bg-brand-500/15 text-brand-400"
                    : "bg-amber-500/15 text-amber-400"
                  )}>
                    {job.profitMargin != null ? formatPercent(Number(job.profitMargin)) : "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
