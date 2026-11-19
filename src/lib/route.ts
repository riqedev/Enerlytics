import { useEffect, useState } from "react";

export const ROUTES = ["overview", "load", "anomalies", "simulator", "tariff"] as const;
export type Route = (typeof ROUTES)[number];

/** Rutas por hash (#/load): enlaces compartibles sin configurar rewrites en el hosting. */
const read = (): Route => {
  const slug = location.hash.replace(/^#\/?/, "");
  return (ROUTES as readonly string[]).includes(slug) ? (slug as Route) : "overview";
};

export function useRoute() {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export const go = (r: Route) => {
  location.hash = `/${r}`;
};
