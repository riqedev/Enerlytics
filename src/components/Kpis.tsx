import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import type { Bill } from "@/lib/tariff";
import { TARIFF } from "@/lib/tariff";
import { fmtClp, fmtNumber } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

const Tile = ({ label, value, unit, children }: { label: string; value: string; unit?: string; children?: ReactNode }) => (
  <div className="surface flex min-w-0 flex-col gap-2 rounded-xl p-4 sm:p-5">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.75rem]">
      {value}
      {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
    </span>
    {children && <div className="text-xs leading-relaxed text-muted-foreground">{children}</div>}
  </div>
);

export function Kpis({ bill, loadFactor }: { bill: Bill; loadFactor: number }) {
  const t = useT();
  const { locale } = useLocale();
  const demand = bill.maxDemand + bill.peakDemand;
  const energyShare = bill.energy / bill.total;
  const maxPct = bill.maxKw / TARIFF.contractedKw;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Tile label={t.energy} value={fmtNumber(locale, bill.energyKwh / 1000, 1)} unit="MWh" />

      <Tile label={t.cost} value={fmtClp(locale, bill.total, true)}>
        <div className="mt-1 flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
          <span className="rounded-l-full bg-foreground/70" style={{ width: `${energyShare * 100}%` }} />
          <span className="flex-1 rounded-r-full bg-foreground/20" />
        </div>
        <div className="mt-1.5 flex justify-between gap-2">
          <span>
            {fmtNumber(locale, energyShare * 100)}% {t.energyShare}
          </span>
          <span>
            {fmtNumber(locale, (demand / bill.total) * 100)}% {t.demandShare}
          </span>
        </div>
      </Tile>

      <Tile label={t.maxDemand} value={fmtNumber(locale, bill.maxKw)} unit="kW">
        <span className="flex items-center gap-1.5">
          {maxPct > 1 && <CircleAlert size={13} aria-hidden="true" className="shrink-0 text-status-critical" />}
          {fmtNumber(locale, maxPct * 100)}% {t.ofLimit(`${fmtNumber(locale, TARIFF.contractedKw)} kW`)}
        </span>
      </Tile>

      <Tile label={t.loadFactor} value={`${fmtNumber(locale, loadFactor * 100)}%`}>
        {t.loadFactorHint}
      </Tile>
    </div>
  );
}
