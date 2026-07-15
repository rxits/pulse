// Server-side IP extraction + geolocation.
//
// The tracked page is public, so for anonymous visitors we record the public IP
// and resolve it to an approximate city/country for the map. Uses the free
// ipwho.is endpoint (HTTPS, no key). Loopback/private addresses (local dev)
// resolve the machine's own public IP so the globe still gets a real point.

import "server-only";

export interface Geo {
  /** The public IP the lookup actually resolved (real IP even for loopback). */
  ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
}

const EMPTY: Geo = {
  ip: null,
  city: null,
  region: null,
  country: null,
  countryCode: null,
  lat: null,
  lng: null,
};

/** Best-effort client IP from proxy headers. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("true-client-ip") ||
    "127.0.0.1"
  );
}

export function isPrivate(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("::ffff:127.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip === "unknown"
  );
}

export async function geolocate(ip: string): Promise<Geo> {
  // For loopback/private, hit the endpoint with no IP → geolocates the host's
  // own public IP (the real machine running the demo).
  const target = isPrivate(ip) ? "" : encodeURIComponent(ip);
  try {
    const res = await fetch(`https://ipwho.is/${target}`, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "pulse-analytics" },
    });
    if (!res.ok) return EMPTY;
    const d = (await res.json()) as {
      success?: boolean;
      ip?: string;
      city?: string;
      region?: string;
      country?: string;
      country_code?: string;
      latitude?: number;
      longitude?: number;
    };
    if (!d.success) return EMPTY;
    return {
      ip: d.ip ?? null,
      city: d.city ?? null,
      region: d.region ?? null,
      country: d.country ?? null,
      countryCode: d.country_code ?? null,
      lat: d.latitude ?? null,
      lng: d.longitude ?? null,
    };
  } catch {
    return EMPTY;
  }
}
