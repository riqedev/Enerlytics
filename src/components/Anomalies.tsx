import { ArrowDownRight, ArrowUpRight, CircleAlert } from "lucide-react";
import type { Anomaly } from "@/lib/analysis";
import type { Month } from "@/lib/simulate";
import { fmtDay, fmtNumber, fmtRange, fmtSignedClp } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui";

export function Anomalies({ month, anomalies, selected, onView }: {
  month: Month;
  anomalies: Anomaly[];
  selected: number;
  onView: (day: number) => void;
}) {
  const t = useT();
  const { locale } = useLocale();

  return (
    <Card title={t.anomalies} hint={t.anomaliesHint}>
      {anomalies.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.none}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {anomalies.map((a) => {
            const d = month.days[a.day];
            const above = a.direction === "above";
            const Icon = above ? ArrowUpRight : ArrowDownRight;
            return (
              <li key={`${a.day}-${a.from}`}>
                <button
                  type="button"
                  onClick={() => onView(a.day)}
                  className={cn(
                    "pressable flex w-full flex-col gap-2 rounded-lg border p-3.5 text-left outline-none hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/60",
                    selected === a.day ? "border-foreground/50" : "border-border",
                  )}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 items-start gap-2">
                      <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {fmtDay(locale, d.date, "long")}, {fmtRange(a.from, a.to)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {above ? t.above : t.below}: {a.maxDeviationKw > 0 ? "+" : ""}
                          {fmtNumber(locale, a.maxDeviationKw)} kW, {a.extraKwh > 0 ? "+" : ""}
                          {fmtNumber(locale, a.extraKwh)} kWh
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums">{fmtSignedClp(locale, a.costImpact, true)}</span>
                      <span className="block text-[11px] text-muted-foreground">{a.costImpact < 0 ? t.saved : t.impact}</span>
                    </span>
                  </span>
                  {(a.setsPeak || a.setsMax) && (
                    <span className="flex flex-col gap-1 pl-6 text-xs">
                      {a.setsPeak && (
                        <span className="flex items-center gap-1.5">
                          <CircleAlert size={13} aria-hidden="true" className="shrink-0 text-status-critical" />
                          {t.setsPeak}
                        </span>
                      )}
                      {a.setsMax && (
                        <span className="flex items-center gap-1.5">
                          <CircleAlert size={13} aria-hidden="true" className="shrink-0 text-status-critical" />
                          {t.setsMax}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
