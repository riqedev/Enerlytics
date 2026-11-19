# Enerlytics

Dashboard de energía de una planta industrial simulada. Responde tres preguntas: **cuánto se consumió y cuánto costó**, **qué horas se salieron de lo normal** y **a qué hora conviene correr un proceso nuevo**.

## Secciones

Estructura estándar de dashboard: barra lateral con secciones, barra superior con período y exportación.

- **Resumen:** indicadores del mes, energía diaria contra lo esperado, desglose del costo y las anomalías que más costaron.
- **Consumo:** detalle por hora del día elegido y mapa de calor del mes como selector.
- **Anomalías:** tabla de eventos con desviación, energía, impacto en la cuenta y efecto en la demanda.
- **Simulador:** proceso, día y hora de inicio; costo extra del mes para cada horario.
- **Tarifa:** cargos de la tarifa de ejemplo y cómo se arma la cuenta.

## Qué hace

- **Mes simulado y reproducible:** 30 días de consumo por hora de una planta con dos turnos, sábado corto, domingo de carga base y un feriado. Se genera con una semilla fija (PRNG `mulberry32`), así que los datos son los mismos en cada visita. Trae cuatro eventos plantados a propósito para que la detección tenga algo real que encontrar.
- **Costo con demanda en punta:** tarifa de ejemplo con energía por kWh, cargo por demanda máxima y cargo por demanda en horas de punta (días hábiles 18:00–22:00, abril a septiembre). Una sola hora mala en punta fija ese cargo para todo el mes, y el dashboard lo muestra.
- **Detección de anomalías:** cada hora se compara con la mediana de esa hora para ese tipo de día (hábil, sábado, domingo; los feriados como domingo), con una escala robusta basada en MAD. Las horas seguidas se agrupan en eventos y cada evento muestra cuánto subió la cuenta del mes y si fijó la demanda en punta o la máxima.
- **Simulador de carga:** eliges un proceso (o defines potencia y duración), lo mueves por el día y ves el costo extra del mes para cada hora de inicio. "Usar el mejor horario" elige el más barato que no pase el límite contratado. Se calcula sobre el mes sin anomalías, para que el pico accidental no esconda el costo real de un mes normal.
- Mapa de calor del mes, detalle por hora con vista de tabla, exportación a CSV (720 filas con lo esperado y la marca de anomalía) y español e inglés.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · gráficos en SVG propio (sin librería de charts)

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # node --test: simulación, detección, simulador y cuenta
npm run build    # tsc + vite build → dist/
npm run lint
```

La lógica vive en `src/lib/` sin dependencias de React (`simulate.ts`, `tariff.ts`, `analysis.ts`), así que se prueba directo con el runner de Node.
