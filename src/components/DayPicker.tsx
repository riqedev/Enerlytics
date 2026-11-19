import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTH } from "@/lib/data";
import { fmtDay } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

const btn =
  "pressable grid size-9 place-items-center rounded-lg border border-border text-muted-foreground outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-40";

/** Selector de día: anterior / lista / siguiente. Control estándar, funciona igual con teclado. */
export function DayPicker({ day, onChange }: { day: number; onChange: (d: number) => void }) {
  const t = useT();
  const { locale } = useLocale();
  const last = MONTH.days.length - 1;

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={btn} onClick={() => onChange(day - 1)} disabled={day === 0} aria-label={t.prevDay}>
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      <select
        value={day}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={t.dayPick}
        className="h-9 rounded-lg border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {MONTH.days.map((d) => (
          <option key={d.index} value={d.index}>
            {fmtDay(locale, d.date, "long")}
            {d.holiday ? ` (${t.holiday})` : ""}
          </option>
        ))}
      </select>
      <button type="button" className={btn} onClick={() => onChange(day + 1)} disabled={day === last} aria-label={t.nextDay}>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
