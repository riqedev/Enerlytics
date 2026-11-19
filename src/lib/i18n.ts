import { createContext, useContext } from "react";

export type Locale = "es" | "en";
export const LOCALE_STORAGE_KEY = "enerlytics-locale";

export const detectLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
  } catch {
    // Storage bloqueado: idioma del navegador.
  }
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
};

const es = {
  plant: "Planta demo",
  simulated: "Datos simulados",
  exportCsv: "Exportar CSV",
  switchTo: "Switch to English",

  energy: "Energía",
  cost: "Costo estimado",
  maxDemand: "Demanda máxima",
  peakDemand: "Demanda en punta",
  loadFactor: "Factor de carga",
  ofLimit: (kw: string) => `del límite de ${kw}`,
  energyShare: "energía",
  demandShare: "demanda",
  loadFactorHint: "promedio ÷ máxima",
  peakHint: "días hábiles, 18:00–22:00",

  month: "Consumo del mes",
  monthHint: "Cada fila es un día y cada celda una hora. Elige un día para verlo en detalle.",
  low: "Bajo",
  high: "Alto",
  holiday: "Feriado",
  anomalyMark: "Anomalía",
  peakBand: "Punta",

  day: "Detalle del día",
  actual: "Consumo",
  expected: "Esperado",
  process: "Proceso simulado",
  limit: "Límite contratado",
  hourCol: "Hora",

  sim: "Simulador de carga",
  simHint: "Suma un proceso al día elegido y mira cuánto cambia la cuenta del mes según la hora en que lo corras.",
  simNote: "Se calcula sobre el mes sin anomalías, para ver el costo de un mes normal.",
  presets: "Proceso",
  custom: "Personalizado",
  power: "Potencia",
  duration: "Duración",
  start: "Inicio",
  best: "Usar el mejor horario",
  costByStart: "Costo extra del mes según la hora de inicio",
  extraCost: "Costo extra del mes",
  energyPart: "Energía",
  demandPart: "Demanda",
  dayMax: "Máximo del día",
  overLimit: "Pasa el límite contratado",
  withinLimit: "Dentro del límite",
  vsBest: "más que el mejor horario",
  isBest: "Es el mejor horario para este día",

  anomalies: "Anomalías",
  anomaliesHint: "Horas que se salen de lo normal para ese tipo de día, ordenadas por lo que costaron.",
  above: "Consumo sobre lo esperado",
  below: "Consumo bajo lo esperado",
  setsPeak: "Fijó la demanda en punta del mes",
  setsMax: "Fijó la demanda máxima del mes",
  impact: "Impacto en la cuenta",
  saved: "Ahorro",
  view: "Ver día",
  none: "No hay anomalías este mes.",

  tariff: "Tarifa de ejemplo",
  tariffHint: "Inspirada en las tarifas de alta tensión con demanda en horas de punta. Valores redondos, no es un pliego real.",
  perKwh: "por kWh",
  perKwMonth: "por kW al mes",
  energyRate: "Energía",
  maxRate: "Demanda máxima",
  peakRate: "Demanda en punta",
  peakRule: "Hábiles 18:00–22:00, abr–sep",

  presetsList: {
    compressor: "Compresor",
    oven: "Horno de secado",
    ev: "Carga de flota eléctrica",
  },
  footer: "Mes simulado con semilla fija: los datos son los mismos en cada visita.",
  by: "Hecho por",
  table: "Ver como tabla",
  hideTable: "Ocultar tabla",
};

const en: typeof es = {
  plant: "Demo plant",
  simulated: "Simulated data",
  exportCsv: "Export CSV",
  switchTo: "Cambiar a español",

  energy: "Energy",
  cost: "Estimated cost",
  maxDemand: "Max demand",
  peakDemand: "Peak-hour demand",
  loadFactor: "Load factor",
  ofLimit: (kw: string) => `of the ${kw} limit`,
  energyShare: "energy",
  demandShare: "demand",
  loadFactorHint: "average ÷ max",
  peakHint: "workdays, 18:00–22:00",

  month: "Monthly load",
  monthHint: "Each row is a day and each cell an hour. Pick a day to see it in detail.",
  low: "Low",
  high: "High",
  holiday: "Holiday",
  anomalyMark: "Anomaly",
  peakBand: "Peak",

  day: "Day detail",
  actual: "Load",
  expected: "Expected",
  process: "Simulated process",
  limit: "Contracted limit",
  hourCol: "Hour",

  sim: "Load simulator",
  simHint: "Add a process to the selected day and see how the monthly bill changes depending on when you run it.",
  simNote: "Computed on the month without anomalies, to show the cost in a normal month.",
  presets: "Process",
  custom: "Custom",
  power: "Power",
  duration: "Duration",
  start: "Start",
  best: "Use the best time",
  costByStart: "Extra monthly cost by start time",
  extraCost: "Extra monthly cost",
  energyPart: "Energy",
  demandPart: "Demand",
  dayMax: "Day max",
  overLimit: "Exceeds the contracted limit",
  withinLimit: "Within the limit",
  vsBest: "more than the best time",
  isBest: "This is the best time for this day",

  anomalies: "Anomalies",
  anomaliesHint: "Hours outside the normal range for that type of day, sorted by what they cost.",
  above: "Load above expected",
  below: "Load below expected",
  setsPeak: "Set the month's peak-hour demand",
  setsMax: "Set the month's max demand",
  impact: "Impact on the bill",
  saved: "Savings",
  view: "View day",
  none: "No anomalies this month.",

  tariff: "Example tariff",
  tariffHint: "Inspired by high-voltage tariffs with a peak-hour demand charge. Round numbers, not a real rate sheet.",
  perKwh: "per kWh",
  perKwMonth: "per kW per month",
  energyRate: "Energy",
  maxRate: "Max demand",
  peakRate: "Peak-hour demand",
  peakRule: "Workdays 18:00–22:00, Apr–Sep",

  presetsList: {
    compressor: "Compressor",
    oven: "Drying oven",
    ev: "EV fleet charging",
  },
  footer: "Month simulated with a fixed seed: the data is the same on every visit.",
  by: "Made by",
  table: "View as table",
  hideTable: "Hide table",
};

export type Copy = typeof es;
export const COPY: Record<Locale, Copy> = { es, en };

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const LocaleContext = createContext<LocaleState>({ locale: "es", setLocale: () => {} });
export const useLocale = () => useContext(LocaleContext);
export const useT = () => COPY[useLocale().locale];
