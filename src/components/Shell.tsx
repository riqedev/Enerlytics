import type { ReactNode } from "react";
import { CalendarDays, ChartColumn, Download, LayoutDashboard, Receipt, SlidersHorizontal, TriangleAlert } from "lucide-react";
import type { Route } from "@/lib/route";
import { ANOMALIES, BASE, MONTH } from "@/lib/data";
import { download, monthCsv } from "@/lib/csv";
import { fmtMonth } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const NAV: { route: Route; icon: typeof LayoutDashboard }[] = [
  { route: "overview", icon: LayoutDashboard },
  { route: "load", icon: ChartColumn },
  { route: "anomalies", icon: TriangleAlert },
  { route: "simulator", icon: SlidersHorizontal },
  { route: "tariff", icon: Receipt },
];

const exportCsv = () =>
  download(`enerlytics-${MONTH.year}-${String(MONTH.month + 1).padStart(2, "0")}.csv`, monthCsv(MONTH, BASE));

function NavLink({ route, icon: Icon, active, compact }: { route: Route; icon: typeof LayoutDashboard; active: boolean; compact?: boolean }) {
  const t = useT();
  return (
    <a
      href={`#/${route}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-lg text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        compact ? "px-3 py-1.5" : "px-3 py-2",
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <Icon size={16} aria-hidden="true" className="shrink-0" />
      {t.nav[route]}
      {route === "anomalies" && ANOMALIES.length > 0 && (
        <span className="ml-auto rounded-full bg-foreground/10 px-1.5 text-xs tabular-nums">{ANOMALIES.length}</span>
      )}
    </a>
  );
}

function LocaleToggle() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "es" ? "en" : "es")}
      aria-label={t.switchTo}
      className="osd pressable h-8 rounded-md px-2.5 text-[11px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {locale.toUpperCase()}
    </button>
  );
}

const Brand = () => {
  const t = useT();
  return (
    <div className="flex flex-col">
      <span className="text-base font-semibold tracking-tight">Enerlytics</span>
      <span className="text-xs text-muted-foreground">{t.plant}</span>
    </div>
  );
};

/** Estructura estándar de dashboard: barra lateral de secciones + barra superior con período y acciones. */
export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const t = useT();
  const { locale } = useLocale();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-border bg-card/40 px-4 py-6 lg:flex">
        <div className="px-3">
          <Brand />
        </div>
        <nav aria-label={t.mainNav} className="flex flex-col gap-0.5">
          {NAV.map((n) => (
            <NavLink key={n.route} {...n} active={route === n.route} />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-3 text-xs text-muted-foreground">
          <span className="osd w-fit rounded-xs border border-border px-1.5 py-px text-[10px] text-hud">{t.simulated}</span>
          <p className="leading-relaxed">{t.footer}</p>
          <div className="flex items-center justify-between">
            <span>
              {t.by}{" "}
              <a href="https://riqedev.github.io" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
                riqedev
              </a>
            </span>
            <LocaleToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Cabecera móvil: marca + pestañas desplazables */}
        <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 pt-3">
            <Brand />
            <LocaleToggle />
          </div>
          <nav aria-label={t.mainNav} className="flex gap-1 overflow-x-auto px-3 py-2.5">
            {NAV.map((n) => (
              <NavLink key={n.route} {...n} active={route === n.route} compact />
            ))}
          </nav>
        </div>

        {/* Barra superior: título de la sección, período y acciones */}
        <header className="flex flex-wrap items-end justify-between gap-4 px-4 pt-6 sm:px-8 sm:pt-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{t.nav[route]}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.pageHint[route]}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm" aria-label={t.period}>
              <CalendarDays size={15} aria-hidden="true" className="text-muted-foreground" />
              {fmtMonth(locale, MONTH.year, MONTH.month)}
            </span>
            <button
              type="button"
              onClick={exportCsv}
              className="pressable flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Download size={15} aria-hidden="true" />
              <span className="hidden sm:inline">{t.exportCsv}</span>
              <span className="sm:hidden">CSV</span>
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-8 sm:py-8">{children}</main>

        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-8 lg:hidden">
          {t.footer}{" "}
          <span>
            {t.by}{" "}
            <a href="https://riqedev.github.io" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4">
              riqedev
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}
