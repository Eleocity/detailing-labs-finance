"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ServiceData {
  type:      string;
  revenue:   number;
  count:     number;
  avgMargin: number;
}

interface ServiceChartProps {
  data: ServiceData[];
}

const SERVICE_LABELS: Record<string, string> = {
  full_reset:       "Full Reset",
  interior_only:    "Interior",
  exterior_only:    "Exterior",
  ceramic:          "Ceramic",
  paint_correction: "Paint Corr.",
  fleet:            "Fleet",
  other:            "Other",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ServiceData;
  return (
    <div className="glass px-3 py-2 text-sm shadow-xl">
      <p className="text-white font-semibold mb-1">{SERVICE_LABELS[label] ?? label}</p>
      <p className="text-zinc-400 text-[11px]">Revenue: {formatCurrency(d.revenue)}</p>
      <p className="text-zinc-400 text-[11px]">Jobs: {d.count}</p>
      <p className="text-zinc-400 text-[11px]">Avg Margin: {d.avgMargin.toFixed(1)}%</p>
    </div>
  );
}

export function ServiceChart({ data }: ServiceChartProps) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={sorted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="type"
          tickFormatter={(v) => SERVICE_LABELS[v] ?? v}
          tick={{ fill: "#52525b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => `$${v}`}
          tick={{ fill: "#52525b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
          {sorted.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.avgMargin >= 75 ? "#8b5cf6" : entry.avgMargin >= 65 ? "#6d28d9" : "#4c1d95"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
