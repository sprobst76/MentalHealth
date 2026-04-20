import type { DomainId, QuestionItem } from "./types";

export const DOMAINS: { id: DomainId; label: string; description: string }[] = [
  {
    id: "autonomy",
    label: "Autonomie & Grenzen",
    description: "Wie du mit Freiheit, Kontrolle und dem Setzen von Grenzen umgehst.",
  },
  {
    id: "connection",
    label: "Verbundenheit & Vertrauen",
    description: "Wie du Beziehungen erlebst, Vertrauen aufbaust und Nähe zulässt.",
  },
  {
    id: "selfworth",
    label: "Selbstwert & Leistung",
    description: "Wie du dich selbst bewertest, mit Fehlern umgehst und Leistung erlebst.",
  },
  {
    id: "safety",
    label: "Sicherheit & Kontrolle",
    description: "Wie du mit Unsicherheit, Veränderungen und Bedrohungen umgehst.",
  },
  {
    id: "meaning",
    label: "Werte & Bedeutung",
    description: "Was dir wirklich wichtig ist und wie nah du dem in deinem Leben kommst.",
  },
  {
    id: "expression",
    label: "Ausdruck & Wachstum",
    description: "Wie du dich ausdrückst, fühlst und dich weiterentwickelst.",
  },
];

export const SCALE_LABELS: Record<string, string[]> = {
  agreement: [
    "Stimmt gar nicht",
    "Stimmt kaum",
    "Teils-teils",
    "Stimmt meistens",
    "Stimmt völlig",
  ],
  importance: ["Unwichtig", "Kaum wichtig", "Mittelmäßig", "Wichtig", "Sehr wichtig"],
  frequency: ["Nie", "Selten", "Manchmal", "Oft", "Fast immer"],
};

export const ITEMS: QuestionItem[] = [
  // ─── AUTONOMIE & GRENZEN ────────────────────────────────────────────────────
  {
    id: "au01",
    domain: "autonomy",
    text: "Es fällt mir schwer, Nein zu sagen — auch wenn ich es eigentlich möchte.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "subjugation", weight: 1.5, direction: "direct" },
      { type: "schema", id: "self_sacrifice", weight: 1.0, direction: "direct" },
      { type: "value", id: "autonomy", weight: 1.0, direction: "inverse" },
    ],
  },
  {
    id: "au02",
    domain: "autonomy",
    text: "Wenn andere meine Entscheidungen kontrollieren oder in Frage stellen, reagiere ich mit innerem Widerstand.",
    scaleType: "agreement",
    mappings: [
      { type: "value", id: "autonomy", weight: 1.5, direction: "direct" },
      { type: "value", id: "freedom", weight: 1.0, direction: "direct" },
    ],
  },
  {
    id: "au03",
    domain: "autonomy",
    text: "Meine eigenen Bedürfnisse zurückzustellen fühlt sich selbstverständlich oder richtig an.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "self_sacrifice", weight: 1.5, direction: "direct" },
      { type: "schema", id: "subjugation", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "au04",
    domain: "autonomy",
    text: "Freiheit — meinen eigenen Weg gehen zu können — ist mir ein tiefes Anliegen.",
    scaleType: "importance",
    mappings: [
      { type: "value", id: "freedom", weight: 1.5, direction: "direct" },
      { type: "value", id: "autonomy", weight: 1.0, direction: "direct" },
    ],
  },
  {
    id: "au05",
    domain: "autonomy",
    text: "Ich passe mich leicht an das an, was andere von mir erwarten — manchmal zu leicht.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "approval_seeking", weight: 1.0, direction: "direct" },
      { type: "schema", id: "subjugation", weight: 0.5, direction: "direct" },
      { type: "value", id: "authenticity", weight: 1.0, direction: "inverse" },
    ],
  },
  {
    id: "au06",
    domain: "autonomy",
    text: "Ich spüre oft einen inneren Zug zwischen dem, was ich will, und dem, was ich tun 'sollte'.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "subjugation", weight: 0.5, direction: "direct" },
      { type: "value", id: "authenticity", weight: 0.5, direction: "inverse" },
    ],
  },
  {
    id: "au07",
    domain: "autonomy",
    text: "Grenzen zu setzen — auch gegenüber nahestehenden Menschen — fühlt sich für mich richtig an.",
    scaleType: "agreement",
    mappings: [
      { type: "value", id: "autonomy", weight: 1.0, direction: "direct" },
      { type: "value", id: "honesty", weight: 0.5, direction: "direct" },
      { type: "schema", id: "self_sacrifice", weight: 1.0, direction: "inverse" },
    ],
  },
  {
    id: "au08",
    domain: "autonomy",
    text: "Ich handle oft aus Pflichtgefühl heraus — nicht aus echter innerer Überzeugung.",
    scaleType: "frequency",
    mappings: [
      { type: "schema", id: "subjugation", weight: 1.0, direction: "direct" },
      { type: "value", id: "authenticity", weight: 1.0, direction: "inverse" },
      { type: "value", id: "meaning", weight: 0.5, direction: "inverse" },
    ],
  },

  // ─── VERBUNDENHEIT & VERTRAUEN ──────────────────────────────────────────────
  {
    id: "co01",
    domain: "connection",
    text: "Ich habe Angst, dass Menschen, die mir wichtig sind, mich letztlich verlassen werden.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "abandonment", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "co02",
    domain: "connection",
    text: "Es fällt mir grundsätzlich schwer, anderen Menschen wirklich zu vertrauen.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "mistrust", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "co03",
    domain: "connection",
    text: "Tiefe, echte Verbindung zu anderen Menschen ist mir sehr wichtig.",
    scaleType: "importance",
    mappings: [
      { type: "value", id: "connection", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "co04",
    domain: "connection",
    text: "Ich habe das Gefühl, dass andere meine Bedürfnisse und Gefühle nicht wirklich sehen oder verstehen.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "emotional_deprivation", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "co05",
    domain: "connection",
    text: "In Konflikten ziehe ich mich eher zurück, als das Gespräch zu suchen.",
    scaleType: "frequency",
    mappings: [
      { type: "schema", id: "social_isolation", weight: 0.5, direction: "direct" },
      { type: "schema", id: "emotional_inhibition", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "co06",
    domain: "connection",
    text: "Ich fühle mich grundsätzlich anders als andere — wie ein Außenseiter, auch wenn ich unter Menschen bin.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "social_isolation", weight: 1.5, direction: "direct" },
      { type: "schema", id: "defectiveness", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "co07",
    domain: "connection",
    text: "Ich mache mir Sorgen, andere mit meinen Problemen oder Gefühlen zu belasten.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "self_sacrifice", weight: 0.5, direction: "direct" },
      { type: "schema", id: "approval_seeking", weight: 0.5, direction: "direct" },
      { type: "schema", id: "emotional_inhibition", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "co08",
    domain: "connection",
    text: "Ehrlichkeit und Offenheit sind mir in Beziehungen wichtiger als Harmonie um jeden Preis.",
    scaleType: "agreement",
    mappings: [
      { type: "value", id: "honesty", weight: 1.5, direction: "direct" },
      { type: "value", id: "courage", weight: 0.5, direction: "direct" },
    ],
  },

  // ─── SELBSTWERT & LEISTUNG ──────────────────────────────────────────────────
  {
    id: "sw01",
    domain: "selfworth",
    text: "Tief im Inneren habe ich das Gefühl, nicht gut genug zu sein — egal was ich erreiche.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "defectiveness", weight: 1.5, direction: "direct" },
      { type: "schema", id: "failure", weight: 1.0, direction: "direct" },
    ],
  },
  {
    id: "sw02",
    domain: "selfworth",
    text: "Fehler zu machen fällt mir sehr schwer zu akzeptieren.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "unrelenting_standards", weight: 1.0, direction: "direct" },
      { type: "schema", id: "punitiveness", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "sw03",
    domain: "selfworth",
    text: "Ich vergleiche mich oft mit anderen und komme dabei schlecht weg.",
    scaleType: "frequency",
    mappings: [
      { type: "schema", id: "defectiveness", weight: 1.0, direction: "direct" },
      { type: "schema", id: "failure", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "sw04",
    domain: "selfworth",
    text: "Ich treibe mich selbst zu immer höherer Leistung an — Innehalten fühlt sich falsch an.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "unrelenting_standards", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "sw05",
    domain: "selfworth",
    text: "Qualität und Tiefe in meiner Arbeit sind mir sehr wichtig.",
    scaleType: "importance",
    mappings: [
      { type: "value", id: "craft", weight: 1.5, direction: "direct" },
      { type: "schema", id: "unrelenting_standards", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "sw06",
    domain: "selfworth",
    text: "Ich bestrafe mich selbst hart, wenn ich Fehler mache oder hinter meinen Ansprüchen zurückbleibe.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "punitiveness", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "sw07",
    domain: "selfworth",
    text: "Ich fühle mich manchmal wie ein Betrüger — als ob andere bald merken werden, dass ich nicht so kompetent bin wie sie denken.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "defectiveness", weight: 1.0, direction: "direct" },
      { type: "schema", id: "failure", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "sw08",
    domain: "selfworth",
    text: "Kritik an meiner Arbeit oder meiner Person trifft mich tiefer als sie sollte.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "defectiveness", weight: 0.5, direction: "direct" },
      { type: "schema", id: "approval_seeking", weight: 0.5, direction: "direct" },
    ],
  },

  // ─── SICHERHEIT & KONTROLLE ─────────────────────────────────────────────────
  {
    id: "sa01",
    domain: "safety",
    text: "Veränderungen, die ich nicht kontrollieren kann, machen mir Angst.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "vulnerability", weight: 1.0, direction: "direct" },
      { type: "schema", id: "negativity", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "sa02",
    domain: "safety",
    text: "Ich mache mir viele Sorgen über Dinge, die schiefgehen könnten.",
    scaleType: "frequency",
    mappings: [
      { type: "schema", id: "negativity", weight: 1.5, direction: "direct" },
      { type: "schema", id: "vulnerability", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "sa03",
    domain: "safety",
    text: "Klare Strukturen und Routinen geben mir Stabilität und Sicherheit.",
    scaleType: "importance",
    mappings: [
      { type: "value", id: "stability", weight: 1.0, direction: "direct" },
    ],
  },
  {
    id: "sa04",
    domain: "safety",
    text: "Das Leben fühlt sich für mich grundsätzlich unsicher oder bedrohlich an.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "vulnerability", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "sa05",
    domain: "safety",
    text: "Ich neige dazu, das Schlimmste zu erwarten — auch wenn es keinen konkreten Anlass gibt.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "negativity", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "sa06",
    domain: "safety",
    text: "Körperliche Gesundheit und Wohlbefinden sind mir wichtig — ich achte auf Erholung und Grenzen.",
    scaleType: "importance",
    mappings: [
      { type: "value", id: "rest", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "sa07",
    domain: "safety",
    text: "Ich brauche Kontrolle über meine Umgebung oder Situation, um mich sicher zu fühlen.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "vulnerability", weight: 1.0, direction: "direct" },
      { type: "schema", id: "emotional_inhibition", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "sa08",
    domain: "safety",
    text: "Ich glaube, ich bin im Wesentlichen auf mich allein gestellt — andere werden letztlich nicht für mich da sein.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "abandonment", weight: 0.5, direction: "direct" },
      { type: "schema", id: "emotional_deprivation", weight: 1.0, direction: "direct" },
    ],
  },

  // ─── WERTE & BEDEUTUNG ───────────────────────────────────────────────────────
  {
    id: "me01",
    domain: "meaning",
    text: "Gerechtigkeit und Fairness sind mir sehr wichtig — ich setze mich dafür ein, auch wenn es mich Aufwand kostet.",
    scaleType: "agreement",
    mappings: [
      { type: "value", id: "justice", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "me02",
    domain: "meaning",
    text: "Ich handle manchmal gegen meine eigenen Überzeugungen, um Konflikte zu vermeiden.",
    scaleType: "frequency",
    mappings: [
      { type: "schema", id: "subjugation", weight: 1.0, direction: "direct" },
      { type: "schema", id: "approval_seeking", weight: 0.5, direction: "direct" },
      { type: "value", id: "authenticity", weight: 1.0, direction: "inverse" },
    ],
  },
  {
    id: "me03",
    domain: "meaning",
    text: "Die Frage nach dem Sinn meines Lebens beschäftigt mich ernsthaft.",
    scaleType: "agreement",
    mappings: [
      { type: "value", id: "meaning", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "me04",
    domain: "meaning",
    text: "Ich fühle mich schuldig, wenn ich eigene Bedürfnisse über die anderer stelle.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "self_sacrifice", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "me05",
    domain: "meaning",
    text: "Ich handle nach klaren ethischen Prinzipien — auch unter Druck oder wenn es unbequem ist.",
    scaleType: "agreement",
    mappings: [
      { type: "value", id: "honesty", weight: 1.0, direction: "direct" },
      { type: "value", id: "courage", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "me06",
    domain: "meaning",
    text: "Es gibt einen spürbaren Widerspruch zwischen dem, was ich im Alltag lebe, und dem, was mir wirklich wichtig ist.",
    scaleType: "agreement",
    mappings: [
      { type: "value", id: "meaning", weight: 0.5, direction: "inverse" },
      { type: "value", id: "authenticity", weight: 0.5, direction: "inverse" },
    ],
  },
  {
    id: "me07",
    domain: "meaning",
    text: "Präsenz — wirklich im Moment da zu sein, anstatt im Kopf woanders zu sein — ist mir ein echtes Anliegen.",
    scaleType: "importance",
    mappings: [
      { type: "value", id: "presence", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "me08",
    domain: "meaning",
    text: "Wenn ich eine Entscheidung treffe, die sich 'richtig' anfühlt, aber sozial nicht anerkannt wird, stehe ich trotzdem dazu.",
    scaleType: "agreement",
    mappings: [
      { type: "value", id: "authenticity", weight: 1.0, direction: "direct" },
      { type: "value", id: "courage", weight: 0.5, direction: "direct" },
      { type: "schema", id: "approval_seeking", weight: 1.0, direction: "inverse" },
    ],
  },

  // ─── AUSDRUCK & WACHSTUM ────────────────────────────────────────────────────
  {
    id: "ex01",
    domain: "expression",
    text: "Kreativität und eigener Ausdruck spielen eine wichtige Rolle in meinem Leben.",
    scaleType: "importance",
    mappings: [
      { type: "value", id: "creativity", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "ex02",
    domain: "expression",
    text: "Ich unterdrücke oft meine Gefühle oder Meinungen, um andere nicht zu belasten oder zu verletzen.",
    scaleType: "frequency",
    mappings: [
      { type: "schema", id: "emotional_inhibition", weight: 1.5, direction: "direct" },
      { type: "schema", id: "self_sacrifice", weight: 0.5, direction: "direct" },
    ],
  },
  {
    id: "ex03",
    domain: "expression",
    text: "Neugier — immer wieder Neues zu entdecken und zu lernen — treibt mich an.",
    scaleType: "importance",
    mappings: [
      { type: "value", id: "curiosity", weight: 1.5, direction: "direct" },
      { type: "value", id: "growth", weight: 1.0, direction: "direct" },
    ],
  },
  {
    id: "ex04",
    domain: "expression",
    text: "Es fällt mir schwer, über meine eigenen Gefühle zu sprechen — auch mit Menschen, denen ich vertraue.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "emotional_inhibition", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "ex05",
    domain: "expression",
    text: "Persönliches Wachstum und Weiterentwicklung — zu werden, wer ich sein kann — sind mir sehr wichtig.",
    scaleType: "importance",
    mappings: [
      { type: "value", id: "growth", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "ex06",
    domain: "expression",
    text: "Ich habe das Gefühl, meine wahren Gedanken und Gefühle nicht wirklich zeigen zu dürfen.",
    scaleType: "agreement",
    mappings: [
      { type: "schema", id: "emotional_inhibition", weight: 1.0, direction: "direct" },
      { type: "schema", id: "defectiveness", weight: 0.5, direction: "direct" },
      { type: "value", id: "authenticity", weight: 1.0, direction: "inverse" },
    ],
  },
  {
    id: "ex07",
    domain: "expression",
    text: "Tiefe, substanzielle Themen interessieren mich mehr als Oberflächliches.",
    scaleType: "agreement",
    mappings: [
      { type: "value", id: "depth", weight: 1.5, direction: "direct" },
    ],
  },
  {
    id: "ex08",
    domain: "expression",
    text: "Mut — etwas zu tun, auch wenn es Angst macht oder ungewiss ist — ist etwas, das ich in mir kultivieren möchte.",
    scaleType: "importance",
    mappings: [
      { type: "value", id: "courage", weight: 1.5, direction: "direct" },
    ],
  },
];

export const VALUE_LABELS: Record<string, string> = {
  autonomy: "Autonomie",
  freedom: "Freiheit",
  authenticity: "Authentizität",
  honesty: "Ehrlichkeit",
  courage: "Mut",
  connection: "Verbundenheit",
  craft: "Handwerk & Qualität",
  meaning: "Sinn & Bedeutung",
  presence: "Präsenz",
  rest: "Ruhe & Gesundheit",
  curiosity: "Neugier",
  growth: "Wachstum",
  creativity: "Kreativität",
  justice: "Gerechtigkeit",
  depth: "Tiefe",
  stability: "Stabilität",
};

export const SCHEMA_LABELS: Record<string, string> = {
  abandonment: "Verlassenheit",
  mistrust: "Misstrauen",
  emotional_deprivation: "Emotionale Entbehrung",
  defectiveness: "Unzulänglichkeit",
  social_isolation: "Soziale Isolation",
  dependence: "Abhängigkeit",
  vulnerability: "Verletzlichkeit",
  enmeshment: "Verstrickung",
  failure: "Versagen",
  entitlement: "Anspruchshaltung",
  insufficient_self_control: "Unzureichende Selbstkontrolle",
  subjugation: "Unterwerfung",
  self_sacrifice: "Selbstaufopferung",
  approval_seeking: "Zustimmungssuche",
  negativity: "Negativität & Pessimismus",
  emotional_inhibition: "Emotionale Hemmung",
  unrelenting_standards: "Überhöhte Standards",
  punitiveness: "Bestrafungsneigung",
};
