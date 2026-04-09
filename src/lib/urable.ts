/**
 * Urable API Service
 * Handles all communication with the Urable CRM API.
 * 
 * Urable uses nested objects for contact fields:
 *   phoneNumbers: [{ label: "mobile", value: "2625550101" }]
 *   emails:       [{ label: "home",   value: "user@example.com" }]
 *   locations:    [{ label: "home",   value: "123 Main St, Racine WI" }]
 */

const BASE_URL = process.env.URABLE_BASE_URL ?? "https://api.urable.com/v1";
const API_KEY  = process.env.URABLE_API_KEY ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UrableJob {
  id: string;
  status: string;
  scheduledDate: string;       // ISO
  completedDate?: string;
  totalPrice: number;
  serviceItems: UrableServiceItem[];
  customer: UrableCustomer;
  notes?: string;
}

export interface UrableServiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "service" | "add_on" | "item";
}

export interface UrableCustomer {
  id: string;
  firstName: string;
  lastName: string;
  emails:       { label: string; value: string }[];
  phoneNumbers: { label: string; value: string }[];
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function urableFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Urable API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Fetch jobs ───────────────────────────────────────────────────────────────

/**
 * Fetches completed jobs from Urable, paginated.
 * @param sinceDate  Only fetch jobs scheduled on/after this date
 * @param pageSize   How many to fetch per page
 */
export async function fetchUrableJobs(
  sinceDate?: Date,
  pageSize = 100
): Promise<UrableJob[]> {
  const params = new URLSearchParams({
    limit: String(pageSize),
    status: "completed",
  });

  if (sinceDate) {
    params.set("scheduledDateFrom", sinceDate.toISOString().split("T")[0]);
  }

  let allJobs: UrableJob[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    params.set("page", String(page));

    const data = await urableFetch<{
      data: UrableJob[];
      meta: { total: number; page: number; lastPage: number };
    }>(`/jobs?${params.toString()}`);

    allJobs = allJobs.concat(data.data);
    hasMore = page < data.meta.lastPage;
    page++;
  }

  return allJobs;
}

// ─── Normalise a single Urable job ────────────────────────────────────────────

export function normalizeUrableJob(job: UrableJob) {
  // Separate primary service from add-ons
  const primaryService = job.serviceItems.find((i) => i.type === "service");
  const addOns = job.serviceItems.filter((i) => i.type !== "service");

  const serviceType = slugifyService(primaryService?.name ?? "other");

  return {
    urableId:     job.id,
    serviceType,
    serviceLabel: primaryService?.name ?? "Unknown Service",
    price:        job.totalPrice,
    status:       job.status,
    scheduledAt:  new Date(job.scheduledDate),
    completedAt:  job.completedDate ? new Date(job.completedDate) : undefined,
    notes:        job.notes,
    addOns:       addOns.map((a) => ({ name: a.name, price: a.price })),
    rawUrableData: job,
    customer: {
      urableId:  job.customer.id,
      firstName: job.customer.firstName,
      lastName:  job.customer.lastName,
      email:     job.customer.emails?.[0]?.value,
      phone:     job.customer.phoneNumbers?.[0]?.value?.replace(/\D/g, ""),
    },
  };
}

// ─── Estimate job cost ────────────────────────────────────────────────────────

/**
 * Rule-based cost estimation by service type.
 * Override with actual expense tracking once data accumulates.
 */
export function estimateJobCost(serviceType: string, price: number): number {
  const costRules: Record<string, number> = {
    full_reset:       0.15,  // 15% of revenue
    interior_only:    0.19,
    exterior_only:    0.17,
    ceramic:          0.19,
    paint_correction: 0.18,
    fleet:            0.14,
    other:            0.20,
  };

  const ratio = costRules[serviceType] ?? 0.18;
  return parseFloat((price * ratio).toFixed(2));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugifyService(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("interior") && lower.includes("reset")) return "full_reset";
  if (lower.includes("interior"))       return "interior_only";
  if (lower.includes("exterior"))       return "exterior_only";
  if (lower.includes("ceramic"))        return "ceramic";
  if (lower.includes("paint") || lower.includes("correction")) return "paint_correction";
  if (lower.includes("fleet"))          return "fleet";
  return "other";
}
