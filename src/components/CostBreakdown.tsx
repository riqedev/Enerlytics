import { BILL } from "@/lib/data";
import { TARIFF } from "@/lib/tariff";
import { fmtClp, fmtNumber } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

/** Los tres cargos de la cuenta, con su cálculo y su peso en el total. */
export function CostBreakdown() {
  const t = useT();
  const { locale } = useLocale();
  const rows = [
    {
      label: t.energyRate,
      value: BILL.energy,
      detail: `${fmtNumber(locale, BILL.energyKwh)} kWh × ${fmtClp(locale, TARIFF.energyPerKwh)}`,
    },
    {
      label: t.maxRate,
      value: BILL.maxDemand,
      detail: `${fmtNumber(locale, BILL.maxKw)} kW × ${fmtClp(locale, TARIFF.maxDemandPerKw)}`,
    },
    {
      label: t.peakRate,
      value: BILL.peakDemand,
      detail: `${fmtNumber(locale, BILL.peakKw)} kW × ${fmtClp(locale, TARIFF.peakDemandPerKw)}`,
    },
  ];

  return (
    <div className="flex flex-col">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1.5 border-b border-border py-3 first:pt-0">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span>{r.label}</span>
            <span className="font-medium tabular-nums">{fmtClp(locale, r.value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
            <div className="h-full rounded-full bg-foreground/60" style={{ width: `${(r.value / BILL.total) * 100}%` }} />
          </div>
          <div className="flex justify-between gap-4 text-xs text-muted-foreground tabular-nums">
            <span>{r.detail}</span>
            <span>{fmtNumber(locale, (r.value / BILL.total) * 100)}%</span>
          </div>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-4 pt-3 text-sm">
        <span className="font-medium">Total</span>
        <span className="text-base font-semibold tabular-nums">{fmtClp(locale, BILL.total)}</span>
      </div>
    </div>
  );
}
