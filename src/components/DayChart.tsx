import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { Baseline, Process } from "@/lib/analysis";
import type { Day } from "@/lib/simulate";
import { TARIFF } from "@/lib/tariff";
import { fmtDay, fmtHour, fmtNumber } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { Swatch, Tooltip } from "@/components/ui";

const H = 260;
const PAD = { top: 22, right: 8, bottom: 24, left: 40 };
const GAP = 2; // separación de superficie entre segmentos apilados

const niceStep = (max: number) => {
  const raw = max / 5;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
};

/** Barra con solo las esquinas superiores redondeadas (el extremo de dato), base recta. */
const topRounded = (x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
};

export function DayChart({ day, base, process, start }: {
  day: Day;
  base: Baseline;
  process?: Process;
  start?: number;
}) {
  const t = useT();
  const { locale } = useLocale();
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const proc = (h: number) => (process && start !== undefined && h >= start && h < start + process.hours ? process.kw : 0);
  const expected = day.kw.map((_, h) => base.expected(day, h));
  const top = Math.max(TARIFF.contractedKw * 1.1, ...day.kw.map((v, h) => v + proc(h)), ...expected);
  const step = niceStep(top);
  const yMax = Math.ceil(top / step) * step;

  const iw = Math.max(0, width - PAD.left - PAD.right);
  const ih = H - PAD.top - PAD.bottom;
  const col = iw / 24;
  const bw = Math.max(2, col * 0.62);
  const x = (h: number) => PAD.left + h * col + (col - bw) / 2;
  const y = (v: number) => PAD.top + ih - (v / yMax) * ih;
  const ticks = Array.from({ length: Math.floor(yMax / step) + 1 }, (_, i) => i * step);
  const peakHours = day.peak.map((p, h) => (p ? h : -1)).filter((h) => h >= 0);

  return (
    <div>
      {/* Leyenda: siempre presente con 2+ series */}
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Swatch className="bg-series-load" /> {t.actual}
        </span>
        {process && (
          <span className="flex items-center gap-1.5">
            <Swatch className="bg-series-process" /> {t.process}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-3 bg-foreground/60" /> {t.expected}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-3 border-t-2 border-dashed border-status-critical" /> {t.limit}
        </span>
        {peakHours.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-band ring-1 ring-border" /> {t.peakBand}
          </span>
        )}
      </div>

      <div ref={wrap} className="relative" onPointerLeave={() => setHover(null)}>
        {width > 0 && (
          <svg width={width} height={H} role="img" aria-label={`${t.day}: ${fmtDay(locale, day.date, "long")}`}>
            {/* Banda de punta */}
            {peakHours.length > 0 && (
              <g>
                <rect
                  x={PAD.left + peakHours[0] * col}
                  y={PAD.top}
                  width={peakHours.length * col}
                  height={ih}
                  className="fill-band"
                />
                <text
                  x={PAD.left + peakHours[0] * col + 4}
                  y={PAD.top - 7}
                  className="fill-muted-foreground text-[10px] font-medium"
                >
                  {t.peakBand}
                </text>
              </g>
            )}

            {/* Grilla y eje Y */}
            {ticks.map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(v)}
                  y2={y(v)}
                  className={v === 0 ? "stroke-axis" : "stroke-grid"}
                  strokeWidth={1}
                />
                <text x={PAD.left - 8} y={y(v) + 3.5} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                  {fmtNumber(locale, v)}
                </text>
              </g>
            ))}
            <text x={PAD.left - 8} y={PAD.top - 7} textAnchor="end" className="fill-muted-foreground text-[10px]">
              kW
            </text>

            {/* Barras */}
            {day.kw.map((v, h) => {
              const p = proc(h);
              const total = v + p;
              return (
                <g key={h}>
                  <path d={topRounded(x(h), y(v), bw, y(0) - y(v), p ? 0 : 4)} className="fill-series-load" />
                  {p > 0 && (
                    <path d={topRounded(x(h), y(total), bw, Math.max(0, y(v) - y(total) - GAP), 4)} className="fill-series-process" />
                  )}
                  {/* Esperado: tick horizontal sobre la columna */}
                  <line
                    x1={x(h) - 3}
                    x2={x(h) + bw + 3}
                    y1={y(expected[h])}
                    y2={y(expected[h])}
                    className="stroke-foreground/60"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  {total > TARIFF.contractedKw && (
                    <g transform={`translate(${x(h) + bw / 2 - 6}, ${y(total) - 16})`}>
                      <TriangleAlert size={12} className="text-status-critical" aria-hidden="true" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Límite contratado */}
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(TARIFF.contractedKw)}
              y2={y(TARIFF.contractedKw)}
              className="stroke-status-critical"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            <text x={width - PAD.right} y={y(TARIFF.contractedKw) - 5} textAnchor="end" className="fill-foreground text-[10px]">
              {t.limit} {fmtNumber(locale, TARIFF.contractedKw)} kW
            </text>

            {/* Eje X */}
            {day.kw.map((_, h) =>
              h % 3 === 0 ? (
                <text key={h} x={PAD.left + h * col + col / 2} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[10px] tabular-nums">
                  {String(h).padStart(2, "0")}
                </text>
              ) : null,
            )}

            {/* Zonas de hover: la columna completa, más grande que la barra */}
            {day.kw.map((_, h) => (
              <rect
                key={h}
                x={PAD.left + h * col}
                y={PAD.top}
                width={col}
                height={ih}
                fill="transparent"
                onPointerEnter={() => setHover(h)}
              />
            ))}
            {hover !== null && (
              <line
                x1={PAD.left + hover * col + col / 2}
                x2={PAD.left + hover * col + col / 2}
                y1={PAD.top}
                y2={PAD.top + ih}
                className="pointer-events-none stroke-foreground/25"
              />
            )}
          </svg>
        )}

        {hover !== null && (
          <Tooltip x={PAD.left + hover * col + col / 2} y={y(day.kw[hover] + proc(hover))}>
            <div className="mb-1 text-muted-foreground">{fmtHour(hover)}</div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <Swatch className="bg-series-load" /> {t.actual}
              </span>
              <span className="font-semibold tabular-nums">{fmtNumber(locale, day.kw[hover])} kW</span>
            </div>
            {proc(hover) > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5">
                  <Swatch className="bg-series-process" /> {t.process}
                </span>
                <span className="font-semibold tabular-nums">+{fmtNumber(locale, proc(hover))} kW</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 text-muted-foreground">
              <span>{t.expected}</span>
              <span className="tabular-nums">{fmtNumber(locale, expected[hover])} kW</span>
            </div>
          </Tooltip>
        )}
      </div>

      <button
        type="button"
        onClick={() => setTable((v) => !v)}
        aria-expanded={table}
        className="mt-3 text-xs text-muted-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {table ? t.hideTable : t.table}
      </button>
      {table && (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">{t.hourCol}</th>
                <th className="px-3 py-2 text-right font-medium">{t.actual} (kW)</th>
                <th className="px-3 py-2 text-right font-medium">{t.expected} (kW)</th>
                {process && <th className="px-3 py-2 text-right font-medium">{t.process} (kW)</th>}
              </tr>
            </thead>
            <tbody>
              {day.kw.map((v, h) => (
                <tr key={h} className="border-t border-border">
                  <td className="px-3 py-1.5">
                    {fmtHour(h)}
                    {day.peak[h] && <span className="ml-2 text-muted-foreground">({t.peakBand})</span>}
                  </td>
                  <td className="px-3 py-1.5 text-right">{fmtNumber(locale, v)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtNumber(locale, expected[h])}</td>
                  {process && <td className="px-3 py-1.5 text-right">{proc(h) ? fmtNumber(locale, proc(h)) : "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
