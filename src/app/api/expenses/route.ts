import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeExpense } from "@/lib/ai";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

const CreateExpenseSchema = z.object({
  amount:      z.number().positive(),
  description: z.string().min(1),
  category:    z.string().optional(),
  notes:       z.string().optional(),
  date:        z.string().datetime().optional(),
  aiCategorize: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from  = searchParams.get("from");
  const to    = searchParams.get("to");
  const cat   = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip  = parseInt(searchParams.get("skip")  ?? "0");

  const where: any = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to)   where.date.lte = new Date(to);
  }
  if (cat) where.category = cat;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      take:   limit,
      skip,
    }),
    prisma.expense.count({ where }),
  ]);

  return NextResponse.json({ expenses, total });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { amount, description, category, notes, date, aiCategorize } = parsed.data;

  // AI auto-categorization if not provided or requested
  let finalCategory = category;
  if (aiCategorize || !category) {
    try {
      finalCategory = await categorizeExpense(description);
    } catch {
      finalCategory = category ?? "other";
    }
  }

  const expense = await prisma.expense.create({
    data: {
      amount:      new Decimal(amount),
      description,
      category:    finalCategory ?? "other",
      notes,
      date:        date ? new Date(date) : new Date(),
      aiCategory:  aiCategorize ? finalCategory : undefined,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
