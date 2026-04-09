import { PrismaClient } from "@prisma/client";
import { subDays, subHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed expense categories
  const categories = [
    { name: "Chemicals (COGS)", slug: "chemicals", color: "#8B5CF6", isCOGS: true, description: "Detailing chemicals, wax, ceramic coatings" },
    { name: "Gas & Transportation", slug: "gas", color: "#F59E0B", isCOGS: false, description: "Fuel, tolls, vehicle maintenance" },
    { name: "Equipment", slug: "equipment", color: "#3B82F6", isCOGS: false, description: "Tools, machines, buffers" },
    { name: "Marketing", slug: "marketing", color: "#10B981", isCOGS: false, description: "Ads, branding, photography" },
    { name: "Software & Subscriptions", slug: "software", color: "#EC4899", isCOGS: false, description: "Urable, apps, tools" },
    { name: "Other", slug: "other", color: "#6B7280", isCOGS: false, description: "Miscellaneous expenses" },
  ];

  for (const cat of categories) {
    await prisma.expenseCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Seed customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { urableId: "urable-cust-001" },
      update: {},
      create: { urableId: "urable-cust-001", firstName: "Marcus", lastName: "Rivera", email: "marcus@example.com", phone: "2625550101" },
    }),
    prisma.customer.upsert({
      where: { urableId: "urable-cust-002" },
      update: {},
      create: { urableId: "urable-cust-002", firstName: "Sarah", lastName: "Chen", email: "sarah@example.com", phone: "2625550102" },
    }),
    prisma.customer.upsert({
      where: { urableId: "urable-cust-003" },
      update: {},
      create: { urableId: "urable-cust-003", firstName: "Derek", lastName: "Thompson", email: "derek@example.com", phone: "2625550103" },
    }),
    prisma.customer.upsert({
      where: { urableId: "urable-cust-004" },
      update: {},
      create: { urableId: "urable-cust-004", firstName: "Amanda", lastName: "Kowalski", email: "amanda@example.com", phone: "2625550104" },
    }),
    prisma.customer.upsert({
      where: { urableId: "urable-cust-005" },
      update: {},
      create: { urableId: "urable-cust-005", firstName: "James", lastName: "Nguyen", email: "james@example.com", phone: "2625550105" },
    }),
  ]);

  // Seed jobs (last 30 days)
  const jobSeeds = [
    { urableId: "urable-job-001", customerIdx: 0, serviceType: "full_reset", serviceLabel: "Full Interior Reset", price: "279", cost: "42", daysAgo: 1 },
    { urableId: "urable-job-002", customerIdx: 1, serviceType: "ceramic", serviceLabel: "Ceramic Coating – 1yr", price: "499", cost: "95", daysAgo: 2 },
    { urableId: "urable-job-003", customerIdx: 2, serviceType: "interior_only", serviceLabel: "Interior Deep Clean", price: "149", cost: "28", daysAgo: 3 },
    { urableId: "urable-job-004", customerIdx: 3, serviceType: "exterior_only", serviceLabel: "Exterior Detail", price: "129", cost: "22", daysAgo: 4 },
    { urableId: "urable-job-005", customerIdx: 4, serviceType: "full_reset", serviceLabel: "Full Interior Reset", price: "279", cost: "42", daysAgo: 5 },
    { urableId: "urable-job-006", customerIdx: 0, serviceType: "paint_correction", serviceLabel: "Paint Correction", price: "650", cost: "120", daysAgo: 7 },
    { urableId: "urable-job-007", customerIdx: 1, serviceType: "interior_only", serviceLabel: "Interior Deep Clean", price: "149", cost: "28", daysAgo: 8 },
    { urableId: "urable-job-008", customerIdx: 2, serviceType: "ceramic", serviceLabel: "Ceramic Coating – 3yr", price: "799", cost: "150", daysAgo: 9 },
    { urableId: "urable-job-009", customerIdx: 3, serviceType: "full_reset", serviceLabel: "Full Interior Reset", price: "279", cost: "42", daysAgo: 10 },
    { urableId: "urable-job-010", customerIdx: 4, serviceType: "exterior_only", serviceLabel: "Exterior Detail", price: "129", cost: "22", daysAgo: 12 },
    { urableId: "urable-job-011", customerIdx: 0, serviceType: "interior_only", serviceLabel: "Interior Deep Clean", price: "149", cost: "28", daysAgo: 14 },
    { urableId: "urable-job-012", customerIdx: 1, serviceType: "paint_correction", serviceLabel: "Paint Correction", price: "550", cost: "110", daysAgo: 15 },
    { urableId: "urable-job-013", customerIdx: 2, serviceType: "full_reset", serviceLabel: "Full Interior Reset", price: "279", cost: "42", daysAgo: 17 },
    { urableId: "urable-job-014", customerIdx: 3, serviceType: "ceramic", serviceLabel: "Ceramic Coating – 1yr", price: "499", cost: "95", daysAgo: 18 },
    { urableId: "urable-job-015", customerIdx: 4, serviceType: "interior_only", serviceLabel: "Interior Deep Clean", price: "149", cost: "28", daysAgo: 20 },
    { urableId: "urable-job-016", customerIdx: 0, serviceType: "exterior_only", serviceLabel: "Exterior Detail", price: "129", cost: "22", daysAgo: 21 },
    { urableId: "urable-job-017", customerIdx: 1, serviceType: "full_reset", serviceLabel: "Full Interior Reset", price: "329", cost: "45", daysAgo: 23 },
    { urableId: "urable-job-018", customerIdx: 2, serviceType: "interior_only", serviceLabel: "Interior Deep Clean", price: "149", cost: "28", daysAgo: 25 },
    { urableId: "urable-job-019", customerIdx: 3, serviceType: "exterior_only", serviceLabel: "Exterior Detail", price: "149", cost: "25", daysAgo: 27 },
    { urableId: "urable-job-020", customerIdx: 4, serviceType: "ceramic", serviceLabel: "Ceramic Coating – 1yr", price: "499", cost: "95", daysAgo: 29 },
  ];

  for (const job of jobSeeds) {
    const price = parseFloat(job.price);
    const cost = parseFloat(job.cost);
    const profit = price - cost;
    const margin = (profit / price) * 100;
    const scheduledAt = subDays(new Date(), job.daysAgo);

    await prisma.job.upsert({
      where: { urableId: job.urableId },
      update: {},
      create: {
        urableId: job.urableId,
        customerId: customers[job.customerIdx].id,
        serviceType: job.serviceType,
        serviceLabel: job.serviceLabel,
        price: job.price,
        estimatedCost: job.cost,
        profit: profit.toFixed(2),
        profitMargin: margin.toFixed(2),
        status: "completed",
        scheduledAt,
        completedAt: subHours(scheduledAt, -2),
      },
    });
  }

  // Seed expenses (last 30 days)
  const expenseSeeds = [
    { amount: "87.50", category: "chemicals", description: "Chemical Guys detailing bundle", date: subDays(new Date(), 2) },
    { amount: "45.00", category: "gas", description: "Weekly fuel fill-up", date: subDays(new Date(), 3) },
    { amount: "22.99", category: "software", description: "Urable monthly subscription", date: subDays(new Date(), 5) },
    { amount: "125.00", category: "marketing", description: "Facebook Ads – May campaign", date: subDays(new Date(), 6) },
    { amount: "210.00", category: "equipment", description: "Flex orbital polisher replacement pad set", date: subDays(new Date(), 8) },
    { amount: "67.40", category: "chemicals", description: "IGL Coatings ceramic prep spray", date: subDays(new Date(), 10) },
    { amount: "40.00", category: "gas", description: "Weekly fuel fill-up", date: subDays(new Date(), 11) },
    { amount: "55.00", category: "marketing", description: "Google Business profile boost", date: subDays(new Date(), 14) },
    { amount: "34.99", category: "software", description: "Canva Pro subscription", date: subDays(new Date(), 15) },
    { amount: "92.15", category: "chemicals", description: "P&S Renny Doyle collection restock", date: subDays(new Date(), 17) },
    { amount: "38.00", category: "gas", description: "Weekly fuel fill-up", date: subDays(new Date(), 18) },
    { amount: "189.99", category: "equipment", description: "Tornador foam blaster", date: subDays(new Date(), 22) },
    { amount: "75.00", category: "marketing", description: "Vehicle wrap promo stickers", date: subDays(new Date(), 24) },
    { amount: "42.00", category: "gas", description: "Weekly fuel fill-up", date: subDays(new Date(), 25) },
    { amount: "58.80", category: "chemicals", description: "Adam's Polishes interior kit", date: subDays(new Date(), 27) },
  ];

  for (const [i, exp] of expenseSeeds.entries()) {
    const existing = await prisma.expense.findFirst({ where: { description: exp.description, category: exp.category } });
    if (!existing) {
      await prisma.expense.create({
        data: {
          amount: exp.amount,
          category: exp.category,
          description: exp.description,
          date: exp.date,
        },
      });
    }
  }

  // Seed initial AI insights
  const insightSeeds = [
    {
      type: "recommendation",
      severity: "warning",
      title: "Chemical spend trending high",
      body: "Chemical costs are 18% of revenue this month — industry average for mobile detailing is 12–14%. Consider bulk purchasing or a preferred supplier arrangement.",
      period: "monthly",
    },
    {
      type: "trend",
      severity: "success",
      title: "Ceramic jobs are your highest-margin service",
      body: "Ceramic coating jobs average 81% profit margin vs 68% for interior-only cleans. Prioritizing ceramic upsells could lift monthly profit by ~$400.",
      period: "monthly",
    },
    {
      type: "anomaly",
      severity: "info",
      title: "Revenue up 23% week-over-week",
      body: "Last week generated $1,384 compared to $1,124 the week prior. The increase is driven by two ceramic coating bookings.",
      period: "weekly",
    },
  ];

  for (const insight of insightSeeds) {
    const existing = await prisma.insight.findFirst({ where: { title: insight.title } });
    if (!existing) {
      await prisma.insight.create({ data: insight });
    }
  }

  console.log("✅ Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
