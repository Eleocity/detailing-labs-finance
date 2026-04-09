import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchUrableJobs, normalizeUrableJob, estimateJobCost } from "@/lib/urable";
import { Decimal } from "@prisma/client/runtime/library";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Optional: restrict to cron secret
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.URABLE_API_KEY) {
    return NextResponse.json({ error: "URABLE_API_KEY is not configured" }, { status: 500 });
  }

  let syncLog;
  try {
    syncLog = await prisma.syncLog.create({
      data: { source: "urable", status: "running" },
    });
  } catch (err: any) {
    console.error("Failed to create SyncLog:", err);
    return NextResponse.json({ error: `DB error: ${err.message}` }, { status: 500 });
  }

  try {
    // Find last sync to only pull new jobs
    const lastSync = await prisma.syncLog.findFirst({
      where: { source: "urable", status: "success" },
      orderBy: { startedAt: "desc" },
    });

    const sinceDate = lastSync?.startedAt
      ? new Date(lastSync.startedAt.getTime() - 86400000) // 1-day buffer
      : undefined;

    const urableJobs = await fetchUrableJobs(sinceDate);
    let created = 0;
    let updated = 0;

    for (const rawJob of urableJobs) {
      const normalized = normalizeUrableJob(rawJob);
      const { customer, ...jobData } = normalized;

      // Upsert customer
      const dbCustomer = await prisma.customer.upsert({
        where:  { urableId: customer.urableId },
        update: {
          firstName: customer.firstName,
          lastName:  customer.lastName,
          email:     customer.email,
          phone:     customer.phone,
        },
        create: { ...customer },
      });

      // Calculate profit
      const estimatedCost = estimateJobCost(jobData.serviceType, jobData.price);
      const profit        = jobData.price - estimatedCost;
      const profitMargin  = (profit / jobData.price) * 100;

      // Upsert job
      const existing = await prisma.job.findUnique({ where: { urableId: jobData.urableId } });

      if (existing) {
        await prisma.job.update({
          where: { urableId: jobData.urableId },
          data: {
            status:       jobData.status,
            completedAt:  jobData.completedAt,
            price:        new Decimal(jobData.price),
            estimatedCost: new Decimal(estimatedCost),
            profit:        new Decimal(profit.toFixed(2)),
            profitMargin:  new Decimal(profitMargin.toFixed(2)),
          },
        });
        updated++;
      } else {
        await prisma.job.create({
          data: {
            urableId:      jobData.urableId,
            customerId:    dbCustomer.id,
            serviceType:   jobData.serviceType,
            serviceLabel:  jobData.serviceLabel,
            price:         new Decimal(jobData.price),
            estimatedCost: new Decimal(estimatedCost),
            profit:        new Decimal(profit.toFixed(2)),
            profitMargin:  new Decimal(profitMargin.toFixed(2)),
            status:        jobData.status,
            scheduledAt:   jobData.scheduledAt,
            completedAt:   jobData.completedAt,
            notes:         jobData.notes,
            addOns:        jobData.addOns as any,
            rawUrableData: jobData.rawUrableData as any,
          },
        });
        created++;
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status:      "success",
        jobsSynced:  urableJobs.length,
        jobsCreated: created,
        jobsUpdated: updated,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      synced:  urableJobs.length,
      created,
      updated,
    });
  } catch (err: any) {
    if (syncLog) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status:       "error",
          errorMessage: err.message,
          completedAt:  new Date(),
        },
      });
    }

    console.error("Urable sync failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET returns last sync status
export async function GET() {
  const logs = await prisma.syncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 10,
  });
  return NextResponse.json(logs);
}
