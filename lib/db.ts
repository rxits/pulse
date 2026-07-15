// SQLite store backed by Node's built-in `node:sqlite` (no native dependency).
// A module-level singleton, guarded against Turbopack/HMR re-instantiation.

import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Stats, VisitEvent } from "./types";

const DB_DIR = join(process.cwd(), ".data");
const DB_PATH = join(DB_DIR, "pulse.db");

const g = globalThis as unknown as { __pulseDb?: DatabaseSync };

function db(): DatabaseSync {
  if (g.__pulseDb) return g.__pulseDb;
  mkdirSync(DB_DIR, { recursive: true });
  const conn = new DatabaseSync(DB_PATH);
  conn.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      path TEXT NOT NULL,
      user TEXT,
      anonymous INTEGER NOT NULL,
      ip TEXT,
      ipv4 TEXT, ipv6 TEXT,
      city TEXT, region TEXT, country TEXT, country_code TEXT,
      lat REAL, lng REAL,
      ua TEXT, referrer TEXT, session_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
  `);
  // Migrate older databases that predate the ipv4/ipv6 columns.
  for (const col of ["ipv4", "ipv6"]) {
    try {
      conn.exec(`ALTER TABLE events ADD COLUMN ${col} TEXT`);
    } catch {
      /* column already exists */
    }
  }
  g.__pulseDb = conn;
  return conn;
}

export type NewEvent = Omit<VisitEvent, "id">;

export function insertEvent(e: NewEvent): void {
  db()
    .prepare(
      `INSERT INTO events
       (ts, path, user, anonymous, ip, ipv4, ipv6, city, region, country, country_code, lat, lng, ua, referrer, session_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      e.ts,
      e.path,
      e.user,
      e.anonymous ? 1 : 0,
      e.ip,
      e.ipv4 ?? null,
      e.ipv6 ?? null,
      e.city,
      e.region,
      e.country,
      e.countryCode,
      e.lat,
      e.lng,
      e.ua,
      e.referrer,
      e.sessionId,
    );
}

export function countEvents(): number {
  const row = db().prepare(`SELECT COUNT(*) AS c FROM events`).get() as { c: number };
  return row.c;
}

type Row = Record<string, unknown>;

function toEvent(r: Row): VisitEvent {
  return {
    id: r.id as number,
    ts: r.ts as number,
    path: r.path as string,
    user: (r.user as string) ?? null,
    anonymous: !!r.anonymous,
    ip: (r.ip as string) ?? "",
    ipv4: (r.ipv4 as string) ?? null,
    ipv6: (r.ipv6 as string) ?? null,
    city: (r.city as string) ?? null,
    region: (r.region as string) ?? null,
    country: (r.country as string) ?? null,
    countryCode: (r.country_code as string) ?? null,
    lat: (r.lat as number) ?? null,
    lng: (r.lng as number) ?? null,
    ua: (r.ua as string) ?? null,
    referrer: (r.referrer as string) ?? null,
    sessionId: (r.session_id as string) ?? null,
  };
}

export function getStats(): Stats {
  const conn = db();
  const now = Date.now();
  const liveWindow = now - 5 * 60_000;

  const totals = conn
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN anonymous=1 THEN 1 ELSE 0 END) AS anon,
         SUM(CASE WHEN anonymous=0 THEN 1 ELSE 0 END) AS ident,
         COUNT(DISTINCT ip) AS uniqueIps,
         COUNT(DISTINCT COALESCE(user, session_id, ip)) AS uniqueVisitors
       FROM events`,
    )
    .get() as Row;

  const live = conn
    .prepare(
      `SELECT COUNT(DISTINCT COALESCE(user, session_id, ip)) AS c FROM events WHERE ts >= ?`,
    )
    .get(liveWindow) as { c: number };

  // Visits over time — 14 daily buckets.
  const dayMs = 86_400_000;
  const start = now - 13 * dayMs;
  const startDay = Math.floor(start / dayMs) * dayMs;
  const perDay = conn
    .prepare(
      `SELECT (ts / ${dayMs}) * ${dayMs} AS bucket,
              COUNT(*) AS visits,
              SUM(CASE WHEN anonymous=1 THEN 1 ELSE 0 END) AS anon
       FROM events WHERE ts >= ? GROUP BY bucket ORDER BY bucket`,
    )
    .all(startDay) as Row[];
  const byBucket = new Map<number, { visits: number; anon: number }>();
  for (const r of perDay)
    byBucket.set(r.bucket as number, { visits: r.visits as number, anon: (r.anon as number) ?? 0 });
  const visitsOverTime: Stats["series"]["visitsOverTime"] = [];
  for (let i = 0; i < 14; i++) {
    const t = startDay + i * dayMs;
    const b = byBucket.get(t);
    visitsOverTime.push({ t, visits: b?.visits ?? 0, anon: b?.anon ?? 0 });
  }

  const topPages = (
    conn
      .prepare(`SELECT path, COUNT(*) AS count FROM events GROUP BY path ORDER BY count DESC LIMIT 6`)
      .all() as Row[]
  ).map((r) => ({ path: r.path as string, count: r.count as number }));

  const byCountry = (
    conn
      .prepare(
        `SELECT country, country_code AS code, COUNT(*) AS count
         FROM events WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 8`,
      )
      .all() as Row[]
  ).map((r) => ({ country: r.country as string, code: r.code as string, count: r.count as number }));

  const geoPoints = (
    conn
      .prepare(
        `SELECT ROUND(lat,1) AS lat, ROUND(lng,1) AS lng, COUNT(*) AS count
         FROM events WHERE lat IS NOT NULL GROUP BY ROUND(lat,1), ROUND(lng,1)`,
      )
      .all() as Row[]
  ).map((r) => ({ lat: r.lat as number, lng: r.lng as number, count: r.count as number }));

  const recent = (
    conn.prepare(`SELECT * FROM events ORDER BY ts DESC LIMIT 60`).all() as Row[]
  ).map(toEvent);

  return {
    kpis: {
      totalVisits: (totals.total as number) ?? 0,
      uniqueVisitors: (totals.uniqueVisitors as number) ?? 0,
      uniqueIps: (totals.uniqueIps as number) ?? 0,
      liveNow: live.c ?? 0,
      identified: (totals.ident as number) ?? 0,
      anonymous: (totals.anon as number) ?? 0,
    },
    series: {
      visitsOverTime,
      topPages,
      identitySplit: [
        { name: "Identified", value: (totals.ident as number) ?? 0 },
        { name: "Anonymous", value: (totals.anon as number) ?? 0 },
      ],
      byCountry,
    },
    recent,
    geoPoints,
    generatedAt: now,
  };
}
