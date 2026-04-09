"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "chemicals",  label: "Chemicals (COGS)" },
  { value: "gas",        label: "Gas & Transportation" },
  { value: "equipment",  label: "Equipment" },
  { value: "marketing",  label: "Marketing" },
  { value: "software",   label: "Software & Subscriptions" },
  { value: "other",      label: "Other" },
];

export function ExpenseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiMode,  setAiMode]  = useState(false);
  const [form, setForm] = useState({
    amount:      "",
    description: "",
    category:    "",
    notes:       "",
    date:        new Date().toISOString().split("T")[0],
  });

  function set(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit() {
    if (!form.amount || !form.description) return;
    setLoading(true);

    try {
      const res = await fetch("/api/expenses", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:       parseFloat(form.amount),
          description:  form.description,
          category:     aiMode ? undefined : form.category || undefined,
          notes:        form.notes || undefined,
          date:         new Date(form.date).toISOString(),
          aiCategorize: aiMode || !form.category,
        }),
      });

      if (!res.ok) throw new Error("Failed to save expense");

      setForm({ amount: "", description: "", category: "", notes: "", date: new Date().toISOString().split("T")[0] });
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to save expense.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[14px] font-semibold text-white">Add Expense</h3>
        <button
          onClick={() => setAiMode((m) => !m)}
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all",
            aiMode
              ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
              : "bg-white/5 text-zinc-400 border border-white/10 hover:text-zinc-200"
          )}
        >
          <Sparkles size={11} />
          AI Categorize {aiMode ? "ON" : "OFF"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Amount */}
        <div className="col-span-1">
          <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] text-white text-sm placeholder-zinc-600 focus:border-brand-500/50 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Date */}
        <div className="col-span-1">
          <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Date *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] text-white text-sm focus:border-brand-500/50 outline-none transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Description *</label>
          <input
            type="text"
            placeholder="e.g. Chemical Guys shampoo restock"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] text-white text-sm placeholder-zinc-600 focus:border-brand-500/50 outline-none transition-colors"
          />
        </div>

        {/* Category (hidden when AI mode) */}
        {!aiMode && (
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] text-white text-sm focus:border-brand-500/50 outline-none transition-colors"
            >
              <option value="">Select or let AI choose…</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div className="col-span-2">
          <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Notes</label>
          <input
            type="text"
            placeholder="Optional note"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] text-white text-sm placeholder-zinc-600 focus:border-brand-500/50 outline-none transition-colors"
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={loading || !form.amount || !form.description}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-900/40"
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
          : <><PlusCircle size={14} /> Add Expense</>
        }
      </button>
    </div>
  );
}
