import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const monthStart = startOfMonth(new Date());

  const [expenses, monthTotal, byCat] = await Promise.all([
    prisma.expense.findMany({ orderBy: { date: "desc" }, take: 100 }),
    prisma.expense.aggregate({
      where:  { date: { gte: monthStart } },
      _sum:   { amount: true },
    }),
    prisma.expense.groupBy({
      by:      ["category"],
      where:   { date: { gte: monthStart } },
      _sum:    { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  const CATEGORY_LABELS: Record<string, string> = {
    chemicals: "Chemicals", gas: "Gas", equipment: "Equipment",
    marketing: "Marketing", software: "Software", other: "Other",
  };

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-[22px] font-bold text-white tracking-tight">Expenses</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">Track and categorize business costs</p>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {byCat.map((c) => (
          <div key={c.category} className="glass p-4">
            <p className="text-[10.5px] uppercase tracking-widest text-zinc-600 mb-2">
              {CATEGORY_LABELS[c.category] ?? c.category}
            </p>
            <p className="text-[17px] font-bold text-white">
              {formatCurrency(Number(c._sum.amount ?? 0))}
            </p>
          </div>
        ))}
        <div className="glass p-4 border-brand-500/30">
          <p className="text-[10.5px] uppercase tracking-widest text-zinc-600 mb-2">Total MTD</p>
          <p className="text-[17px] font-bold text-brand-300">
            {formatCurrency(Number(monthTotal._sum.amount ?? 0))}
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-1">
          <ExpenseForm />
        </div>
        <div className="xl:col-span-2">
          <ExpenseList
            expenses={expenses.map((e) => ({
              ...e,
              amount: Number(e.amount),
              date:   e.date.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
