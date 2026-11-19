import { buildBaseline, findAnomalies, loadFactor, monthBill, normalizeMonth } from "./analysis.ts";
import { simulateMonth } from "./simulate.ts";

/** El mes es determinista: se calcula una sola vez al cargar la app y lo comparten todas las vistas. */
export const MONTH = simulateMonth();
export const BASE = buildBaseline(MONTH);
export const NORMAL = normalizeMonth(MONTH, BASE);
export const ANOMALIES = findAnomalies(MONTH, BASE);
export const BILL = monthBill(MONTH.days);
export const LOAD_FACTOR = loadFactor(MONTH);

/** Energía del día real y la esperada (suma de lo normal de cada hora). */
export const DAILY = MONTH.days.map((d) => ({
  day: d.index,
  kwh: d.kw.reduce((a, b) => a + b, 0),
  expected: d.kw.reduce((a, _, h) => a + BASE.expected(d, h), 0),
  anomalies: ANOMALIES.filter((a) => a.day === d.index).length,
}));

/** Primer día hábil normal: punto de partida del simulador. */
export const TYPICAL_DAY = MONTH.days.find((d) => d.type === "weekday" && !d.holiday && !ANOMALIES.some((a) => a.day === d.index))!.index;
