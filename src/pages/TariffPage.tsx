import { TARIFF } from "@/lib/tariff";
import { fmtNumber } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { TariffCard } from "@/components/TariffCard";
import { CostBreakdown } from "@/components/CostBreakdown";
import { Card } from "@/components/ui";

export function TariffPage() {
  const t = useT();
  const { locale } = useLocale();

  return (
    <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
        <TariffCard />
        <Card title={t.howBill}>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{t.howBillBody}</p>
          <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-4 text-sm">
            <span>{t.contracted}</span>
            <span className="font-medium tabular-nums">{fmtNumber(locale, TARIFF.contractedKw)} kW</span>
          </div>
        </Card>
      </div>
      <Card title={`${t.costBreakdown}: ${t.thisMonth.toLowerCase()}`} className="lg:self-start">
        <CostBreakdown />
      </Card>
    </div>
  );
}
