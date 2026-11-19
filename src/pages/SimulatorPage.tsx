import { useMemo, useState } from "react";
import { bestStart, placements, type Process } from "@/lib/analysis";
import { BASE, NORMAL, TYPICAL_DAY } from "@/lib/data";
import { PRESETS, type PresetId } from "@/lib/presets";
import { useT } from "@/lib/i18n";
import { SimControls, SimOutcome } from "@/components/Simulator";
import { DayChart } from "@/components/DayChart";
import { DayPicker } from "@/components/DayPicker";
import { Card } from "@/components/ui";

/** Simulador: controles a un lado, el día y el resultado al otro. Trabaja sobre el mes sin anomalías. */
export function SimulatorPage() {
  const t = useT();
  const [day, setDay] = useState(TYPICAL_DAY);
  const [preset, setPreset] = useState<PresetId>("compressor");
  const [process, setProcess] = useState<Process>(PRESETS.compressor);
  const options = useMemo(() => placements(NORMAL, day, process), [day, process]);
  const best = useMemo(() => bestStart(options), [options]);
  const [start, setStart] = useState(() => bestStart(placements(NORMAL, TYPICAL_DAY, PRESETS.compressor)).start);
  const safeStart = Math.min(start, 24 - process.hours);

  const choosePreset = (id: PresetId) => {
    setPreset(id);
    if (id !== "custom") setProcess(PRESETS[id]);
  };

  return (
    <div className="grid gap-5 sm:gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <Card title={t.sim} hint={t.simNote} className="xl:self-start">
        <SimControls
          preset={preset}
          process={process}
          start={safeStart}
          onPreset={choosePreset}
          onProcess={setProcess}
          onStart={setStart}
        />
      </Card>

      <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
        <Card title={t.day} action={<DayPicker day={day} onChange={setDay} />}>
          <DayChart day={NORMAL.days[day]} base={BASE} process={process} start={safeStart} />
        </Card>
        <Card title={t.impact}>
          <SimOutcome process={process} start={safeStart} options={options} best={best} onStart={setStart} />
        </Card>
      </div>
    </div>
  );
}
