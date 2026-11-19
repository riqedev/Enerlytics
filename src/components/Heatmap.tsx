import { useRef, useState } from "react";
import type { Baseline } from "@/lib/analysis";
import { isAnomalous } from "@/lib/analysis";
import type { Month } from "@/lib/simulate";
import { TARIFF } from "@/lib/tariff";
import { fmtDay, fmtHour, fmtNumber } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { Card, Tooltip } from "@/components/ui";

const STEPS = 8;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

interface Hover {
  day: number;
  hour: number;
  x: number;
  y: number;
}

export function Heatmap({ month, base, selected, onSelect }: {
  month: Month;
  base: Baseline;
  selected: number;
  onSelect: (day: number) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const wrap = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const all = month.days.flatMap((d) => d.kw);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const step = (v: number) => Math.min(STEPS - 1, Math.floor(((v - min) / (max - min)) * STEPS));

  const showTip = (day: number, hour: number, el: HTMLElement) => {
    const box = wrap.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setHover({ day, hour, x: r.left - box.left + r.width / 2, y: r.top - box.top });
  };

  const hd = hover ? month.days[hover.day] : null;

  return (
    <Card title={t.month} hint={t.monthHint}>
      <div className="-mx-1 overflow-x-auto px-1 pt-4 pb-1">
        <div ref={wrap} className="relative min-w-[18rem]" onPointerLeave={() => setHover(null)}>
          {/* Encabezado de horas + marca de punta */}
          <div className="grid grid-cols-[3.25rem_repeat(24,minmax(0,1fr))] gap-px pb-1.5 sm:grid-cols-[3.75rem_repeat(24,minmax(0,1fr))] text-[10px] text-muted-foreground">
            <span />
            {HOURS.map((h) => (
              <span key={h} className="relative text-center tabular-nums">
                {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
                {h === TARIFF.peakHours[0] && (
                  <span className="osd absolute -top-4 left-0 text-[9px] whitespace-nowrap text-hud">{t.peakBand}</span>
                )}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-px">
            {month.days.map((d) => {
              const isSel = d.index === selected;
              return (
                <button
                  key={d.index}
                  type="button"
                  onClick={() => onSelect(d.index)}
                  aria-pressed={isSel}
                  aria-label={fmtDay(locale, d.date, "long")}
                  className={cn(
                    "group grid grid-cols-[3.25rem_repeat(24,minmax(0,1fr))] gap-px sm:grid-cols-[3.75rem_repeat(24,minmax(0,1fr))] rounded-[3px] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    isSel && "ring-2 ring-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center gap-1 pr-1.5 text-[10px] leading-none whitespace-nowrap tabular-nums sm:text-[11px]",
                      isSel ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {fmtDay(locale, d.date)}
                    {d.holiday && <span aria-label={t.holiday} title={t.holiday} className="size-1 rounded-full bg-current" />}
                  </span>
                  {d.kw.map((v, h) => {
                    const anomaly = isAnomalous(base, d, h);
                    return (
                      <span
                        key={h}
                        onPointerEnter={(e) => showTip(d.index, h, e.currentTarget)}
                        className={cn(
                          "heat-cell relative h-3.5 sm:h-4",
                          d.peak[h] && "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-foreground/25",
                        )}
                        style={{ backgroundColor: `var(--seq-${step(v)})` }}
                      >
                        {anomaly && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 rounded-[2px] ring-2 ring-status-warning ring-inset"
                          />
                        )}
                      </span>
                    );
                  })}
                </button>
              );
            })}
          </div>

          {hover && hd && (
            <Tooltip x={hover.x} y={hover.y}>
              <div className="text-sm font-semibold tabular-nums">{fmtNumber(locale, hd.kw[hover.hour])} kW</div>
              <div className="text-muted-foreground">
                {fmtDay(locale, hd.date)}, {fmtHour(hover.hour)}
              </div>
              <div className="mt-1 text-muted-foreground tabular-nums">
                {t.expected}: {fmtNumber(locale, base.expected(hd, hover.hour))} kW
              </div>
              {isAnomalous(base, hd, hover.hour) && <div className="mt-1 font-medium">{t.anomalyMark}</div>}
            </Tooltip>
          )}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          {t.low}
          <span className="flex gap-px" aria-hidden="true">
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className="heat-cell h-2.5 w-4" style={{ backgroundColor: `var(--seq-${i})` }} />
            ))}
          </span>
          {t.high}
          <span className="tabular-nums">
            ({fmtNumber(locale, min)}–{fmtNumber(locale, max)} kW)
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-[2px] ring-2 ring-status-warning ring-inset" />
          {t.anomalyMark}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-1 rounded-full bg-current" />
          {t.holiday}
        </span>
      </div>
    </Card>
  );
}
