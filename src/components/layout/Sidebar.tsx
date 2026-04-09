"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Receipt,
  BarChart3,
  RefreshCw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",          label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs",      label: "Jobs",      icon: Briefcase },
  { href: "/expenses",  label: "Expenses",  icon: Receipt },
  { href: "/reports",   label: "Reports",   icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--surface-1)]">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[var(--border)]">
        <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Zap size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-none">
          <p className="text-[11px] font-medium text-brand-400 tracking-widest uppercase">Detailing Labs</p>
          <p className="text-[13px] font-semibold text-white">Finance</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all",
                active
                  ? "bg-brand-500/15 text-brand-300 shadow-inner"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              )}
            >
              <Icon
                size={15}
                className={cn(active ? "text-brand-400" : "text-zinc-500")}
                strokeWidth={active ? 2.5 : 2}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sync button */}
      <div className="p-3 border-t border-[var(--border)]">
        <SyncButton />
      </div>
    </aside>
  );
}

function SyncButton() {
  async function handleSync() {
    const btn = document.getElementById("sync-btn") as HTMLButtonElement;
    if (btn) btn.disabled = true;
    try {
      const res = await fetch("/api/sync/urable", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`Sync complete: ${data.created} new, ${data.updated} updated`);
      } else {
        alert("Sync failed: " + (data.error ?? "Unknown error"));
      }
    } catch {
      alert("Sync error — check console");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  return (
    <button
      id="sync-btn"
      onClick={handleSync}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all border border-[var(--border)] disabled:opacity-40"
    >
      <RefreshCw size={13} />
      Sync Urable
    </button>
  );
}
