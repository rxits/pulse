// GET /api/stats — aggregates for the dashboard (seeds a demo history once).

import { getStats } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  seedIfEmpty();
  return Response.json(getStats(), { headers: { "Cache-Control": "no-store" } });
}
