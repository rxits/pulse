"use client";

import { useEffect, useRef, useState } from "react";
import type { Stats } from "@/lib/types";

/** Polls /api/stats on an interval so the whole dashboard feels live. */
export function useStats(intervalMs = 4000) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [prev, setPrev] = useState<Stats["kpis"] | null>(null);
  const [pulse, setPulse] = useState(0); // bumps when totalVisits increases
  const lastTotal = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Stats;
        if (!alive) return;
        setStats((cur) => {
          if (cur) setPrev(cur.kpis);
          return data;
        });
        if (lastTotal.current !== null && data.kpis.totalVisits > lastTotal.current) {
          setPulse((p) => p + 1);
        }
        lastTotal.current = data.kpis.totalVisits;
      } catch {
        /* ignore transient errors */
      }
    }
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { stats, prev, pulse };
}
