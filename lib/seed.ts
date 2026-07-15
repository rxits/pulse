// Seeds a realistic 14-day history the first time the app runs, so the
// dashboard is alive immediately. Real new visits are recorded on top of this.

import "server-only";
import { countEvents, insertEvent, type NewEvent } from "./db";

interface City {
  city: string;
  region: string;
  country: string;
  code: string;
  lat: number;
  lng: number;
  w: number; // weight
}

const CITIES: City[] = [
  { city: "New York", region: "NY", country: "United States", code: "US", lat: 40.71, lng: -74.0, w: 10 },
  { city: "San Francisco", region: "CA", country: "United States", code: "US", lat: 37.77, lng: -122.42, w: 9 },
  { city: "London", region: "England", country: "United Kingdom", code: "GB", lat: 51.51, lng: -0.13, w: 8 },
  { city: "Berlin", region: "Berlin", country: "Germany", code: "DE", lat: 52.52, lng: 13.4, w: 6 },
  { city: "Bengaluru", region: "KA", country: "India", code: "IN", lat: 12.97, lng: 77.59, w: 9 },
  { city: "Mumbai", region: "MH", country: "India", code: "IN", lat: 19.08, lng: 72.88, w: 6 },
  { city: "Singapore", region: "", country: "Singapore", code: "SG", lat: 1.35, lng: 103.82, w: 5 },
  { city: "Tokyo", region: "Tokyo", country: "Japan", code: "JP", lat: 35.68, lng: 139.69, w: 5 },
  { city: "Sydney", region: "NSW", country: "Australia", code: "AU", lat: -33.87, lng: 151.21, w: 4 },
  { city: "Toronto", region: "ON", country: "Canada", code: "CA", lat: 43.65, lng: -79.38, w: 5 },
  { city: "São Paulo", region: "SP", country: "Brazil", code: "BR", lat: -23.55, lng: -46.63, w: 4 },
  { city: "Amsterdam", region: "NH", country: "Netherlands", code: "NL", lat: 52.37, lng: 4.9, w: 4 },
  { city: "Paris", region: "IDF", country: "France", code: "FR", lat: 48.86, lng: 2.35, w: 5 },
  { city: "Dubai", region: "Dubai", country: "United Arab Emirates", code: "AE", lat: 25.2, lng: 55.27, w: 3 },
  { city: "Lagos", region: "LA", country: "Nigeria", code: "NG", lat: 6.52, lng: 3.38, w: 3 },
  { city: "Austin", region: "TX", country: "United States", code: "US", lat: 30.27, lng: -97.74, w: 4 },
  { city: "Seattle", region: "WA", country: "United States", code: "US", lat: 47.61, lng: -122.33, w: 4 },
  { city: "Warsaw", region: "MZ", country: "Poland", code: "PL", lat: 52.23, lng: 21.01, w: 3 },
];

const PATHS = [
  { path: "/", w: 12 },
  { path: "/pricing", w: 8 },
  { path: "/product", w: 6 },
  { path: "/blog/scaling-postgres", w: 5 },
  { path: "/blog/ai-agents-in-prod", w: 5 },
  { path: "/docs", w: 6 },
  { path: "/changelog", w: 3 },
  { path: "/careers", w: 3 },
  { path: "/login", w: 4 },
];

const USERS = [
  "Maya Kapoor",
  "Devon Reyes",
  "Sara Lin",
  "Tom Bianchi",
  "Priya Nair",
  "James Okafor",
  "Elena Duarte",
  "Noah Bergström",
  "Aisha Rahman",
  "Leo Castellano",
];

const REFERRERS = [
  "https://news.ycombinator.com/",
  "https://www.google.com/",
  "https://x.com/",
  "https://www.linkedin.com/",
  "https://github.com/",
  "direct",
];

const UAS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/149.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/149.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2) Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14) Chrome/149.0 Mobile Safari/537.36",
];

function weighted<T extends { w: number }>(arr: T[]): T {
  const total = arr.reduce((s, a) => s + a.w, 0);
  let r = Math.random() * total;
  for (const a of arr) {
    r -= a.w;
    if (r <= 0) return a;
  }
  return arr[arr.length - 1];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fakeIp(): string {
  const oct = () => 1 + Math.floor(Math.random() * 254);
  return `${oct()}.${oct()}.${oct()}.${oct()}`;
}

export function seedIfEmpty(): void {
  if (countEvents() > 0) return;
  const now = Date.now();
  const dayMs = 86_400_000;
  const events: NewEvent[] = [];

  for (let d = 13; d >= 0; d--) {
    // Gentle upward trend toward today, with daily jitter.
    const base = 8 + (13 - d) * 1.6;
    const count = Math.max(3, Math.round(base + (Math.random() - 0.5) * 8));
    for (let i = 0; i < count; i++) {
      const c = weighted(CITIES);
      const identified = Math.random() < 0.32;
      const dayStart = now - d * dayMs;
      const ts = dayStart - Math.floor(Math.random() * dayMs);
      const jitter = () => (Math.random() - 0.5) * 0.6;
      events.push({
        ts,
        path: weighted(PATHS).path,
        user: identified ? pick(USERS) : null,
        anonymous: !identified,
        ip: fakeIp(),
        city: c.city,
        region: c.region || null,
        country: c.country,
        countryCode: c.code,
        lat: c.lat + jitter(),
        lng: c.lng + jitter(),
        ua: pick(UAS),
        referrer: pick(REFERRERS),
        sessionId: `seed-${Math.random().toString(36).slice(2, 10)}`,
      });
    }
  }

  // A few very recent hits so "live now" is non-zero on first load.
  for (let i = 0; i < 6; i++) {
    const c = weighted(CITIES);
    const identified = Math.random() < 0.4;
    events.push({
      ts: now - Math.floor(Math.random() * 4 * 60_000),
      path: weighted(PATHS).path,
      user: identified ? pick(USERS) : null,
      anonymous: !identified,
      ip: fakeIp(),
      city: c.city,
      region: c.region || null,
      country: c.country,
      countryCode: c.code,
      lat: c.lat + (Math.random() - 0.5) * 0.5,
      lng: c.lng + (Math.random() - 0.5) * 0.5,
      ua: pick(UAS),
      referrer: pick(REFERRERS),
      sessionId: `seed-${Math.random().toString(36).slice(2, 10)}`,
    });
  }

  events.sort((a, b) => a.ts - b.ts).forEach(insertEvent);
}

/** Insert `n` recent random visits — used by the demo "generate traffic" button. */
export function simulateVisits(n = 1): number {
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const c = weighted(CITIES);
    const identified = Math.random() < 0.35;
    insertEvent({
      ts: now - Math.floor(Math.random() * 3000),
      path: weighted(PATHS).path,
      user: identified ? pick(USERS) : null,
      anonymous: !identified,
      ip: fakeIp(),
      city: c.city,
      region: c.region || null,
      country: c.country,
      countryCode: c.code,
      lat: c.lat + (Math.random() - 0.5) * 0.5,
      lng: c.lng + (Math.random() - 0.5) * 0.5,
      ua: pick(UAS),
      referrer: pick(REFERRERS),
      sessionId: `sim-${Math.random().toString(36).slice(2, 10)}`,
    });
  }
  return n;
}
