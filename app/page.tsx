"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ExternalLink, Zap } from "lucide-react";
import { useStats } from "@/components/use-stats";
import { KpiTile } from "@/components/kpi-tile";
import { Globe, type GlobeMarker } from "@/components/globe";
import { ActivityFeed } from "@/components/activity-feed";
import { ActivityTable } from "@/components/activity-table";
import { VisitsChart, TopPagesChart, IdentityChart } from "@/components/charts";
import { Particles } from "@/components/ui/particles";
import { shortNumber } from "@/lib/format";

export default function Dashboard() {
  const { stats, prev } = useStats(4000);
  const [simulating, setSimulating] = useState(false);

  async function simulate() {
    setSimulating(true);
    try {
      await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n: 5 }),
      });
    } finally {
      setTimeout(() => setSimulating(false), 600);
    }
  }

  const markers: GlobeMarker[] =
    stats?.geoPoints.map((p) => ({
      location: [p.lat, p.lng] as [number, number],
      size: Math.min(0.02 + (p.count / 12) * 0.05, 0.09),
    })) ?? [];

  return (
    <main className="relative mx-auto w-full max-w-7xl px-5 py-6">
      <Particles className="pointer-events-none absolute inset-0 -z-10" quantity={70} color="#22d3ee" ease={70} />

      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-lg bg-glow-cyan/15 ring-1 ring-glow-cyan/40">
            <Activity className="size-4 text-glow-cyan" />
            <span className="absolute -right-0.5 -top-0.5 size-2 animate-ping rounded-full bg-glow-lime" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-glow">
              PULSE<span className="text-muted-foreground"> · visitor mission-control</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Every visit to a public page — identified users and anonymous visitors by IP — live.
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/70 px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-glow-lime shadow-[0_0_8px_var(--color-glow-lime)]" />
            live · updates every 4s
          </span>
          <button
            onClick={simulate}
            disabled={simulating}
            className="inline-flex items-center gap-1.5 rounded-md bg-glow-cyan/15 px-3 py-1.5 text-[11px] font-medium text-glow-cyan ring-1 ring-glow-cyan/40 transition hover:bg-glow-cyan/25 disabled:opacity-50"
          >
            <Zap className="size-3.5" />
            {simulating ? "sending…" : "Simulate traffic"}
          </button>
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
          >
            Public page <ExternalLink className="size-3" />
          </Link>
        </div>
      </header>

      {/* KPI tiles */}
      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile label="Total visits" value={stats?.kpis.totalVisits ?? 0} prev={prev?.totalVisits} accent="cyan" beam />
        <KpiTile label="Unique visitors" value={stats?.kpis.uniqueVisitors ?? 0} prev={prev?.uniqueVisitors} accent="lime" />
        <KpiTile label="Unique IPs" value={stats?.kpis.uniqueIps ?? 0} prev={prev?.uniqueIps} accent="cyan" hint="anonymous tracked by IP" />
        <KpiTile label="Live now" value={stats?.kpis.liveNow ?? 0} accent="lime" live hint="active in last 5 min" />
        <KpiTile label="Identified" value={stats?.kpis.identified ?? 0} prev={prev?.identified} accent="amber" hint={`${stats?.kpis.anonymous ?? 0} anonymous`} />
      </section>

      {/* Globe + live feed */}
      <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-xl border border-border bg-card/50 p-4 backdrop-blur">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Live visitor map
            </h2>
            <span className="font-mono text-[11px] text-glow-cyan">{markers.length} locations</span>
          </div>
          <Globe markers={markers} />
        </div>

        <div className="flex flex-col rounded-xl border border-border bg-card/50 p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Activity stream
            </h2>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-glow-lime">
              <span className="size-1.5 animate-pulse rounded-full bg-glow-lime" /> streaming
            </span>
          </div>
          {stats ? (
            <ActivityFeed events={stats.recent} />
          ) : (
            <p className="text-sm text-muted-foreground">Connecting…</p>
          )}
        </div>
      </section>

      {/* Charts */}
      <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">
        <ChartCard title="Visits · last 14 days" subtitle="total vs anonymous">
          {stats && <VisitsChart data={stats.series.visitsOverTime} />}
        </ChartCard>
        <ChartCard title="Top pages" subtitle="most-visited paths">
          {stats && <TopPagesChart data={stats.series.topPages} />}
        </ChartCard>
        <ChartCard title="Identity split" subtitle="known vs anonymous">
          {stats && <IdentityChart data={stats.series.identitySplit} />}
        </ChartCard>
      </section>

      {/* Table */}
      <section className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Activity log
          </h2>
          {stats && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {shortNumber(stats.recent.length)} most recent
            </span>
          )}
        </div>
        {stats && <ActivityTable events={stats.recent} />}
      </section>

      <footer className="mt-6 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Anonymous visitors are recorded by public IP → approximate location. The tool observes; it never blocks.</span>
        <span className="font-mono">pulse · live visitor analytics</span>
      </footer>
    </main>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur">
      <div className="mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</h3>
        <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
