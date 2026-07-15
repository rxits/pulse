// POST /api/simulate — demo-only: inserts N random recent visits so you can
// watch the dashboard move. Not part of real tracking.

import { simulateVisits } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { n } = (await request.json().catch(() => ({ n: 1 }))) as { n?: number };
  const count = simulateVisits(Math.min(Math.max(1, n ?? 1), 25));
  return Response.json({ ok: true, inserted: count });
}
