import type { ReactNode } from "react";
import { BASE, DAILY, MONTH } from "@/lib/data";
import { fmtNumber } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { Heatmap } from "@/components/Heatmap";
import { DayChart } from "@/components/DayChart";
import { DayPicker } from "@/components/DayPicker";
import { Card } from "@/components/ui";

const Stat = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-lg font-semibold tabular-nums">{children}</span>
  </div>
);

/** Consumo: el mes completo como selector y el día elegido en detalle. */
export function Load({ day, onDay }: { day: number; onDay: (d: number) => void }) {
  const t = useT();
  const { locale } = useLocale();
  const d = MONTH.days[day];
  const daily = DAILY[day];
  const diff = (daily.kwh - daily.expected) / daily.expected;

  return (
    <>
      <Card title={t.day} action={<DayPicker day={day} onChange={onDay} />}>
        <div className="mb-5 flex flex-wrap gap-x-10 gap-y-3">
          <Stat label={t.dayEnergy}>
            {fmtNumber(locale, daily.kwh)} <span className="text-sm font-normal text-muted-foreground">kWh</span>
          </Stat>
          <Stat label={t.vsExpected}>
            {diff > 0 ? "+" : ""}
            {fmtNumber(locale, diff * 100, 1)}%
          </Stat>
          <Stat label={t.dayPeak}>
            {fmtNumber(locale, Math.max(...d.kw))} <span className="text-sm font-normal text-muted-foreground">kW</span>
          </Stat>
        </div>
        <DayChart day={d} base={BASE} />
      </Card>

      <Heatmap month={MONTH} base={BASE} selected={day} onSelect={onDay} />
    </>
  );
}
