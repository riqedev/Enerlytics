import { TARIFF } from "@/lib/tariff";
import { fmtClp } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { Card } from "@/components/ui";

export function TariffCard() {
  const t = useT();
  const { locale } = useLocale();
  const rows = [
    { label: t.energyRate, value: fmtClp(locale, TARIFF.energyPerKwh), unit: t.perKwh },
    { label: t.maxRate, value: fmtClp(locale, TARIFF.maxDemandPerKw), unit: t.perKwMonth },
    { label: t.peakRate, value: fmtClp(locale, TARIFF.peakDemandPerKw), unit: t.perKwMonth, note: t.peakRule },
  ];

  return (
    <Card title={t.tariff} hint={t.tariffHint}>
      <dl className="text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 border-t border-border py-2.5 first:border-t-0 first:pt-0">
            <dt>
              {r.label}
              {r.note && <span className="block text-xs text-muted-foreground">{r.note}</span>}
            </dt>
            <dd className="text-right tabular-nums">
              <span className="font-medium">{r.value}</span>{" "}
              <span className="text-xs text-muted-foreground">{r.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
