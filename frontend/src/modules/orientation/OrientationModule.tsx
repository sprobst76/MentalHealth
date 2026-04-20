import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { PhaseHeader } from "../../components/PhaseHeader";
import type { ModuleProps } from "../registry";
import { DOMAINS, ITEMS, SCALE_LABELS } from "./constants";
import { calcProfile, orientationLabel, orientationScore } from "./scoring";
import type { DomainId, ItemResponse, OrientationData } from "./types";

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 bg-paper-3 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-accent rounded-full transition-all duration-500"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

function RatingRow({
  rating,
  scaleType,
  onRate,
}: {
  rating: number | undefined;
  scaleType: string;
  onRate: (r: number) => void;
}) {
  const labels = SCALE_LABELS[scaleType] ?? SCALE_LABELS.agreement;
  return (
    <div className="mt-3">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            className={`flex-1 py-2 rounded-sm border text-sm transition-colors ${
              rating === n
                ? "bg-ink text-paper border-ink"
                : "border-line text-ink-soft hover:border-ink-soft hover:bg-paper-2"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs text-ink-faint">
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
    </div>
  );
}

export function OrientationModule({ data, onChange }: ModuleProps<OrientationData>) {
  const [activeDomain, setActiveDomain] = useState<DomainId | null>(null);

  const rMap = useMemo(
    () => new Map(data.responses.map((r) => [r.item_id, r.rating])),
    [data.responses],
  );

  const profile = useMemo(() => calcProfile(data.responses), [data.responses]);

  function rate(itemId: string, rating: number) {
    const existing = data.responses.find((r) => r.item_id === itemId);
    let next: ItemResponse[];
    if (existing) {
      next = data.responses.map((r) =>
        r.item_id === itemId ? { ...r, rating } : r,
      );
    } else {
      next = [...data.responses, { item_id: itemId, rating }];
    }
    onChange({ ...data, responses: next });
  }

  if (activeDomain) {
    const domain = DOMAINS.find((d) => d.id === activeDomain)!;
    const items = ITEMS.filter((i) => i.domain === activeDomain);
    const domainScore = profile.domains.find((d) => d.id === activeDomain);

    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          type="button"
          onClick={() => setActiveDomain(null)}
          className="text-ink-faint text-sm mb-6 hover:text-ink transition-colors"
        >
          Zur Übersicht
        </button>

        <header className="mb-8">
          <div className="text-ink-faint text-xs tracking-[0.2em] uppercase mb-2">
            Orientierung
          </div>
          <h1 className="display text-3xl text-ink">{domain.label}</h1>
          <p className="text-ink-soft mt-2">{domain.description}</p>
          <ProgressBar value={domainScore?.completion ?? 0} className="mt-4" />
        </header>

        <div className="space-y-6">
          {items.map((item, idx) => (
            <Card key={item.id}>
              <div className="text-ink-faint text-xs mb-2">
                {idx + 1} / {items.length}
              </div>
              <p className="text-ink leading-relaxed">{item.text}</p>
              <RatingRow
                rating={rMap.get(item.id)}
                scaleType={item.scaleType}
                onRate={(r) => rate(item.id, r)}
              />
            </Card>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setActiveDomain(null)}
          className="mt-8 w-full py-3 border border-line text-ink-soft rounded-sm hover:bg-paper-2 transition-colors"
        >
          Zur Übersicht
        </button>
      </div>
    );
  }

  const score = orientationScore(profile);
  const label = orientationLabel(profile);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <PhaseHeader
        phaseNum="00"
        title="Orientierung"
        subtitle="Bevor du einzelne Module bearbeitest: Beantworte Situationen und Aussagen zu verschiedenen Lebensbereichen. Am Ende siehst du, welche Werte und Muster sich abzeichnen."
      />

      <div className="flex items-end gap-6 mb-10 p-6 bg-paper-2 border border-line-soft rounded-sm">
        <div>
          <div className="display text-5xl text-accent font-medium">{score}</div>
          <div className="text-ink-faint text-xs tracking-wider uppercase mt-1">
            Orientierungs-Score
          </div>
        </div>
        <div className="flex-1">
          <div className="text-ink font-medium mb-2">{label}</div>
          <ProgressBar value={profile.totalCompletion} />
          <div className="text-ink-faint text-sm mt-1">
            {data.responses.length} von {ITEMS.length} Aussagen bewertet
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {DOMAINS.map((d) => {
          const ds = profile.domains.find((pd) => pd.id === d.id);
          const itemCount = ITEMS.filter((i) => i.domain === d.id).length;
          const answeredCount = data.responses.filter((r) =>
            ITEMS.find((i) => i.id === r.item_id && i.domain === d.id),
          ).length;

          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDomain(d.id)}
              className="text-left p-5 bg-paper-2 border border-line-soft rounded-sm hover:border-ink-soft transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-ink group-hover:text-accent transition-colors">
                  {d.label}
                </span>
                <span className="text-ink-faint text-sm">
                  {answeredCount}/{itemCount}
                </span>
              </div>
              <p className="text-ink-faint text-sm mb-3">{d.description}</p>
              <ProgressBar value={ds?.completion ?? 0} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
