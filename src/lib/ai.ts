/**
 * AI Service — Detailing Labs Finance
 * 
 * Uses OpenAI to:
 *  1. categorizeExpense(text)       → expense category
 *  2. generateInsights(data)        → array of insight objects
 *  3. weeklyReport(data)            → human-readable summary
 */

import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinancialSummary {
  period: "daily" | "weekly" | "monthly";
  revenue:           number;
  expenses:          number;
  profit:            number;
  margin:            number;
  jobCount:          number;
  avgJobValue:       number;
  byServiceType:     { type: string; revenue: number; count: number; avgMargin: number }[];
  byExpenseCategory: { category: string; amount: number; pctOfRevenue: number }[];
  priorPeriod?: {
    revenue:   number;
    expenses:  number;
    profit:    number;
    jobCount:  number;
  };
}

export interface AiInsight {
  type:     "trend" | "anomaly" | "recommendation" | "alert";
  severity: "info" | "warning" | "success" | "critical";
  title:    string;
  body:     string;
}

// ─── 1. Categorize Expense ────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  "chemicals",
  "gas",
  "equipment",
  "marketing",
  "software",
  "other",
] as const;

export async function categorizeExpense(description: string): Promise<string> {
  const prompt = `You are classifying a business expense for a mobile automotive detailing company.

Given this expense description: "${description}"

Classify it into exactly ONE of these categories:
- chemicals     → detailing chemicals, wax, coatings, cleaners, applicators
- gas           → fuel, tolls, mileage, vehicle maintenance
- equipment     → polishers, vacuums, tools, machines, accessories
- marketing     → ads, photography, branding, printing, promotions
- software      → subscriptions, apps, CRM, website
- other         → anything that doesn't fit above

Respond with ONLY the category slug (lowercase, no punctuation). No explanation.`;

  const res = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 10,
    temperature: 0,
  });

  const raw = res.choices[0].message.content?.trim().toLowerCase() ?? "other";
  return EXPENSE_CATEGORIES.includes(raw as any) ? raw : "other";
}

// ─── 2. Generate Insights ────────────────────────────────────────────────────

export async function generateInsights(
  summary: FinancialSummary
): Promise<AiInsight[]> {
  const prompt = `You are an expert financial analyst for a mobile automotive detailing business called Detailing Labs in Southeast Wisconsin.

Analyze this ${summary.period} financial data and return a JSON array of 3–5 insights:

FINANCIAL DATA:
${JSON.stringify(summary, null, 2)}

Each insight must follow this exact JSON structure:
{
  "type":     "trend" | "anomaly" | "recommendation" | "alert",
  "severity": "info" | "warning" | "success" | "critical",
  "title":    "Short title (max 8 words)",
  "body":     "1–2 sentence insight with a specific number or actionable suggestion."
}

Rules:
- Be specific — include actual dollar amounts and percentages from the data
- Prioritize actionable insights over generic observations
- Flag chemical spend above 16% of revenue as a warning
- Highlight if any service type has margin below 60%
- Note week-over-week or month-over-month trends if prior period data is present
- Recommend ceramic upsells if ceramic margin is > 75%

Return ONLY the JSON array, no markdown, no explanation.`;

  const res = await getOpenAI().chat.completions.create({
    model:       "gpt-4o",
    messages:    [{ role: "user", content: prompt }],
    max_tokens:  800,
    temperature: 0.3,
  });

  const raw = res.choices[0].message.content?.trim() ?? "[]";

  try {
    const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned) as AiInsight[];
  } catch {
    console.error("Failed to parse AI insights JSON:", raw);
    return [];
  }
}

// ─── 3. Weekly Report ─────────────────────────────────────────────────────────

export async function weeklyReport(summary: FinancialSummary): Promise<string> {
  const prompt = `You are writing the weekly financial briefing for Evan, the owner of Detailing Labs — a premium mobile auto detailing business in Racine/Kenosha/Milwaukee, WI.

WEEKLY DATA:
${JSON.stringify(summary, null, 2)}

Write a concise, professional weekly report in plain English (2–3 short paragraphs). Include:
1. Revenue and profit summary with week-over-week comparison if available
2. Top and bottom performing service types
3. One specific action item for next week

Keep it sharp, direct, and data-driven. Use dollar amounts and percentages. Write as if talking directly to Evan.`;

  const res = await getOpenAI().chat.completions.create({
    model:       "gpt-4o",
    messages:    [{ role: "user", content: prompt }],
    max_tokens:  400,
    temperature: 0.5,
  });

  return res.choices[0].message.content?.trim() ?? "Report generation failed.";
}
