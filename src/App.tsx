import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  bestStart,
  buildBaseline,
  findAnomalies,
  loadFactor,
  monthBill,
  normalizeMonth,
  placements,
  type Process,
} from "@/lib/analysis";
import { simulateMonth } from "@/lib/simulate";
import { download, monthCsv } from "@/lib/csv";
import { fmtDay, fmtMonth } from "@/lib/format";
import { COPY, LOCALE_STORAGE_KEY, LocaleContext, detectLocale, type Locale } from "@/lib/i18n";
import { Kpis } from "@/components/Kpis";
import { Heatmap } from "@/components/Heatmap";
import { DayChart } from "@/components/DayChart";
import { Simulator } from "@/components/Simulator";
import { PRESETS, type PresetId } from "@/lib/presets";
import { Anomalies } from "@/components/Anomalies";
import { TariffCard } from "@/components/TariffCard";
import { Card } from "@/components/ui";

// El mes es determinista: se calcula una vez al cargar el módulo.
const MONTH = simulateMonth();
const BASE = buildBaseline(MONTH);
const NORMAL = normalizeMonth(MONTH, BASE);
const ANOMALIES = findAnomalies(MONTH, BASE);
const BILL = monthBill(MONTH.days);
const LOAD_FACTOR = loadFactor(MONTH);
/** Se abre en el día del pico en punta: es lo primero que conviene ver. */
const FIRST_DAY = ANOMALIES[0]?.day ?? 0;

export default function App() {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const t = COPY[locale];
  const [day, setDay] = useState(FIRST_DAY);
  const [preset, setPreset] = useState<PresetId>("compressor");
  const [process, setProcess] = useState<Process>(PRESETS.compressor);
  const dayCard = useRef<HTMLDivElement>(null);

  const options = useMemo(() => placements(NORMAL, day, process), [day, process]);
  const best = useMemo(() => bestStart(options), [options]);
  const [start, setStart] = useState(() => bestStart(placements(NORMAL, FIRST_DAY, PRESETS.compressor)).start);
  const safeStart = Math.min(start, 24 - process.hours);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Sin storage: vale para esta visita.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const choosePreset = (id: PresetId) => {
    setPreset(id);
    if (id !== "custom") setProcess(PRESETS[id]);
  };

  const viewDay = (d: number) => {
    setDay(d);
    dayCard.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exportCsv = () =>
    download(`enerlytics-${MONTH.year}-${String(MONTH.month + 1).padStart(2, "0")}.csv`, monthCsv(MONTH, BASE));

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <div className="mx-auto flex min-h-dvh max-w-[90rem] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Enerlytics</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{t.plant}</span>
              <span>{fmtMonth(locale, MONTH.year, MONTH.month)}</span>
              <span className="osd rounded-xs border border-border px-1.5 py-px text-[10px] text-hud">{t.simulated}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={exportCsv}
              className="pressable flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Download size={15} aria-hidden="true" />
              {t.exportCsv}
            </button>
            <button
              type="button"
              onClick={() => setLocale(locale === "es" ? "en" : "es")}
              aria-label={t.switchTo}
              className="osd pressable h-9 rounded-lg px-3 text-[11px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {locale.toUpperCase()}
            </button>
          </div>
        </header>

        <Kpis bill={BILL} loadFactor={LOAD_FACTOR} />

        <div className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
            <Heatmap month={MONTH} base={BASE} selected={day} onSelect={setDay} />

            <div ref={dayCard} className="scroll-mt-6">
              <Card title={`${t.day}: ${fmtDay(locale, MONTH.days[day].date, "long")}`}>
                <DayChart day={MONTH.days[day]} base={BASE} process={process} start={safeStart} />
                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="text-base font-semibold tracking-tight">{t.sim}</h3>
                  <p className="mt-1 mb-5 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                    {t.simHint} {t.simNote}
                  </p>
                  <Simulator
                    preset={preset}
                    process={process}
                    start={safeStart}
                    options={options}
                    best={best}
                    onPreset={choosePreset}
                    onProcess={setProcess}
                    onStart={setStart}
                  />
                </div>
              </Card>
            </div>
          </div>

          <aside className="flex min-w-0 flex-col gap-5 sm:gap-6">
            <Anomalies month={MONTH} anomalies={ANOMALIES} selected={day} onView={viewDay} />
            <TariffCard />
          </aside>
        </div>

        <footer className="mt-auto flex flex-col gap-1 pt-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>{t.footer}</span>
          <span>
            {t.by}{" "}
            <a
              href="https://riqedev.github.io"
              className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
            >
              riqedev
            </a>
          </span>
        </footer>
      </div>
    </LocaleContext.Provider>
  );
}
