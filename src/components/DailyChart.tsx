import { useEffect, useRef, useState } from "react";
import { DAILY, MONTH } from "@/lib/data";
import { fmtDay, fmtNumber } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { Swatch, Tooltip } from "@/components/ui";

const H = 300;
const PAD = { top: 16, right: 8, bottom: 26, left: 44 };

const niceStep = (max: number) => {
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
};

const topRounded = (x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
};

/** Energía por día del mes (MWh) con lo esperado como marca. Click en un día = ir a su detalle. */
export function DailyChart({ onPick }: { onPick: (day: number) => void }) {
  const t = useT();
  const { locale } = useLocale();
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const mwh = DAILY.map((d) => ({ ...d, kwh: d.kwh / 1000, expected: d.expected / 1000 }));
  const top = Math.max(...mwh.map((d) => Math.max(d.kwh, d.expected)));
  const step = niceStep(top);
  const yMax = Math.ceil(top / step) * step;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);

  const iw = Math.max(0, width - PAD.left - PAD.right);
  const ih = H - PAD.top - PAD.bottom;
  const col = iw / mwh.length;
  const bw = Math.max(3, col * 0.62);
  const x = (i: number) => PAD.left + i * col + (col - bw) / 2;
  const y = (v: number) => PAD.top + ih - (v / yMax) * ih;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Swatch className="bg-series-load" /> {t.actual}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-3 bg-foreground/60" /> {t.expected}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-status-warning" /> {t.anomalyMark}
        </span>
      </div>
      <div ref={wrap} className="relative" onPointerLeave={() => setHover(null)}>
        {width > 0 && (
          <svg width={width} height={H} role="img" aria-label={t.dailyEnergy}>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className={v === 0 ? "stroke-axis" : "stroke-grid"} />
                <text x={PAD.left - 8} y={y(v) + 3.5} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                  {fmtNumber(locale, v, 1)}
                </text>
              </g>
            ))}
            <text x={PAD.left - 8} y={PAD.top - 5} textAnchor="end" className="fill-muted-foreground text-[10px]">
              MWh
            </text>

            {mwh.map((d, i) => (
              <g key={d.day}>
                <path d={topRounded(x(i), y(d.kwh), bw, y(0) - y(d.kwh), 4)} className="fill-series-load" opacity={hover === null || hover === i ? 1 : 0.55} />
                <line x1={x(i) - 2} x2={x(i) + bw + 2} y1={y(d.expected)} y2={y(d.expected)} className="stroke-foreground/60" strokeWidth={2} strokeLinecap="round" />
                {d.anomalies > 0 && <circle cx={x(i) + bw / 2} cy={Math.min(y(d.kwh), y(d.expected)) - 8} r={3} className="fill-status-warning" />}
                {i % 7 === 0 && (
                  <text x={x(i) + bw / 2} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[10px] tabular-nums">
                    {i + 1}
                  </text>
                )}
              </g>
            ))}

            {mwh.map((d, i) => (
              <rect
                key={d.day}
                x={PAD.left + i * col}
                y={PAD.top}
                width={col}
                height={ih}
                fill="transparent"
                className="cursor-pointer"
                onPointerEnter={() => setHover(i)}
                onClick={() => onPick(d.day)}
              />
            ))}
          </svg>
        )}
        {hover !== null && (
          <Tooltip x={PAD.left + hover * col + col / 2} y={y(Math.max(mwh[hover].kwh, mwh[hover].expected))}>
            <div className="text-sm font-semibold tabular-nums">{fmtNumber(locale, mwh[hover].kwh, 2)} MWh</div>
            <div className="text-muted-foreground">{fmtDay(locale, MONTH.days[hover].date, "long")}</div>
            <div className="mt-1 text-muted-foreground tabular-nums">
              {t.expected}: {fmtNumber(locale, mwh[hover].expected, 2)} MWh
            </div>
            {mwh[hover].anomalies > 0 && <div className="mt-1 font-medium">{t.anomalyMark}</div>}
          </Tooltip>
        )}
      </div>
    </div>
  );
}
