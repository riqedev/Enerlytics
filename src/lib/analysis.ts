import type { Day, Month } from "./simulate.ts";
import { TARIFF, bill, type Bill } from "./tariff.ts";

/* ---------- Línea base: lo "normal" para cada hora según el tipo de día ---------- */

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Un feriado se compara con los domingos: es lo que la planta hace un día sin producción. */
const baselineKey = (d: Day) => (d.holiday ? "sunday" : d.type);

export interface Baseline {
  expected: (day: Day, hour: number) => number;
  spread: (day: Day, hour: number) => number;
}

/**
 * Mediana y MAD por (tipo de día, hora). Son estadísticos robustos: un evento raro en la muestra no
 * mueve la referencia, cosa que sí pasaría con promedio y desviación estándar.
 */
export function buildBaseline(month: Month): Baseline {
  const groups = new Map<string, number[][]>();
  for (const d of month.days) {
    if (d.holiday) continue;
    const key = baselineKey(d);
    if (!groups.has(key)) groups.set(key, Array.from({ length: 24 }, () => []));
    d.kw.forEach((v, h) => groups.get(key)![h].push(v));
  }
  const med = new Map<string, number[]>();
  const mad = new Map<string, number[]>();
  for (const [key, hours] of groups) {
    const m = hours.map(median);
    med.set(key, m);
    mad.set(key, hours.map((xs, h) => median(xs.map((x) => Math.abs(x - m[h])))));
  }
  return {
    expected: (d, h) => med.get(baselineKey(d))![h],
    // 1.4826 · MAD ≈ desviación estándar en datos normales. Con pocas muestras (4 sábados) el MAD puede
    // salir casi cero, así que se pone un piso relativo y uno absoluto.
    spread: (d, h) => {
      const e = med.get(baselineKey(d))![h];
      return Math.max(1.4826 * mad.get(baselineKey(d))![h], e * 0.05, 8);
    },
  };
}

/* ---------- Anomalías ---------- */

export interface Anomaly {
  day: number;
  from: number;
  /** Exclusivo. */
  to: number;
  direction: "above" | "below";
  /** kWh fuera de lo esperado (positivo = consumo extra). */
  extraKwh: number;
  maxDeviationKw: number;
  /** Cuánto sube la cuenta del mes por este evento (energía + demandas que fijó). */
  costImpact: number;
  /** El evento fijó la demanda en punta o la máxima del mes. */
  setsPeak: boolean;
  setsMax: boolean;
}

const Z = 3.5;
const MIN_KW = 25;

export function isAnomalous(base: Baseline, d: Day, h: number) {
  const r = d.kw[h] - base.expected(d, h);
  return Math.abs(r) > Z * base.spread(d, h) && Math.abs(r) > MIN_KW;
}

export function findAnomalies(month: Month, base: Baseline): Anomaly[] {
  const out: Anomaly[] = [];
  const full = monthBill(month.days);

  for (const d of month.days) {
    let h = 0;
    while (h < 24) {
      if (!isAnomalous(base, d, h)) {
        h++;
        continue;
      }
      const direction = d.kw[h] > base.expected(d, h) ? "above" : "below";
      const from = h;
      while (
        h < 24 &&
        isAnomalous(base, d, h) &&
        (d.kw[h] > base.expected(d, h) ? "above" : "below") === direction
      )
        h++;

      let extraKwh = 0;
      let maxDeviationKw = 0;
      for (let i = from; i < h; i++) {
        const dev = d.kw[i] - base.expected(d, i);
        extraKwh += dev;
        if (Math.abs(dev) > Math.abs(maxDeviationKw)) maxDeviationKw = dev;
      }

      // Impacto = cuenta real − cuenta si esas horas hubieran sido normales.
      const fixed = month.days.map((x) =>
        x.index !== d.index ? x : { ...x, kw: x.kw.map((v, i) => (i >= from && i < h ? base.expected(x, i) : v)) },
      );
      const without = monthBill(fixed);
      out.push({
        day: d.index,
        from,
        to: h,
        direction,
        extraKwh,
        maxDeviationKw,
        costImpact: full.total - without.total,
        setsPeak: full.peakKw - without.peakKw > 0.5,
        setsMax: full.maxKw - without.maxKw > 0.5,
      });
    }
  }
  // Lo que más cuesta primero.
  return out.sort((a, b) => Math.abs(b.costImpact) - Math.abs(a.costImpact));
}

/* ---------- Cuenta del mes ---------- */

export function monthBill(days: Pick<Day, "kw" | "peak">[]): Bill {
  let energy = 0;
  let max = 0;
  let peak = 0;
  for (const d of days)
    d.kw.forEach((v, h) => {
      energy += v;
      if (v > max) max = v;
      if (d.peak[h] && v > peak) peak = v;
    });
  return bill(energy, max, peak);
}

/* ---------- Simulador de carga ---------- */

/**
 * El mes "normal": cada hora anómala se reemplaza por lo esperado. El simulador planifica sobre esto,
 * porque la pregunta es cuánto cuesta sumar un proceso a un mes típico; si usara el mes real, el pico
 * accidental del 17 ya habría fijado la demanda en punta y cualquier horario parecería gratis.
 */
export function normalizeMonth(month: Month, base: Baseline): Month {
  return {
    ...month,
    days: month.days.map((d) => ({
      ...d,
      kw: d.kw.map((v, h) => (isAnomalous(base, d, h) ? base.expected(d, h) : v)),
    })),
  };
}

export interface Process {
  kw: number;
  hours: number;
}

export interface Placement {
  start: number;
  /** Costo adicional en el mes de correr el proceso a esa hora. */
  cost: number;
  energyCost: number;
  demandCost: number;
  newMaxKw: number;
  newPeakKw: number;
  /** Hora más cargada del día con el proceso. */
  dayMaxKw: number;
  overLimit: boolean;
}

export function place(month: Month, dayIndex: number, p: Process, start: number): Placement {
  const before = monthBill(month.days);
  const days = month.days.map((d) =>
    d.index !== dayIndex ? d : { ...d, kw: d.kw.map((v, h) => (h >= start && h < start + p.hours ? v + p.kw : v)) },
  );
  const after = monthBill(days);
  const dayMaxKw = Math.max(...days[dayIndex].kw);
  return {
    start,
    cost: after.total - before.total,
    energyCost: after.energy - before.energy,
    demandCost: after.maxDemand + after.peakDemand - (before.maxDemand + before.peakDemand),
    newMaxKw: after.maxKw,
    newPeakKw: after.peakKw,
    dayMaxKw,
    overLimit: dayMaxKw > TARIFF.contractedKw,
  };
}

/** Todas las horas de inicio posibles para el proceso ese día (sin cruzar la medianoche). */
export const placements = (month: Month, dayIndex: number, p: Process) =>
  Array.from({ length: 25 - p.hours }, (_, start) => place(month, dayIndex, p, start));

/**
 * Mejor inicio: el más barato que no pase el límite contratado. Entre empates (pasa seguido fuera de
 * punta, donde solo se paga la energía) gana el que deja más holgura bajo el límite.
 */
export function bestStart(options: Placement[]): Placement {
  const ok = options.filter((o) => !o.overLimit);
  const pool = ok.length ? ok : options;
  return pool.reduce((best, o) =>
    o.cost < best.cost - 1 || (Math.abs(o.cost - best.cost) <= 1 && o.dayMaxKw < best.dayMaxKw) ? o : best,
  );
}

/* ---------- Indicadores ---------- */

export function loadFactor(month: Month) {
  const b = monthBill(month.days);
  const hours = month.days.length * 24;
  return b.energyKwh / hours / b.maxKw;
}
