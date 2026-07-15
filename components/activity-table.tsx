"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flagEmoji, locationLabel, maskIp, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VisitEvent } from "@/lib/types";

type Filter = "all" | "identified" | "anonymous";

export function ActivityTable({ events }: { events: VisitEvent[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return events.filter((e) => {
      if (filter === "identified" && e.anonymous) return false;
      if (filter === "anonymous" && !e.anonymous) return false;
      if (!term) return true;
      return [e.user, e.ip, e.city, e.country, e.path, e.referrer]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [events, filter, q]);

  const counts = useMemo(
    () => ({
      all: events.length,
      identified: events.filter((e) => !e.anonymous).length,
      anonymous: events.filter((e) => e.anonymous).length,
    }),
    [events],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-border bg-secondary/30 p-0.5 text-xs">
          {(["all", "identified", "anonymous"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium capitalize transition",
                filter === f
                  ? "bg-glow-cyan/15 text-glow-cyan"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f} <span className="ml-1 tabular-nums opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search user, IP, city, page…"
            className="h-8 w-56 rounded-lg border border-border bg-secondary/30 pl-8 pr-2 text-xs outline-none placeholder:text-muted-foreground focus:border-glow-cyan/50"
          />
        </div>
      </div>

      <div className="max-h-[22rem] overflow-y-auto rounded-lg border border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wide">Visitor</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide">Location</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide">Page</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide">Source</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wide">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow key={e.id} className="border-border/60">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        e.anonymous ? "bg-[--color-chart-2]" : "bg-glow-cyan",
                      )}
                    />
                    {e.anonymous ? (
                      <span className="text-muted-foreground">
                        Anonymous <span className="font-mono text-xs">{maskIp(e.ip)}</span>
                      </span>
                    ) : (
                      <span className="font-medium">{e.user}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="mr-1">{flagEmoji(e.countryCode)}</span>
                  {locationLabel(e.city, e.country)}
                </TableCell>
                <TableCell className="font-mono text-xs text-glow-cyan/80">{e.path}</TableCell>
                <TableCell className="max-w-[10rem] truncate text-xs text-muted-foreground">
                  {e.referrer === "direct" || !e.referrer
                    ? "direct"
                    : new URL(e.referrer.startsWith("http") ? e.referrer : `https://${e.referrer}`).hostname.replace("www.", "")}
                </TableCell>
                <TableCell className="text-right font-mono text-[11px] text-muted-foreground">
                  {relativeTime(e.ts)}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No matching visits.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
