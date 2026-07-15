"use client";

import { format } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Stats } from "@/lib/types";

/* 1. Visits over time — area, two validated series (cyan visits / amber anon). */
const visitsConfig = {
  visits: { label: "Visits", color: "var(--chart-1)" },
  anon: { label: "Anonymous", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function VisitsChart({ data }: { data: Stats["series"]["visitsOverTime"] }) {
  return (
    <ChartContainer config={visitsConfig} className="h-[200px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-visits)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--color-visits)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillAnon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-anon)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-anon)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={(t: number) => format(new Date(t), "MMM d")}
          className="text-[10px]"
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(_, p) => format(new Date(p?.[0]?.payload?.t), "MMM d")} />}
        />
        <Area
          dataKey="anon"
          type="monotone"
          stroke="var(--color-anon)"
          strokeWidth={2}
          fill="url(#fillAnon)"
          stackId="a"
        />
        <Area
          dataKey="visits"
          type="monotone"
          stroke="var(--color-visits)"
          strokeWidth={2}
          fill="url(#fillVisits)"
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}

/* 2. Top pages — horizontal bars, single hue (magnitude). */
const pagesConfig = {
  count: { label: "Views", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function TopPagesChart({ data }: { data: Stats["series"]["topPages"] }) {
  return (
    <ChartContainer config={pagesConfig} className="h-[220px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 28 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <YAxis
          dataKey="path"
          type="category"
          tickLine={false}
          axisLine={false}
          width={118}
          tickMargin={6}
          className="font-mono text-[10px]"
        />
        <XAxis type="number" hide />
        <ChartTooltip cursor={{ fill: "var(--accent)" }} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} barSize={16}>
          <LabelList
            dataKey="count"
            position="right"
            className="fill-muted-foreground font-mono text-[10px]"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* 3. Identified vs Anonymous — donut, two validated hues + legend. */
const identityConfig = {
  Identified: { label: "Identified", color: "var(--chart-1)" },
  Anonymous: { label: "Anonymous", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function IdentityChart({ data }: { data: Stats["series"]["identitySplit"] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartContainer config={identityConfig} className="mx-auto aspect-square h-[220px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} strokeWidth={3} stroke="var(--card)" paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.name} fill={`var(--color-${d.name})`} />
          ))}
          <LabelList
            dataKey="value"
            className="fill-background font-mono text-xs font-semibold"
            stroke="none"
          />
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2" />
        <text x="50%" y="46%" textAnchor="middle" className="fill-foreground font-mono text-2xl font-semibold">
          {total}
        </text>
        <text x="50%" y="54%" textAnchor="middle" className="fill-muted-foreground text-[10px] uppercase tracking-wide">
          visits
        </text>
      </PieChart>
    </ChartContainer>
  );
}
