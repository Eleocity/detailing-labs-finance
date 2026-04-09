# Detailing Labs — Finance & Intelligence Platform

AI-powered financial dashboard for Detailing Labs. Syncs jobs from Urable, tracks expenses, calculates profit per job/service type, and uses GPT-4o to generate actionable business insights.

---

## Tech Stack

- **Next.js 14** (App Router, Server Components)
- **TypeScript** + **Tailwind CSS** (dark theme, brand purple)
- **PostgreSQL** on Railway + **Prisma ORM**
- **OpenAI GPT-4o** for insights, categorization, weekly reports
- **Recharts** for financial charts
- **Urable CRM API** for job sync

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd detailing-labs-finance
npm install
```

### 2. Set environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable             | Where to get it                              |
|----------------------|----------------------------------------------|
| `DATABASE_URL`       | Railway → your PostgreSQL service → Connect  |
| `URABLE_API_KEY`     | Urable dashboard → Settings → API            |
| `URABLE_BASE_URL`    | `https://api.urable.com/v1`                  |
| `OPENAI_API_KEY`     | platform.openai.com/api-keys                 |
| `NEXTAUTH_SECRET`    | Run: `openssl rand -base64 32`               |

### 3. Database setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Railway PostgreSQL
npm run db:push

# Seed with 30 days of mock data
npm run db:seed
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Deploy to Railway

1. Push to GitHub
2. Create new Railway project → Deploy from GitHub repo
3. Add PostgreSQL service (Railway will inject `DATABASE_URL`)
4. Set all environment variables in Railway → Variables tab
5. Set start command: `npm run db:migrate && npm start`
6. Railway auto-deploys on every push

**Railway build settings:**
- Build command: `npm run build`
- Start command: `npm run db:migrate && npm start`

---

## Daily Sync (Cron)

To sync Urable jobs automatically, add a Railway cron job:

- **Schedule:** `0 6 * * *` (6 AM daily)
- **Command:** `curl -X POST https://your-app.railway.app/api/sync/urable -H "Authorization: Bearer $CRON_SECRET"`

Set `CRON_SECRET` in your Railway environment variables to secure the endpoint.

Or trigger manually from the **Sync Urable** button in the sidebar.

---

## Features

### Dashboard (`/`)
- Revenue cards: today / this week / this month
- 30-day revenue trend chart (area)
- Revenue by service type (bar)
- Recent jobs table
- AI insights panel (click "Refresh" to generate fresh insights)

### Jobs (`/jobs`)
- Full table of synced Urable jobs
- Filter by service type
- Profit and margin per job, color-coded by health

### Expenses (`/expenses`)
- Add expense form with **AI auto-categorize** toggle
  - Paste a description → GPT-4o picks the category
- Monthly spend breakdown by category
- Delete expenses inline

### Reports (`/reports`)
- Weekly + monthly financial summaries
- Service type breakdown with margin health badges
- Expense category bars (% of revenue)
- **Export CSV** button (downloads all jobs for period)

---

## AI Functions

| Function | Model | Purpose |
|---|---|---|
| `categorizeExpense(text)` | gpt-4o-mini | Classifies expense into 6 categories |
| `generateInsights(summary)` | gpt-4o | Returns 3–5 JSON insight objects |
| `weeklyReport(summary)` | gpt-4o | Human-readable weekly briefing |

Insights are persisted in the `Insight` table and can be refreshed on demand from the dashboard.

---

## Cost Estimation Logic

Until enough real expense data accumulates, job costs are estimated by service type ratio:

| Service | Cost % of Revenue |
|---|---|
| Full Reset | 15% |
| Interior Only | 19% |
| Exterior Only | 17% |
| Ceramic Coating | 19% |
| Paint Correction | 18% |
| Fleet | 14% |
| Other | 20% |

These ratios live in `src/lib/urable.ts → estimateJobCost()` and can be tuned as real data comes in.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── jobs/page.tsx
│   ├── expenses/page.tsx
│   ├── reports/page.tsx
│   └── api/
│       ├── sync/urable/      # POST: pull & upsert Urable jobs
│       ├── expenses/         # GET/POST/DELETE
│       ├── insights/         # GET/POST/PATCH
│       ├── jobs/             # GET
│       └── reports/          # GET (dashboard|weekly|monthly|chart|csv)
├── components/
│   ├── layout/Sidebar.tsx
│   ├── dashboard/
│   │   ├── MetricCard.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── ServiceChart.tsx
│   │   └── InsightsPanel.tsx
│   ├── expenses/
│   │   ├── ExpenseForm.tsx
│   │   └── ExpenseList.tsx
│   └── jobs/JobsTable.tsx
└── lib/
    ├── prisma.ts     # PrismaClient singleton
    ├── urable.ts     # Urable API + normalizer + cost estimator
    ├── ai.ts         # OpenAI functions
    ├── finance.ts    # Revenue/profit queries + summary builder
    └── utils.ts      # cn, formatCurrency, formatPercent, etc.
```

---

## Future Roadmap

- [ ] NextAuth.js login (admin-only)
- [ ] Webhook receiver for real-time Urable sync
- [ ] Stripe / Square payment reconciliation
- [ ] Plaid bank feed integration
- [ ] Per-technician profit reporting (once multi-tech data available)
- [ ] SMS/email weekly report delivery
- [ ] Mobile-optimized view
