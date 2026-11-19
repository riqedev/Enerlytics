import { test } from "node:test";
import assert from "node:assert/strict";
import { INJECTED, simulateMonth } from "./simulate.ts";
import { bestStart, buildBaseline, findAnomalies, monthBill, normalizeMonth, placements } from "./analysis.ts";
import { TARIFF } from "./tariff.ts";

const month = simulateMonth();
const base = buildBaseline(month);
const anomalies = findAnomalies(month, base);

test("la simulación es determinista", () => {
  assert.deepEqual(simulateMonth().days[5].kw, month.days[5].kw);
});

test("los eventos plantados caen en el tipo de día que dicen", () => {
  assert.equal(month.days[14 - 1].type, "sunday");
  for (const day of [9, 17, 23]) assert.equal(month.days[day - 1].type, "weekday");
  assert.ok(month.days[29 - 1].holiday);
});

test("detecta cada evento plantado", () => {
  for (const e of INJECTED) {
    const hit = anomalies.find((a) => a.day === e.day - 1 && a.from < e.to && a.to > e.from);
    assert.ok(hit, `evento del día ${e.day} no detectado`);
    assert.equal(hit.direction, e.delta > 0 ? "above" : "below");
  }
});

test("casi sin falsos positivos", () => {
  const injected = (a: (typeof anomalies)[number]) =>
    INJECTED.some((e) => a.day === e.day - 1 && a.from < e.to && a.to > e.from);
  const extra = anomalies.filter((a) => !injected(a));
  assert.ok(extra.length <= 1, `falsos positivos: ${JSON.stringify(extra)}`);
});

test("el feriado no se marca como anomalía", () => {
  assert.ok(!anomalies.some((a) => a.day === 29 - 1));
});

test("el pico en punta del 17 fija la demanda en punta del mes", () => {
  const spike = anomalies.find((a) => a.day === 17 - 1)!;
  assert.ok(spike.setsPeak);
  assert.ok(spike.costImpact > 0);
  assert.equal(anomalies[0], spike, "debería ser el evento más caro");
});

test("el simulador evita la punta y el límite", () => {
  const day = month.days.findIndex((d) => d.type === "weekday" && !d.holiday);
  const options = placements(normalizeMonth(month, base), day, { kw: 120, hours: 3 });
  const best = bestStart(options);
  const peakStart = options[18];
  assert.ok(!best.overLimit);
  assert.ok(best.cost * 10 < peakStart.cost, "correrlo en punta debería costar mucho más");
  assert.ok(best.start + 3 <= 18 || best.start >= 22, `mejor inicio ${best.start} toca la punta`);
});

test("la cuenta suma sus partes", () => {
  const b = monthBill(month.days);
  assert.equal(b.total, b.energy + b.maxDemand + b.peakDemand);
  const over = month.days.flatMap((d) => d.kw.map((v, h) => ({ day: d.index + 1, h, v }))).filter((x) => x.v > TARIFF.contractedKw);
  assert.deepEqual(over.map((x) => [x.day, x.h]), [[17, 19]], "solo el pico del 17 debería pasar el límite contratado");
});
