/**
 * Tarifa de ejemplo, inspirada en las tarifas de alta tensión chilenas con demanda en horas de punta.
 * No es un pliego real: los valores son redondos para que la demo se entienda.
 *
 * - Energía: precio único por kWh, a cualquier hora.
 * - Demanda máxima: se cobra por el kW más alto del mes, a cualquier hora.
 * - Demanda en punta: se cobra por el kW más alto dentro de las horas de punta (días hábiles,
 *   18:00 a 22:00, abril a septiembre). Es el cargo caro: una sola hora mala lo fija para todo el mes.
 */
export const TARIFF = {
  currency: "CLP",
  energyPerKwh: 98,
  maxDemandPerKw: 3_100,
  peakDemandPerKw: 9_800,
  peakHours: [18, 19, 20, 21] as readonly number[],
  peakMonths: [3, 4, 5, 6, 7, 8] as readonly number[], // abril-septiembre (0 = enero)
  contractedKw: 520,
} as const;

/** ¿Esta hora cuenta para la demanda en punta? */
export const isPeakHour = (date: Date, hour: number, workday: boolean) =>
  workday && TARIFF.peakMonths.includes(date.getMonth()) && TARIFF.peakHours.includes(hour);

export interface Bill {
  energyKwh: number;
  energy: number;
  maxKw: number;
  maxDemand: number;
  peakKw: number;
  peakDemand: number;
  total: number;
}

export const bill = (energyKwh: number, maxKw: number, peakKw: number): Bill => {
  const energy = energyKwh * TARIFF.energyPerKwh;
  const maxDemand = maxKw * TARIFF.maxDemandPerKw;
  const peakDemand = peakKw * TARIFF.peakDemandPerKw;
  return { energyKwh, energy, maxKw, maxDemand, peakKw, peakDemand, total: energy + maxDemand + peakDemand };
};
