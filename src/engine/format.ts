export function fmtNum(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const d = abs >= 100 ? 0 : digits;
  return n.toLocaleString("ar-SA", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function fmtInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("ar-SA");
}

export function fmtMoney(n: number, unit = "مليار"): string {
  return `${fmtNum(n, Math.abs(n) >= 100 ? 0 : 1)} ${unit}`;
}

export function fmtPct(n: number, digits = 1): string {
  return `${fmtNum(n * 100, digits)}٪`;
}

export function fmtSignedPct(n: number, digits = 1): string {
  const sign = n > 0.0005 ? "+" : "";
  return `${sign}${fmtNum(n * 100, digits)}٪`;
}

export function fmtPoints(n: number): string {
  return fmtNum(n, n >= 10 ? 0 : 1);
}

export type TrendKind = "up" | "down" | "flat";

export function trendOf(curr: number, prev: number | undefined, invert = false): TrendKind {
  if (prev === undefined) return "flat";
  const delta = curr - prev;
  const scale = Math.max(Math.abs(prev), 1) * 0.008;
  if (Math.abs(delta) < scale) return "flat";
  const dir = delta > 0 ? "up" : "down";
  if (!invert) return dir;
  return dir === "up" ? "down" : "up";
}

export function trendLabel(t: TrendKind): string {
  if (t === "up") return "تحسّن";
  if (t === "down") return "تراجُع";
  return "استقرار";
}
