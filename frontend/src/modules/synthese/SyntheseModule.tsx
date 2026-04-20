import { Card } from "../../components/Card";
import { PhaseHeader } from "../../components/PhaseHeader";
import { modules } from "../registry";
import type { ModuleProps } from "../registry";

export function SyntheseModule({ allData }: ModuleProps<unknown>) {
  const dataModules = modules.filter((m) => m.id !== "synthese" && m.SummaryBlock);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PhaseHeader
        phaseNum="06"
        title="Synthese"
        subtitle="Alles zusammen — dein Kompass in einem Blick."
      />

      {dataModules.map((m) => {
        const data = allData?.[m.id];
        const Summary = m.SummaryBlock!;
        return (
          <Card key={m.id} className="mb-6">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-ink-faint text-xs tracking-[0.2em] uppercase">
                Phase {m.phaseNum}
              </span>
              <h2 className="display text-2xl text-ink">{m.title}</h2>
            </div>
            <Summary data={data} allData={allData} />
          </Card>
        );
      })}
    </div>
  );
}
