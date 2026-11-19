import type { Locale } from "./i18n.ts";

const tag = (l: Locale) => (l === "es" ? "es-CL" : "en-US");

export const fmtNumber = (l: Locale, n: number, digits = 0) =>
  new Intl.NumberFormat(tag(l), { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);

/** CLP sin decimales; en cifras grandes, compacto ("$27,1 M"). */
export const fmtClp = (l: Locale, n: number, compact = false) => {
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (compact && abs >= 1_000_000)
    return `${sign}$${fmtNumber(l, abs / 1_000_000, 1)} M`;
  return `${sign}$${fmtNumber(l, Math.round(abs))}`;
};

export const fmtSignedClp = (l: Locale, n: number, compact = false) =>
  `${n > 0.5 ? "+" : ""}${fmtClp(l, n, compact)}`;

export const fmtKw = (l: Locale, n: number) => `${fmtNumber(l, n)} kW`;

export const fmtHour = (h: number) => `${String(h).padStart(2, "0")}:00`;
export const fmtRange = (from: number, to: number) => `${fmtHour(from)}–${fmtHour(to)}`;

export const fmtDay = (l: Locale, d: Date, style: "short" | "long" = "short") =>
  d.toLocaleDateString(tag(l), style === "short" ? { weekday: "short", day: "numeric" } : { weekday: "long", day: "numeric", month: "long" });

export const fmtMonth = (l: Locale, year: number, month: number) => {
  const s = new Date(year, month, 1).toLocaleDateString(tag(l), { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
