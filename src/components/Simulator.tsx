import { useState } from "react";
import { CircleAlert, CircleCheck, Sparkles } from "lucide-react";
import type { Placement, Process } from "@/lib/analysis";
import { TARIFF } from "@/lib/tariff";
import { fmtClp, fmtHour, fmtNumber, fmtRange, fmtSignedClp } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { PRESETS, type PresetId } from "@/lib/presets";
import { cn } from "@/lib/cn";


const Slider = ({ label, value, min, max, step = 1, display, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (v: number) => void;
}) => (
  <label className="flex flex-col gap-2 text-sm">
    <span className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{display}</span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[var(--series-process)]"
    />
  </label>
);

/** Qué proceso y a qué hora. */
export function SimControls({ preset, process, start, onPreset, onProcess, onStart }: {
  preset: PresetId;
  process: Process;
  start: number;
  onPreset: (p: PresetId) => void;
  onProcess: (p: Process) => void;
  onStart: (s: number) => void;
}) {
  const t = useT();
  const ids: PresetId[] = ["compressor", "oven", "ev", "custom"];

  return (
    <div className="flex flex-col gap-6">
      {/* Proceso */}
      <div className="flex flex-col gap-3">
        <span className="text-sm text-muted-foreground">{t.presets}</span>
        <div role="radiogroup" aria-label={t.presets} className="grid grid-cols-2 gap-1.5">
          {ids.map((id) => {
            const p = id === "custom" ? null : PRESETS[id];
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={preset === id}
                onClick={() => onPreset(id)}
                className={cn(
                  "pressable flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  preset === id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground hover:border-foreground/40",
                )}
              >
                <span className="font-medium">{id === "custom" ? t.custom : t.presetsList[id]}</span>
                {p && (
                  <span className={cn("text-xs tabular-nums", preset === id ? "text-background/70" : "text-muted-foreground")}>
                    {p.kw} kW, {p.hours} h
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {preset === "custom" && (
          <>
            <Slider
              label={t.power}
              value={process.kw}
              min={20}
              max={250}
              step={10}
              display={`${process.kw} kW`}
              onChange={(kw) => onProcess({ ...process, kw })}
            />
            <Slider
              label={t.duration}
              value={process.hours}
              min={1}
              max={8}
              display={`${process.hours} h`}
              onChange={(hours) => onProcess({ ...process, hours })}
            />
          </>
        )}
        <div>
          <Slider
            label={t.start}
            value={start}
            min={0}
            max={24 - process.hours}
            display={fmtRange(start, start + process.hours)}
            onChange={onStart}
          />
        </div>
      </div>
    </div>
  );
}

/** El costo de cada hora de inicio y el resultado de la elegida. */
export function SimOutcome({ process, start, options, best, onStart }: {
  process: Process;
  start: number;
  options: Placement[];
  best: Placement;
  onStart: (s: number) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [hover, setHover] = useState<number | null>(null);
  const current = options[Math.min(start, options.length - 1)];
  const maxCost = Math.max(...options.map((o) => o.cost));

  return (
    <div className="flex flex-col gap-6">
      {/* Costo según hora de inicio: el paisaje completo, no solo el punto elegido */}
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">{t.costByStart}</span>
          <button
            type="button"
            onClick={() => onStart(best.start)}
            disabled={best.start === start}
            className="pressable flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-40"
          >
            <Sparkles size={14} aria-hidden="true" />
            {t.best}
          </button>
        </div>
        <div className="relative" onPointerLeave={() => setHover(null)}>
          <div className="flex h-20 items-end gap-0.5" role="group" aria-label={t.costByStart}>
            {options.map((o) => (
              <button
                key={o.start}
                type="button"
                onClick={() => onStart(o.start)}
                onPointerEnter={() => setHover(o.start)}
                onFocus={() => setHover(o.start)}
                onBlur={() => setHover(null)}
                aria-label={`${fmtHour(o.start)}: ${fmtSignedClp(locale, o.cost)}`}
                aria-pressed={o.start === start}
                className="group flex h-full flex-1 items-end outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <span
                  className={cn(
                    "w-full rounded-t-[3px] transition-colors",
                    o.start === start ? "bg-series-process" : "bg-foreground/20 group-hover:bg-foreground/35",
                    o.overLimit && o.start !== start && "bg-status-critical/45",
                  )}
                  style={{ height: `${Math.max(4, (o.cost / maxCost) * 100)}%` }}
                />
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
            <span>{String(24 - process.hours).padStart(2, "0")}</span>
          </div>
          {options.some((o) => o.overLimit) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-status-critical/45" />
              {t.overLimit}
            </div>
          )}
          {hover !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 text-xs whitespace-nowrap shadow-lg"
              style={{ left: `${((hover + 0.5) / options.length) * 100}%` }}
            >
              <div className="text-sm font-semibold tabular-nums">{fmtSignedClp(locale, options[hover].cost)}</div>
              <div className="text-muted-foreground">{fmtRange(hover, hover + process.hours)}</div>
              {options[hover].overLimit && <div className="mt-1 font-medium">{t.overLimit}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Resultado */}
      <div className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{t.extraCost}</span>
          <span className="text-3xl font-semibold tracking-tight tabular-nums">{fmtSignedClp(locale, current.cost)}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t.energyPart} {fmtClp(locale, current.energyCost)}, {t.demandPart.toLowerCase()}{" "}
            {fmtClp(locale, current.demandCost)}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 text-sm sm:items-end">
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {current.overLimit ? (
              <CircleAlert size={15} aria-hidden="true" className="text-status-critical" />
            ) : (
              <CircleCheck size={15} aria-hidden="true" className="text-status-good" />
            )}
            {current.overLimit ? t.overLimit : t.withinLimit}
            <span className="text-muted-foreground tabular-nums">
              ({t.dayMax} {fmtNumber(locale, current.dayMaxKw)} / {fmtNumber(locale, TARIFF.contractedKw)} kW)
            </span>
          </span>
          <span className="text-muted-foreground">
            {current.start === best.start ? (
              t.isBest
            ) : (
              <>
                <span className="font-medium text-foreground tabular-nums">
                  {fmtSignedClp(locale, current.cost - best.cost, true)}
                </span>{" "}
                {t.vsBest} ({fmtHour(best.start)})
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
