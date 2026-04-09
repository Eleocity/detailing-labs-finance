import { prisma } from "@/lib/prisma";
import { JobsTable } from "@/components/jobs/JobsTable";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { serviceType?: string; from?: string; to?: string };
}

export default async function JobsPage({ searchParams }: PageProps) {
  const { serviceType, from, to } = searchParams;

  const where: any = { status: "completed" };
  if (serviceType) where.serviceType = serviceType;
  if (from || to) {
    where.scheduledAt = {};
    if (from) where.scheduledAt.gte = new Date(from);
    if (to)   where.scheduledAt.lte = new Date(to);
  }

  const [jobs, total, serviceTypes] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { customer: true },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    }),
    prisma.job.count({ where }),
    prisma.job.groupBy({ by: ["serviceType"], orderBy: { _count: { serviceType: "desc" } } }),
  ]);

  const SERVICE_LABELS: Record<string, string> = {
    full_reset: "Full Reset", interior_only: "Interior Only",
    exterior_only: "Exterior Only", ceramic: "Ceramic Coating",
    paint_correction: "Paint Correction", fleet: "Fleet", other: "Other",
  };

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Jobs</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">{total} completed jobs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <a
          href="/jobs"
          className={`text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all ${
            !serviceType ? "bg-brand-500/20 border-brand-500/30 text-brand-300" : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          All Services
        </a>
        {serviceTypes.map((s) => (
          <a
            key={s.serviceType}
            href={`/jobs?serviceType=${s.serviceType}`}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all ${
              serviceType === s.serviceType
                ? "bg-brand-500/20 border-brand-500/30 text-brand-300"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {SERVICE_LABELS[s.serviceType] ?? s.serviceType}
          </a>
        ))}
      </div>

      <JobsTable
        jobs={jobs.map((j) => ({
          ...j,
          price:        Number(j.price),
          profit:       j.profit       ? Number(j.profit)       : null,
          profitMargin: j.profitMargin ? Number(j.profitMargin) : null,
          scheduledAt:  j.scheduledAt.toISOString(),
        }))}
      />
    </div>
  );
}
