// Schema therapy healing direction hints for YSQ-S3 schemas.
// Content grounded in Young, Klosko & Weishaar (2003). Requires user review.
// Array order MUST match YSQ_SCHEMAS in ysq/constants.ts (same index alignment).

export interface SchemaHint {
  schemaId: string; // matches YsqSchema.id
  healingDirection: string; // 1-2 sentences displayed below schema name
  goalSuggestions: string[]; // 2-3 short items; used for display and prefill
  obstacleHints: string[]; // 1-2 items
}

export const YSQ_HINTS: SchemaHint[] = [
  {
    schemaId: "abandonment",
    healingDirection:
      "Vertrauen in die Stabilität von Beziehungen aufbauen; lernen, mit Ungewissheit umzugehen ohne sofort in Panik zu verfallen.",
    goalSuggestions: [
      "Einen Menschen in meinem Leben benennen, dem ich wirklich vertraue",
      "Eine Situation üben, in der ich allein bin — ohne zu flüchten",
      "Meine eigene Kontinuität erleben, unabhängig davon, wer bleibt",
    ],
    obstacleHints: [
      "Klammern oder Distanzieren als Selbstschutz",
      "Testen von Beziehungen",
    ],
  },
  {
    schemaId: "mistrust",
    healingDirection:
      "Unterscheiden lernen zwischen vergangenen Erfahrungen und aktuellen Beziehungen; schrittweise Sicherheit in kleinen Vertrauensschritten erfahren.",
    goalSuggestions: [
      "Einen niedrigschwelligen Vertrauensschritt mit einer sicheren Person wagen",
      "Beobachten, wann mein Misstrauen angemessen ist und wann es überreagiert",
      "Eigene Grenzen klar formulieren — als Schutz, nicht als Mauer",
    ],
    obstacleHints: [
      "Hypervigilanz",
      "Selbsterfüllende Prophezeiungen durch Distanz",
    ],
  },
  {
    schemaId: "emotional_deprivation",
    healingDirection:
      "Lernen, eigene emotionale Bedürfnisse wahrzunehmen und sie gegenüber anderen zu artikulieren; aktiv Verbindung suchen statt passiv warten.",
    goalSuggestions: [
      "Einem Menschen sagen, was ich mir von ihm wünsche — konkret und direkt",
      "Regelmäßig prüfen: Was brauche ich gerade emotional?",
      "Eine Beziehung pflegen, in der ich mich wirklich gehört fühle",
    ],
    obstacleHints: [
      "Passives Warten auf Fürsorge",
      "Bedürfnisse kleinreden",
    ],
  },
  {
    schemaId: "defectiveness",
    healingDirection:
      "Den inneren Kritiker identifizieren und seine Botschaften hinterfragen; lernen, sich so zu begegnen wie einem guten Freund.",
    goalSuggestions: [
      "Drei Eigenschaften aufschreiben, die ich an mir schätze — ohne Einschränkung",
      "Eine Situation benennen, in der ich Fehler gemacht habe und trotzdem liebenswert war",
      "Mit einer Vertrauensperson über eine Schwäche sprechen",
    ],
    obstacleHints: [
      "Rückzug aus Nähe aus Angst vor Entdeckung",
      "Überleistung als Kompensation",
    ],
  },
  {
    schemaId: "social_isolation",
    healingDirection:
      "Gemeinsame Interessen und Zugehörigkeiten aufspüren; kleine soziale Schritte unternehmen ohne den Druck vollständiger Akzeptanz.",
    goalSuggestions: [
      "Einen Ort oder eine Gruppe suchen, wo meine Interessen willkommen sind",
      "Ein echtes Gespräch führen — ohne Rollenmaske",
      "Herausfinden, worin ich mich von anderen unterscheide und worin nicht",
    ],
    obstacleHints: [
      "Rückzug bei erster Ablehnung",
      "Vergleiche, die Differenz betonen",
    ],
  },
  {
    schemaId: "dependence",
    healingDirection:
      "Eigene Kompetenz in kleinen Schritten erleben; Entscheidungen treffen ohne Bestätigung einzuholen.",
    goalSuggestions: [
      "Eine Alltagsentscheidung allein treffen und die Konsequenz tragen",
      "Eine Aufgabe übernehmen, die ich bisher immer abgegeben habe",
      "Erfolge und Misserfolge als eigene Erfahrung anerkennen — nicht delegieren",
    ],
    obstacleHints: [
      "Rat einholen als Vermeidung",
      "Selbstzweifel nach kleinen Fehlern",
    ],
  },
  {
    schemaId: "vulnerability",
    healingDirection:
      "Eigene Resilienz-Erfahrungen sammeln; zwischen realen und phantasierten Gefahren unterscheiden lernen.",
    goalSuggestions: [
      "Eine Situation, die ich gefürchtet habe, bewusst auf mich zukommen lassen und beobachten",
      "Einen Notfallplan erstellen — dann den Plan weglegen",
      "Realistische Wahrscheinlichkeiten von Katastrophen recherchieren",
    ],
    obstacleHints: [
      "Vermeidung als kurzfristige Beruhigung",
      "Katastrophisieren",
    ],
  },
  {
    schemaId: "enmeshment",
    healingDirection:
      "Eigene Werte, Vorlieben und Meinungen getrennt von Bezugspersonen entwickeln; Grenzen als Fürsorge statt als Verrat verstehen.",
    goalSuggestions: [
      "Drei eigene Meinungen formulieren, die sich von denen meiner Familie unterscheiden",
      "Eine Entscheidung treffen, die mir wichtig ist — ohne vorherige Abstimmung",
      "Eigene Zeit und eigenen Raum bewusst einfordern",
    ],
    obstacleHints: [
      "Schuldgefühle bei Eigenständigkeit",
      "Diffuse Grenzen",
    ],
  },
  {
    schemaId: "failure",
    healingDirection:
      "Eigene Leistungen nach eigenen Maßstäben bewerten; zwischen Versagen als Ereignis und Versagen als Identität unterscheiden.",
    goalSuggestions: [
      "Einen vergangenen Erfolg konkret beschreiben — ohne Relativierung",
      "Eine neue Aufgabe angehen, ohne das Ergebnis mit anderen zu vergleichen",
      "Eigene Lernkurve dokumentieren statt Endergebnis zu bewerten",
    ],
    obstacleHints: [
      "Prokrastination als Vermeidung von Versagen",
      "Vorauseilender Selbstschutz",
    ],
  },
  {
    schemaId: "entitlement",
    healingDirection:
      "Empathie und Gegenseitigkeit in Beziehungen stärken; Grenzen als Teil sozialer Verbundenheit akzeptieren.",
    goalSuggestions: [
      "Eine Situation identifizieren, in der die Bedürfnisse anderer genauso wichtig waren wie meine",
      "Einen Wunsch aufgeben — und beobachten, was wirklich passiert",
      "Feedback von anderen einholen und hören — ohne sofort zu widersprechen",
    ],
    obstacleHints: [
      "Ärger bei Einschränkungen",
      "Rechtfertigungsmuster",
    ],
  },
  {
    schemaId: "insufficient_self_control",
    healingDirection:
      "Toleranz für Aufschub und Unbehagen schrittweise trainieren; kleine Verbindlichkeiten einhalten.",
    goalSuggestions: [
      "Eine unangenehme Aufgabe in kleinen Schritten beenden — ohne Ablenkung",
      "Einen Impuls beobachten ohne ihm sofort nachzugeben",
      "Eine tägliche Routine aufbauen und eine Woche durchhalten",
    ],
    obstacleHints: [
      "Unmittelbare Belohnung als Antrieb",
      "Frustrationsvermeidung",
    ],
  },
  {
    schemaId: "subjugation",
    healingDirection:
      "Eigene Wünsche und Grenzen wahrnehmen und in sicheren Kontexten ausdrücken; Autorität hinterfragen statt automatisch zu gehorchen.",
    goalSuggestions: [
      "Einmal Nein sagen — in einer Situation mit geringem Risiko",
      "Einen eigenen Wunsch formulieren, ohne ihn sofort zu relativieren",
      "Beobachten, wann ich gehorche aus Pflicht und wann aus eigenem Willen",
    ],
    obstacleHints: [
      "Angst vor Strafe bei Ablehnung",
      "Passive Aggression",
    ],
  },
  {
    schemaId: "self_sacrifice",
    healingDirection:
      "Eigene Bedürfnisse als gleichwertig anerkennen; Fürsorge aus Stärke statt aus Pflicht geben.",
    goalSuggestions: [
      "Einen eigenen Bedarf anmelden — ohne Entschuldigung",
      "Prüfen: Gebe ich gerade, weil ich will, oder weil ich muss?",
      "Eine Bitte ablehnen und beobachten, was wirklich passiert",
    ],
    obstacleHints: [
      "Erschöpfung als Warnsignal ignorieren",
      "Schuldgefühle bei Ablehnung",
    ],
  },
  {
    schemaId: "approval_seeking",
    healingDirection:
      "Innere Wertmaßstäbe entwickeln, die unabhängig von äußerer Bestätigung tragen; Selbstausdruck üben.",
    goalSuggestions: [
      "Eine Meinung vertreten, von der ich weiß, dass andere sie nicht teilen werden",
      "Eine Entscheidung treffen, ohne vorher die Reaktionen anderer vorauszudenken",
      "Eigene Zufriedenheit als Kriterium nutzen — nicht Applaus",
    ],
    obstacleHints: [
      "Anpassungsverhalten als Automatismus",
      "Identitätsverlust",
    ],
  },
  {
    schemaId: "negativity",
    healingDirection:
      "Gleichgewicht zwischen realistischer Vorsicht und offener Wahrnehmung herstellen; positive Fakten registrieren ohne sie zu entwerten.",
    goalSuggestions: [
      "Täglich drei Dinge notieren, die gut gelaufen sind — sachlich, ohne Bewertung",
      "Eine Sorge konkret prüfen: Ist sie wahrscheinlich oder nur möglich?",
      "Einen Plan für ein Worst-Case-Szenario erstellen — und dann loslassen",
    ],
    obstacleHints: [
      "Grübelschleifen",
      "Suche nach Bestätigung für Negativerwartungen",
    ],
  },
  {
    schemaId: "emotional_inhibition",
    healingDirection:
      "Gefühlen Raum geben; sichere Ausdrucksformen finden; Spontaneität in kontrollierten Schritten üben.",
    goalSuggestions: [
      "Ein Gefühl benennen — gegenüber mir selbst, schriftlich",
      "In einer sicheren Situation eine Emotion zeigen — beobachten, was passiert",
      "Eine spontane Reaktion zulassen statt sie sofort zu korrigieren",
    ],
    obstacleHints: [
      "Kontrollverlust als Bedrohung erlebt",
      "Kognitivierung von Emotion",
    ],
  },
  {
    schemaId: "unrelenting_standards",
    healingDirection:
      "Ausreichend als Kategorie akzeptieren; Ruhe als produktiven Zustand rehabilitieren.",
    goalSuggestions: [
      "Eine Aufgabe bewusst auf 80 % abschließen — und gut damit sein",
      "Pausen planen und einhalten — nicht als Belohnung, sondern als Bedingung",
      "Den eigenen Maßstab für 'genug' klar definieren und aufschreiben",
    ],
    obstacleHints: [
      "Selbstkritik nach Pausen",
      "Perfektion als Identität",
    ],
  },
  {
    schemaId: "punitiveness",
    healingDirection:
      "Mitgefühl für sich selbst und andere kultivieren; Fehler als menschlich und lernbar rahmen.",
    goalSuggestions: [
      "Einen Fehler beschreiben, den ich mir vergeben möchte — konkret",
      "Eine Reaktion auf einen Fehler anderer wählen, die mit Mitgefühl beginnt",
      "Den Unterschied zwischen Konsequenzen und Bestrafung klären",
    ],
    obstacleHints: [
      "Strenge als Gerechtigkeit erlebt",
      "Mitgefühl als Schwäche",
    ],
  },
];

// O(1) lookup by schema ID. Map key = SchemaHint.schemaId.
export const YSQ_HINTS_MAP = new Map(YSQ_HINTS.map((h) => [h.schemaId, h]));
