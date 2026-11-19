import { ArrowRight, CircleAlert } from "lucide-react";
import { ANOMALIES, BILL, LOAD_FACTOR, MONTH } from "@/lib/data";
import { fmtDay, fmtRange, fmtSignedClp } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { Kpis } from "@/components/Kpis";
import { DailyChart } from "@/components/DailyChart";
import { CostBreakdown } from "@/components/CostBreakdown";
import { Card } from "@/components/ui";

/** Resumen: lo justo para saber cómo va el mes; el detalle vive en cada sección. */
export function Overview({ onDay }: { onDay: (day: number) => void }) {
  const t = useT();
  const { locale } = useLocale();
  const top = ANOMALIES.slice(0, 3);

  return (
    <>
      <Kpis bill={BILL} loadFactor={LOAD_FACTOR} />

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card title={t.dailyEnergy} hint={t.dailyEnergyHint} className="xl:self-start">
          <DailyChart onPick={onDay} />
        </Card>

        <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
          <Card title={t.costBreakdown}>
            <CostBreakdown />
          </Card>

          <Card
            title={t.topAlerts}
            action={
              <a
                href="#/anomalies"
                className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {t.seeAll}
                <ArrowRight size={14} aria-hidden="true" />
              </a>
            }
          >
            <ul className="flex flex-col">
              {top.map((a) => (
                <li key={`${a.day}-${a.from}`} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onDay(a.day)}
                    className="flex w-full items-start justify-between gap-3 py-2.5 text-left outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {fmtDay(locale, MONTH.days[a.day].date)}, {fmtRange(a.from, a.to)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {a.setsPeak && <CircleAlert size={12} aria-hidden="true" className="shrink-0 text-status-critical" />}
                        {a.setsPeak ? t.setsPeak : a.direction === "above" ? t.higher : t.lower}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{fmtSignedClp(locale, a.costImpact, true)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
