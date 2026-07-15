<div align="center">

# ⬤ Pulse

### Live Visitor Mission-Control

**A real-time analytics dashboard for a public page — it records every visit, plots
anonymous visitors on a 3D globe by their public IP, and streams the whole thing live.**

Not another admin panel. A command center that feels *alive*.

<br/>

![Pulse — live visitor mission-control](./public/demo.gif)

</div>

---

## What this is

The brief was small on paper: a dashboard with **tiles, a table, and 3 graphs**, that
**records user activity** — and since the page is public, records **anonymous visitors
by their public IP**.

So instead of a static admin template, I built the thing that data actually deserves: a
**live mission-control** for a public page. Every visit lands in real time — a known user
by name, or an anonymous visitor resolved from their IP to an approximate location — and
lights up across an animated globe, a streaming feed, animated counters, three charts, and
a searchable log.

Everything you see updates on its own, every few seconds.

---

## How it works

```
   public page                server                      dashboard
  ┌───────────┐   POST     ┌────────────────┐   poll    ┌──────────────┐
  │  /track   │ ───────▶   │  /api/track    │  ◀─────    │      /       │
  │ (a visit) │            │  • read IP     │   4s       │ tiles·globe· │
  └───────────┘            │  • geolocate   │           │ feed·charts· │
                           │  • store       │           │ table        │
                           └──────┬─────────┘            └──────────────┘
                                  │ node:sqlite
                                  ▼
                            .data/pulse.db
```

1. **Record** — when someone hits the public page, the browser posts a visit. The server
   reads the visitor's IP (`x-forwarded-for` in production), and:
   - if they **identified themselves**, it stores their **name**;
   - if they're **anonymous**, it stores the **public IP** and resolves it to an
     approximate **city / country / lat-lng** (via a free geo-IP lookup).
2. **Store** — everything lands in a local SQLite database using Node's built-in
   `node:sqlite` — no external database, no setup.
3. **Visualize** — the dashboard polls a stats endpoint every 4 seconds and re-renders the
   tiles, globe, feed, charts, and table. That's what makes it feel live.

Anonymous IPs are **masked** in the UI (`185.219.×.×`) — Pulse observes; it never doxxes.

---

## The pages

| Page | What it's for |
|------|---------------|
| **`/`** | **The dashboard.** 5 KPI tiles (total visits · unique visitors · unique IPs · live now · identified), the live visitor **globe**, a streaming **activity feed**, **3 charts** (visits over time, top pages, identity split), and the full **activity-log table** with filters + search. |
| **`/track`** | **The public page being tracked.** Opening it records *your* visit — anonymously by IP by default, and it shows you exactly what Pulse saw (your public IP + resolved location). You can also type a name to record yourself as an identified visitor and watch yourself appear on the dashboard. |

### API routes

| Route | Purpose |
|-------|---------|
| `POST /api/track` | Record one visit (reads IP, geolocates, stores). |
| `GET /api/stats` | Aggregates for the dashboard (KPIs, series, geo points, recent activity). Seeds a demo history the first time. |
| `POST /api/simulate` | Demo-only: injects a few random recent visits so you can watch the dashboard move. |

---

## Everything the brief asked for

- **Dashboard tiles** → 5 animated KPI counters.
- **1 list / table view** → the activity log, with All / Identified / Anonymous filters and live search.
- **3 graphs** → visits-over-time (area), top pages (bar), identity split (donut).
- **Record user activity** → every visit is logged with page, source, and time.
- **Public page → record anonymous visitors by public IP** → exactly the `/track` flow, IP → geolocation → globe.

---

## Run it

Requires **Node 22+** (for the built-in `node:sqlite`) and `pnpm`.

```bash
pnpm install
pnpm dev
```

Then open **http://localhost:3000**.

- Hit **“Simulate traffic”** (top-right) and watch the tiles tick, the feed slide in, and the globe gain dots.
- Open **`/track`**, then flip back to the dashboard — you'll see *yourself* appear, live.

> **On localhost, your IP shows up resolved to a real public IP.** A browser→server request
> over localhost is a *loopback* connection, so the socket only sees `::1` — there's no
> public IP to read. Pulse resolves the machine's real public IP for the demo. In
> production, behind a proxy or CDN, it reads the visitor's real IP straight from
> `x-forwarded-for`.

### Deploy

One click to Vercel — and once it's live behind a real proxy, the public-IP tracking
works against **actual visitors** (it reads `x-forwarded-for` straight from the edge):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rxits/pulse)

> Note: serverless filesystems are ephemeral, so the bundled `node:sqlite` store resets
> on redeploy — perfect for a demo. For a persistent deployment, point the store at a
> managed Postgres/Turso; the query layer in `lib/db.ts` is the only thing that changes.

---

## Built with

- **Next.js 16** (App Router, Turbopack) · **TypeScript** · **Tailwind v4**
- **COBE** — the 5KB WebGL globe, plotting visitor locations
- **Magic UI** — animated number tickers, particles, border beams
- **shadcn/ui** — the component base
- **Recharts** — the three charts, with a **colorblind-safe palette** that was run through a
  contrast/CVD validator (the data marks are correct, not just pretty)
- **`node:sqlite`** — zero-dependency storage
- **Figtree** for the warm UI type, mono reserved for the data

Design language: a **mission-control** aesthetic — near-black canvas, a cyan/lime glow, live
motion everywhere, and a warm humanist typeface so it reads as *calm* rather than *noisy*.

---

## A note

I had a genuinely good time building this. The brief was small, which felt like an
invitation to make the *experience* the point — so I chased the version of a visitor
dashboard I'd actually want to keep open on a second monitor: something live, spatial, and a
little bit alive.

If this is the kind of care you want on your team — sweating the real-IP edge cases,
validating chart colors for accessibility, and turning a three-line spec into something
people lean in to look at — **I'd love to join and build more of it with you.** 🚀

---

<div align="center">
<sub>Pulse — live visitor analytics · built as a take-home, with care.</sub>
</div>
