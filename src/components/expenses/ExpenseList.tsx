"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const CATEGORY_COLORS: Record<string, string> = {
  chemicals:  "bg-purple-500/15 text-purple-300",
  gas:        "bg-amber-500/15  text-amber-300",
  equipment:  "bg-blue-500/15   text-blue-300",
  marketing:  "bg-emerald-500/15 text-emerald-300",
  software:   "bg-pink-500/15   text-pink-300",
  other:      "bg-zinc-500/15   text-zinc-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  chemicals:  "Chemicals",
  gas:        "Gas",
  equipment:  "Equipment",
  marketing:  "Marketing",
  software:   "Software",
  other:      "Other",
};

interface Expense {
  id:          string;
  amount:      number;
  category:    string;
  description: string;
  date:        string;
  notes?:      string | null;
}

interface ExpenseListProps {
  expenses: Expense[];
}

export function ExpenseList({ expenses: initial }: ExpenseListProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deleteExpense(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      setExpenses((e) => e.filter((x) => x.id !== id));
      router.refresh();
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-zinc-600 text-sm">No expenses recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)]">
        <p className="text-[12px] font-medium text-zinc-500">{expenses.length} expenses</p>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {expenses.map((e) => (
          <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{e.description}</p>
              {e.notes && <p className="text-[11px] text-zinc-600 truncate mt-0.5">{e.notes}</p>}
            </div>
            <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full shrink-0 ${CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.other}`}>
              {CATEGORY_LABELS[e.category] ?? e.category}
            </span>
            <p className="text-[11px] text-zinc-500 shrink-0 w-20 text-right">{formatDate(e.date)}</p>
            <p className="text-[14px] font-semibold text-white shrink-0 w-20 text-right">
              {formatCurrency(Number(e.amount))}
            </p>
            <button
              onClick={() => deleteExpense(e.id)}
              disabled={deleting === e.id}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 disabled:opacity-30"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
