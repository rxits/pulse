// Domain types for Pulse — live public-page visitor analytics.

export interface VisitEvent {
  id: number;
  ts: number; // epoch ms
  path: string;
  /** Identified user (email/name) or null for anonymous visitors. */
  user: string | null;
  anonymous: boolean;
  /** Primary IP used for the globe/feed (prefers IPv4). */
  ip: string;
  /** The visitor's public IPv4, if reachable. */
  ipv4?: string | null;
  /** The visitor's public IPv6, if reachable. */
  ipv6?: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
  ua: string | null;
  referrer: string | null;
  sessionId: string | null;
}

export interface Stats {
  kpis: {
    totalVisits: number;
    uniqueVisitors: number;
    uniqueIps: number;
    liveNow: number;
    identified: number;
    anonymous: number;
  };
  series: {
    visitsOverTime: { t: number; visits: number; anon: number }[];
    topPages: { path: string; count: number }[];
    identitySplit: { name: string; value: number }[];
    byCountry: { country: string; code: string; count: number }[];
  };
  recent: VisitEvent[];
  geoPoints: { lat: number; lng: number; count: number }[];
  generatedAt: number;
}
