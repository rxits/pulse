"use client";

import { AnimatePresence, motion } from "motion/react";
import { flagEmoji, locationLabel, maskIp, relativeTime } from "@/lib/format";
import type { VisitEvent } from "@/lib/types";

/** Live stream of the most recent visits — newest slides in at the top. */
export function ActivityFeed({ events }: { events: VisitEvent[] }) {
  const rows = events.slice(0, 9);
  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence initial={false}>
        {rows.map((e) => (
          <motion.div
            key={e.id}
            layout
            initial={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2"
          >
            <span
              className={`size-2 shrink-0 rounded-full ${
                e.anonymous
                  ? "bg-[--color-chart-2] shadow-[0_0_8px_var(--color-chart-2)]"
                  : "bg-glow-cyan shadow-[0_0_8px_var(--color-glow-cyan)]"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="truncate font-medium">
                  {e.anonymous ? (
                    <span className="text-muted-foreground">
                      Anonymous <span className="font-mono text-xs">{maskIp(e.ip)}</span>
                    </span>
                  ) : (
                    <span className="text-foreground">{e.user}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>{flagEmoji(e.countryCode)}</span>
                <span className="truncate">{locationLabel(e.city, e.country)}</span>
                <span className="text-muted-foreground/50">·</span>
                <span className="truncate font-mono text-glow-cyan/70">{e.path}</span>
              </div>
            </div>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{relativeTime(e.ts)}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
