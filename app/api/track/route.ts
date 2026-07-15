// POST /api/track — record a visit to the public page.
// If the caller supplies a `user`, the visit is identified; otherwise it's
// anonymous and we record the public IP (resolved to an approximate location).

import { insertEvent } from "@/lib/db";
import { clientIp, geolocate, isPrivate } from "@/lib/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    path?: string;
    user?: string | null;
    referrer?: string | null;
    sessionId?: string | null;
    ipv4?: string | null;
    ipv6?: string | null;
  };

  const socketIp = clientIp(request.headers);
  const bodyV4 = body.ipv4 || null;
  const bodyV6 = body.ipv6 || null;

  // Geolocate the best available public IP (client-reported first, then socket).
  const geo = await geolocate(bodyV4 || bodyV6 || socketIp);
  const resolved = geo.ip; // real public IP even when the socket is loopback

  const ipv4 = bodyV4 || (resolved && !resolved.includes(":") ? resolved : null);
  const ipv6 = bodyV6 || (resolved && resolved.includes(":") ? resolved : null);
  const ip = ipv4 || ipv6 || (isPrivate(socketIp) && resolved ? resolved : socketIp);

  insertEvent({
    ts: Date.now(),
    path: body.path || "/",
    user: body.user || null,
    anonymous: !body.user,
    ip,
    ipv4,
    ipv6,
    city: geo.city,
    region: geo.region,
    country: geo.country,
    countryCode: geo.countryCode,
    lat: geo.lat,
    lng: geo.lng,
    ua: request.headers.get("user-agent"),
    referrer: body.referrer ?? request.headers.get("referer"),
    sessionId: body.sessionId ?? null,
  });

  return Response.json({ ok: true, ip, ipv4, ipv6, city: geo.city, country: geo.country });
}
