import { useMemo } from "react";
import { calcProfile, orientationLabel, orientationScore } from "./scoring";
import type { OrientationData } from "./types";

interface Props {
  data: OrientationData;
}

function Bar({ value, tone = "accent" }: { value: number; tone?: "accent" | "sage" | "ocean" }) {
  const colors = { accent: "bg-accent", sage: "bg-sage", ocean: "bg-ocean" };
  return (
    <div className="h-1.5 bg-paper-3 rounded-full overflow-hidden">
      <div
        className={`h-full ${colors[tone]} rounded-full transition-all duration-500`}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

export function OrientationSummary({ data }: Props) {
  const profile = useMemo(() => calcProfile(data.responses), [data.responses]);
  const score = orientationScore(profile);

  if (data.responses.length === 0) {
    return (
      <p className="text-ink-faint italic">
        Noch keine Aussagen bewertet. Starte mit dem Orientierungs-Fragebogen.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="display text-3xl text-accent">{score}</span>
        <span className="text-ink-soft">{orientationLabel(profile)}</span>
      </div>

      {profile.topValues.length > 0 && (
        <div>
          <div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-3">
            Erkannte Werte
          </div>
          <ul className="space-y-2">
            {profile.topValues.map((v) => (
              <li key={v.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink">{v.label}</span>
                  <span className="text-ink-faint">{Math.round(v.score * 100)} %</span>
                </div>
                <Bar value={v.score} tone="sage" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.activeSchemas.length > 0 && (
        <div>
          <div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-3">
            Aktive Schema-Muster
          </div>
          <ul className="space-y-2">
            {profile.activeSchemas.map((s) => (
              <li key={s.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink">{s.label}</span>
                  <span className="text-ink-faint">{Math.round(s.score * 100)} %</span>
                </div>
                <Bar value={s.score} tone="ocean" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
