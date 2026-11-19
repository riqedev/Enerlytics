import { ArrowDownRight, ArrowUpRight, CircleAlert } from "lucide-react";
import { ANOMALIES, MONTH } from "@/lib/data";
import { fmtDay, fmtNumber, fmtRange, fmtSignedClp } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { Card } from "@/components/ui";

const th = "px-4 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap";
const td = "px-4 py-3 align-top whitespace-nowrap";

/** Anomalías: tabla estándar, una fila por evento, ordenada por impacto. Click = ver el día. */
export function AnomaliesPage({ onDay }: { onDay: (d: number) => void }) {
  const t = useT();
  const { locale } = useLocale();
  const net = ANOMALIES.reduce((a, x) => a + x.costImpact, 0);

  return (
    <Card
      title={t.events(ANOMALIES.length)}
      action={
        <div className="shrink-0 text-right">
          <div className="text-xs text-muted-foreground">{t.netImpact}</div>
          <div className="text-lg font-semibold tabular-nums">{fmtSignedClp(locale, net, true)}</div>
        </div>
      }
    >
      {ANOMALIES.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.none}</p>
      ) : (
        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full text-sm tabular-nums">
            <thead className="border-y border-border bg-muted/40">
              <tr>
                <th className={th}>{t.colDate}</th>
                <th className={th}>{t.colHours}</th>
                <th className={th}>{t.colType}</th>
                <th className={`${th} text-right`}>{t.colDeviation}</th>
                <th className={`${th} text-right`}>{t.colEnergy}</th>
                <th className={`${th} text-right`}>{t.colImpact}</th>
                <th className={th}>{t.colFlags}</th>
              </tr>
            </thead>
            <tbody>
              {ANOMALIES.map((a) => {
                const above = a.direction === "above";
                const Icon = above ? ArrowUpRight : ArrowDownRight;
                return (
                  <tr
                    key={`${a.day}-${a.from}`}
                    onClick={() => onDay(a.day)}
                    className="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/40"
                  >
                    <td className={td}>
                      <button
                        type="button"
                        onClick={() => onDay(a.day)}
                        className="font-medium underline decoration-foreground/0 underline-offset-4 outline-none hover:decoration-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/60"
                      >
                        {fmtDay(locale, MONTH.days[a.day].date, "long")}
                      </button>
                    </td>
                    <td className={td}>{fmtRange(a.from, a.to)}</td>
                    <td className={td}>
                      <span className="flex items-center gap-1.5">
                        <Icon size={15} aria-hidden="true" className="text-muted-foreground" />
                        {above ? t.higher : t.lower}
                      </span>
                    </td>
                    <td className={`${td} text-right`}>
                      {a.maxDeviationKw > 0 ? "+" : ""}
                      {fmtNumber(locale, a.maxDeviationKw)} kW
                    </td>
                    <td className={`${td} text-right`}>
                      {a.extraKwh > 0 ? "+" : ""}
                      {fmtNumber(locale, a.extraKwh)} kWh
                    </td>
                    <td className={`${td} text-right font-semibold`}>{fmtSignedClp(locale, a.costImpact, true)}</td>
                    <td className={td}>
                      {a.setsPeak || a.setsMax ? (
                        <span className="flex flex-col gap-1 text-xs">
                          {a.setsPeak && (
                            <span className="flex items-center gap-1.5">
                              <CircleAlert size={13} aria-hidden="true" className="text-status-critical" />
                              {t.setsPeak}
                            </span>
                          )}
                          {a.setsMax && (
                            <span className="flex items-center gap-1.5">
                              <CircleAlert size={13} aria-hidden="true" className="text-status-critical" />
                              {t.setsMax}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
