import type { Baseline } from "./analysis.ts";
import { isAnomalous } from "./analysis.ts";
import type { Month } from "./simulate.ts";

/** CSV de las 720 horas del mes, con lo esperado y la marca de anomalía. Separador coma, punto decimal. */
export function monthCsv(month: Month, base: Baseline) {
  const rows = ["date,hour,day_type,holiday,kwh,expected_kwh,peak_hour,anomaly"];
  for (const d of month.days) {
    const date = `${month.year}-${String(month.month + 1).padStart(2, "0")}-${String(d.index + 1).padStart(2, "0")}`;
    d.kw.forEach((v, h) =>
      rows.push(
        [date, h, d.type, d.holiday, v.toFixed(1), base.expected(d, h).toFixed(1), d.peak[h], isAnomalous(base, d, h)].join(","),
      ),
    );
  }
  return rows.join("\n") + "\n";
}

export function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
