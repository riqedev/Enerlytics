import type { Process } from "./analysis.ts";
import type { Copy } from "./i18n.ts";

export type PresetId = keyof Copy["presetsList"] | "custom";

export const PRESETS: Record<Exclude<PresetId, "custom">, Process> = {
  compressor: { kw: 90, hours: 4 },
  oven: { kw: 150, hours: 2 },
  ev: { kw: 60, hours: 5 },
};
