// Small display helpers (client-safe).

export function flagEmoji(code: string | null): string {
  if (!code || code.length !== 2) return "🌐";
  const A = 0x1f1e6;
  const cc = code.toUpperCase();
  return String.fromCodePoint(A + (cc.charCodeAt(0) - 65), A + (cc.charCodeAt(1) - 65));
}

export function relativeTime(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return "now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function shortNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function maskIp(ip: string): string {
  if (!ip) return "—";
  if (ip.includes(":")) return ip.slice(0, 12) + "…"; // ipv6
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.×.×`;
  return ip;
}

export function locationLabel(city: string | null, country: string | null): string {
  if (city && country) return `${city}, ${country}`;
  return country || city || "Unknown";
}
