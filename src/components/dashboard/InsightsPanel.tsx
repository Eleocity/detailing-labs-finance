"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, AlertTriangle, Info, CheckCircle, Loader2, RefreshCw } from "lucide-react";

interface Insight {
  id:       string;
  type:     string;
  severity: string;
  title:    string;
  body:     string;
  createdAt: string;
}

interface InsightsPanelProps {
  insights: Insight[];
}

const SEVERITY_CONFIG = {
  success:  { icon: CheckCircle,    bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon_color: "text-emerald-400" },
  info:     { icon: Info,           bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-300",   icon_color: "text-blue-400" },
  warning:  { icon: AlertTriangle,  bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-300",  icon_color: "text-amber-400" },
  critical: { icon: AlertTriangle,  bg: "bg-red-500/10",     border: "border-red-500/20",     text: "text-red-300",    icon_color: "text-red-400" },
};

export function InsightsPanel({ insights: initial }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>(initial);
  const [loading, setLoading]   = useState(false);

  async function regenerate() {
    setLoading(true);
    try {
      const res  = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period: "weekly" }) });
      const data = await res.json();
      setInsights(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-brand-400" />
          <h3 className="text-[13px] font-semibold text-white">AI Insights</h3>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400">
            {insights.length}
          </span>
        </div>
        <button
          onClick={regenerate}
          disabled={loading}
          className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-40"
        >
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : <RefreshCw size={12} />
          }
          {loading ? "Thinking…" : "Refresh"}
        </button>
      </div>

      <div className="space-y-2.5">
        {insights.length === 0 && (
          <p className="text-[12px] text-zinc-600 text-center py-4">
            No insights yet — click Refresh to generate.
          </p>
        )}
        {insights.map((ins) => {
          const config = SEVERITY_CONFIG[ins.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info;
          const Icon   = config.icon;
          return (
            <div
              key={ins.id}
              className={cn("rounded-lg p-3.5 border", config.bg, config.border)}
            >
              <div className="flex items-start gap-2.5">
                <Icon size={13} className={cn("mt-0.5 shrink-0", config.icon_color)} />
                <div>
                  <p className={cn("text-[12.5px] font-semibold mb-0.5", config.text)}>
                    {ins.title}
                  </p>
                  <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                    {ins.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
