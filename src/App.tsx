import { useCallback, useEffect, useState } from "react";
import { ANOMALIES } from "@/lib/data";
import { go, useRoute } from "@/lib/route";
import { LOCALE_STORAGE_KEY, LocaleContext, detectLocale, type Locale } from "@/lib/i18n";
import { Shell } from "@/components/Shell";
import { Overview } from "@/pages/Overview";
import { Load } from "@/pages/Load";
import { AnomaliesPage } from "@/pages/AnomaliesPage";
import { SimulatorPage } from "@/pages/SimulatorPage";
import { TariffPage } from "@/pages/TariffPage";

export default function App() {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const route = useRoute();
  // Día de la sección Consumo. Parte en el evento más caro del mes: es lo primero que conviene ver.
  const [day, setDay] = useState(ANOMALIES[0]?.day ?? 0);

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

  const openDay = (d: number) => {
    setDay(d);
    go("load");
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <Shell route={route}>
        {route === "overview" && <Overview onDay={openDay} />}
        {route === "load" && <Load day={day} onDay={setDay} />}
        {route === "anomalies" && <AnomaliesPage onDay={openDay} />}
        {route === "simulator" && <SimulatorPage />}
        {route === "tariff" && <TariffPage />}
      </Shell>
    </LocaleContext.Provider>
  );
}
