import { gaussian, mulberry32 } from "./random.ts";
import { isPeakHour } from "./tariff.ts";

export type DayType = "weekday" | "saturday" | "sunday";

export interface Day {
  index: number;
  date: Date;
  type: DayType;
  holiday: boolean;
  /** Consumo de cada hora en kWh (= demanda media de esa hora en kW). */
  kw: number[];
  /** Qué horas cuentan para la demanda en punta. */
  peak: boolean[];
}

export interface Month {
  year: number;
  month: number;
  days: Day[];
}

/** Junio 2026: invierno, así que aplica la demanda en punta. El 29 es feriado (San Pedro y San Pablo). */
export const DEMO = { year: 2026, month: 5, seed: 20260601, holidays: [29] };

const dayType = (d: Date): DayType => (d.getDay() === 0 ? "sunday" : d.getDay() === 6 ? "saturday" : "weekday");

/**
 * Perfil de una planta con dos turnos de lunes a viernes (07:00-23:00), un turno corto el sábado y
 * solo carga base el domingo (frío, servidores, iluminación de seguridad).
 */
function profile(type: DayType, holiday: boolean, hour: number) {
  const base = 140;
  if (type === "sunday" || holiday) return base + (hour >= 9 && hour < 18 ? 12 : 0);

  if (type === "saturday") {
    if (hour === 7) return base + 90;
    if (hour > 7 && hour < 15) return base + 170;
    if (hour === 15) return base + 60;
    return base;
  }

  // Día hábil
  const heating = hour >= 6 && hour < 10 ? 22 : 0;
  if (hour < 6 || hour === 23) return base + (hour === 23 ? 40 : 0);
  if (hour === 6) return base + 70 + heating;
  let production = 270;
  if (hour === 7) production = 200;
  if (hour === 13) production = 190; // colación
  if (hour === 15) production = 235; // cambio de turno
  if (hour === 22) production = 150;
  // La tarde trae algo más de iluminación y climatización.
  if (hour >= 18 && hour <= 21) production += 18;
  return base + production + heating;
}

export interface InjectedEvent {
  day: number;
  from: number;
  to: number;
  delta: number;
}

/**
 * Eventos plantados a propósito para que la detección tenga algo real que encontrar.
 * `delta` en kW, `to` exclusivo. Días con base 1.
 */
export const INJECTED: InjectedEvent[] = [
  { day: 9, from: 0, to: 6, delta: 85 }, // compresor que quedó encendido toda la noche
  { day: 17, from: 19, to: 20, delta: 175 }, // arranque simultáneo de dos líneas en hora punta
  { day: 23, from: 10, to: 13, delta: -230 }, // detención de producción
  { day: 14, from: 9, to: 15, delta: 120 }, // carga inesperada un domingo
];

export function simulateMonth({ year, month, seed, holidays } = DEMO): Month {
  const rand = mulberry32(seed);
  const days: Day[] = [];
  const count = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < count; i++) {
    const date = new Date(year, month, i + 1);
    const type = dayType(date);
    const holiday = holidays.includes(i + 1);
    const level = 1 + gaussian(rand) * 0.025; // días algo más o menos cargados
    const kw: number[] = [];
    const peak: boolean[] = [];

    for (let h = 0; h < 24; h++) {
      let v = profile(type, holiday, h) * level * (1 + gaussian(rand) * 0.035);
      for (const e of INJECTED) if (e.day === i + 1 && h >= e.from && h < e.to) v += e.delta;
      kw.push(Math.max(0, Math.round(v * 10) / 10));
      peak.push(isPeakHour(date, h, type === "weekday" && !holiday));
    }
    days.push({ index: i, date, type, holiday, kw, peak });
  }
  return { year, month, days };
}
