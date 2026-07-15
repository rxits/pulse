"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

export interface KpiTileProps {
  label: string;
  value: number;
  prev?: number;
  hint?: string;
  accent?: "cyan" | "lime" | "amber";
  live?: boolean;
  beam?: boolean;
}

const ACCENT: Record<string, string> = {
  cyan: "text-glow-cyan",
  lime: "text-glow-lime",
  amber: "text-[--color-chart-2]",
};

export function KpiTile({ label, value, prev, hint, accent = "cyan", live, beam }: KpiTileProps) {
  const delta = prev != null ? value - prev : 0;
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card/70 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        {live && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-glow-lime">
            <span className="size-1.5 animate-pulse rounded-full bg-glow-lime shadow-[0_0_8px_var(--color-glow-lime)]" />
            LIVE
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn("font-mono text-3xl font-semibold tabular-nums text-glow", ACCENT[accent])}>
          <NumberTicker value={value} className="text-inherit" />
        </span>
        {delta > 0 && (
          <span className="font-mono text-xs text-glow-lime">+{delta}</span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      {beam && <BorderBeam size={70} duration={8} colorFrom="#22d3ee" colorTo="#a3e635" />}
    </div>
  );
}
