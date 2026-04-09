import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label:      string;
  value:      string | number;
  isCurrency?: boolean;
  change?:    number;   // pct change vs prior period
  sub?:       string;
  accent?:    boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  isCurrency,
  change,
  sub,
  accent,
  className,
}: MetricCardProps) {
  const displayValue = isCurrency && typeof value === "number"
    ? formatCurrency(value)
    : String(value);

  const positive = change !== undefined && change > 0;
  const negative = change !== undefined && change < 0;
  const neutral  = change !== undefined && change === 0;

  return (
    <div
      className={cn(
        "glass p-5 relative overflow-hidden",
        accent && "border-brand-500/30",
        className
      )}
    >
      {accent && (
        <div className="absolute inset-0 bg-brand-glow opacity-40 pointer-events-none" />
      )}

      <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-3">
        {label}
      </p>

      <p className={cn(
        "text-3xl font-bold tracking-tight",
        accent ? "text-brand-300" : "text-white"
      )}>
        {displayValue}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {change !== undefined && (
          <span className={cn(
            "flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded",
            positive && "text-emerald-400 bg-emerald-400/10",
            negative && "text-red-400 bg-red-400/10",
            neutral  && "text-zinc-500 bg-zinc-500/10",
          )}>
            {positive && <TrendingUp size={11} />}
            {negative && <TrendingDown size={11} />}
            {neutral  && <Minus size={11} />}
            {change > 0 ? "+" : ""}{formatPercent(change)}
          </span>
        )}
        {sub && <span className="text-[11px] text-zinc-600">{sub}</span>}
      </div>
    </div>
  );
}
