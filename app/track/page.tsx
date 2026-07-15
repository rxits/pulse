"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

function sessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("pulse-sid");
  if (!id) {
    id = "web-" + Math.random().toString(36).slice(2, 11);
    localStorage.setItem("pulse-sid", id);
  }
  return id;
}

/** Fetch the visitor's public IPv4 and IPv6 from IP-echo endpoints. */
async function fetchIps(): Promise<{ ipv4: string | null; ipv6: string | null }> {
  const grab = async (url: string) => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      return (await r.json()).ip as string;
    } catch {
      return null;
    }
  };
  const [a, b] = await Promise.all([
    grab("https://api.ipify.org?format=json"), // IPv4
    grab("https://api6.ipify.org?format=json"), // IPv6 (falls back to v4 on v4-only networks)
  ]);
  return {
    ipv4: a && !a.includes(":") ? a : b && !b.includes(":") ? b : null,
    ipv6: b && b.includes(":") ? b : a && a.includes(":") ? a : null,
  };
}

interface Seen {
  ipv4: string | null;
  ipv6: string | null;
  city: string | null;
  country: string | null;
}

export default function TrackDemo() {
  const [me, setMe] = useState<Seen | null>(null);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const ipsRef = useRef<{ ipv4: string | null; ipv6: string | null } | null>(null);

  async function record(user: string | null, path = "/track") {
    setSending(true);
    try {
      if (!ipsRef.current) ipsRef.current = await fetchIps();
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          user,
          sessionId: sessionId(),
          referrer: document.referrer || "direct",
          ...ipsRef.current,
        }),
      });
      const data = await res.json();
      setMe({ ipv4: data.ipv4, ipv6: data.ipv6, city: data.city, country: data.country });
    } finally {
      setSending(false);
    }
  }

  // Opening this public page records the visit — exactly what Pulse tracks.
  useEffect(() => {
    record(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-6 text-center">
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Dashboard
      </Link>

      <div className="inline-flex items-center gap-1.5 rounded-full border border-glow-cyan/40 bg-glow-cyan/10 px-3 py-1 text-[11px] text-glow-cyan">
        <span className="size-1.5 animate-pulse rounded-full bg-glow-lime" />
        This is a public page — your visit is being recorded
      </div>

      <h1 className="mt-5 text-3xl font-bold tracking-tight text-glow">You&apos;re on the record.</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Pulse just logged this visit. Because you didn&apos;t identify yourself, it recorded your
        public IP and resolved it to an approximate location — then plotted you on the live globe.
      </p>

      <div className="mt-6 w-full rounded-xl border border-border bg-card/70 p-4 text-left backdrop-blur">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5 text-glow-cyan" /> What Pulse saw
        </div>
        <div className="mt-3 space-y-3 font-mono">
          <Field label="Public IPv4" value={me?.ipv4 ?? null} loading={!me} />
          <Field label="Public IPv6" value={me?.ipv6 ?? null} loading={!me} />
          <Field
            label="Location"
            value={me ? [me.city, me.country].filter(Boolean).join(", ") || "Unknown" : null}
            loading={!me}
          />
        </div>
      </div>

      <div className="mt-5 flex w-full flex-col items-center gap-3">
        <button
          onClick={() => record(null)}
          disabled={sending}
          className="rounded-md bg-glow-cyan/15 px-3 py-1.5 text-xs font-medium text-glow-cyan ring-1 ring-glow-cyan/40 transition hover:bg-glow-cyan/25 disabled:opacity-50"
        >
          Record another anonymous visit
        </button>

        <div className="flex w-full items-center gap-2">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">or identify yourself</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) record(name.trim());
          }}
          className="flex w-full items-center gap-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="h-9 flex-1 rounded-md border border-border bg-card/70 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-glow-cyan/50"
          />
          <button
            type="submit"
            disabled={sending || !name.trim()}
            className="h-9 shrink-0 rounded-md bg-glow-lime/15 px-3 text-xs font-medium text-glow-lime ring-1 ring-glow-lime/40 transition hover:bg-glow-lime/25 disabled:opacity-40"
          >
            Record as {name.trim() || "me"}
          </button>
        </form>
      </div>

      <Link href="/" className="mt-6 text-xs text-glow-cyan hover:underline">
        ← Watch it appear on the dashboard
      </Link>
    </main>
  );
}

function Field({ label, value, loading }: { label: string; value: string | null; loading: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="break-all text-sm leading-snug">
        {loading ? "…" : value ?? <span className="text-muted-foreground">not available</span>}
      </div>
    </div>
  );
}
