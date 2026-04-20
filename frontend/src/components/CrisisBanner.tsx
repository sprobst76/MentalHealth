interface Props {
  compact?: boolean;
}

export function CrisisBanner({ compact = false }: Props) {
  return (
    <aside
      role="alert"
      className={`border border-accent bg-paper-2 rounded-sm ${compact ? "p-4" : "p-6"}`}
    >
      <div className="text-xs tracking-[0.15em] uppercase text-accent mb-2">
        Hilfe in der Krise
      </div>
      <p className="text-ink text-sm leading-relaxed mb-3">
        Wenn du gerade Gedanken an Tod oder Selbstverletzung hast: Du bist nicht allein,
        und du musst das nicht allein durchstehen. Diese App ist kein Ersatz für
        professionelle Hilfe — bitte melde dich bei einer dieser Stellen:
      </p>
      <ul className="text-ink-soft text-sm space-y-1.5">
        <li>
          <span className="font-medium text-ink">Telefonseelsorge</span> — 0800 111 0 111
          oder 0800 111 0 222 (kostenfrei, 24 h)
        </li>
        <li>
          <span className="font-medium text-ink">Chat</span> —{" "}
          <a
            href="https://online.telefonseelsorge.de"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-accent"
          >
            online.telefonseelsorge.de
          </a>
        </li>
        <li>
          <span className="font-medium text-ink">Kinder- und Jugendtelefon</span> — 116 111
        </li>
        <li>
          <span className="font-medium text-ink">Ärztlicher Bereitschaftsdienst</span> — 116 117
        </li>
        <li>
          <span className="font-medium text-ink">Notruf</span> — 112 (medizinischer Notfall)
        </li>
      </ul>
    </aside>
  );
}
