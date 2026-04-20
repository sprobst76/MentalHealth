export interface SchemaInfo {
  id: string;
  label: string;
  coreBeliefText: string;
  description: string;
  typicalTrigger: string;
}

export const SCHEMAS: SchemaInfo[] = [
  {
    id: "abandonment",
    label: "Verlassenheit",
    coreBeliefText: "Menschen, die mir wichtig sind, werden mich früher oder später verlassen.",
    description: "Die Erwartung, dass nahestehende Menschen sterben, weggehen oder mich zugunsten anderer aufgeben werden.",
    typicalTrigger: "Wenn jemand Abstand nimmt, eine Beziehung beendet oder unzuverlässig ist.",
  },
  {
    id: "mistrust",
    label: "Misstrauen & Missbrauch",
    coreBeliefText: "Andere werden mich früher oder später verletzen, benutzen oder hintergehen.",
    description: "Die Erwartung, dass andere absichtlich verletzen, demütigen, betrügen oder manipulieren.",
    typicalTrigger: "Wenn jemand einen Fehler macht, etwas vergisst oder undurchsichtig handelt.",
  },
  {
    id: "emotional_deprivation",
    label: "Emotionale Entbehrung",
    coreBeliefText: "Meine emotionalen Bedürfnisse nach Wärme, Empathie und Fürsorge werden nie wirklich erfüllt.",
    description: "Die Überzeugung, dass die eigenen emotionalen Bedürfnisse von anderen nie angemessen befriedigt werden.",
    typicalTrigger: "Wenn andere nicht von sich aus fragen, wie es einem geht, oder Fürsorge nicht zeigen.",
  },
  {
    id: "defectiveness",
    label: "Unzulänglichkeit & Scham",
    coreBeliefText: "Ich bin im Kern fehlerhaft, wertlos oder nicht liebenswert — wenn andere mich wirklich kennen würden, würden sie mich ablehnen.",
    description: "Das Gefühl, im Wesentlichen defekt, schlecht, unerwünscht oder minderwertig zu sein.",
    typicalTrigger: "Kritik, Ablehnung, Vergleiche mit anderen, Intimität.",
  },
  {
    id: "social_isolation",
    label: "Soziale Isolation",
    coreBeliefText: "Ich bin grundlegend anders als andere Menschen — ich gehöre nirgendwo dazu.",
    description: "Das Gefühl, von der übrigen Welt isoliert, anders oder nicht dazugehörig zu sein.",
    typicalTrigger: "Soziale Situationen, Gruppen, Gespräche über persönliche Themen.",
  },
  {
    id: "failure",
    label: "Versagen",
    coreBeliefText: "Ich versage früher oder später bei allem, was mir wirklich wichtig ist — im Vergleich zu anderen bin ich nicht kompetent genug.",
    description: "Die Überzeugung, dass man im Leistungsbereich versagt hat, zwangsläufig versagen wird oder grundlegend inkompetent ist.",
    typicalTrigger: "Herausforderungen, Vergleiche mit Gleichaltrigen, Feedback, neue Aufgaben.",
  },
  {
    id: "subjugation",
    label: "Unterwerfung",
    coreBeliefText: "Ich muss die Kontrolle anderen überlassen oder ihre Bedürfnisse über meine stellen — sonst drohen Ablehnung oder Bestrafung.",
    description: "Übermäßige Unterwerfung unter andere, um Wut, Vergeltung oder Verlassenwerden zu vermeiden.",
    typicalTrigger: "Wenn eigene Bedürfnisse mit denen anderer kollidieren; Konfliktsituationen.",
  },
  {
    id: "self_sacrifice",
    label: "Selbstaufopferung",
    coreBeliefText: "Ich muss die Bedürfnisse anderer über meine eigenen stellen — sonst bin ich egoistisch und schlechter Mensch.",
    description: "Freiwilliger Verzicht auf die Befriedigung eigener Bedürfnisse, um anderen zu helfen.",
    typicalTrigger: "Wenn andere Hilfe brauchen oder leiden; eigene Bedürfnisse äußern.",
  },
  {
    id: "approval_seeking",
    label: "Zustimmungssuche",
    coreBeliefText: "Ich bin nur dann wertvoll und akzeptabel, wenn andere mich mögen und anerkennen.",
    description: "Übermäßige Orientierung am Erlangen von Anerkennung, Zustimmung oder Aufmerksamkeit.",
    typicalTrigger: "Ablehnung, Kritik, Gleichgültigkeit anderer; Entscheidungen, die andere nicht gutheißen.",
  },
  {
    id: "negativity",
    label: "Negativität & Pessimismus",
    coreBeliefText: "Das Leben ist grundlegend negativ — Verlust, Enttäuschung und Schmerz sind unvermeidlich.",
    description: "Anhaltender Fokus auf negative Aspekte des Lebens unter Vernachlässigung positiver Seiten.",
    typicalTrigger: "Unsicherheiten, Entscheidungen, kleine Rückschläge, Zukunftspläne.",
  },
  {
    id: "emotional_inhibition",
    label: "Emotionale Hemmung",
    coreBeliefText: "Ich darf meine Gefühle nicht zeigen oder spontan handeln — das wäre ein Zeichen von Schwäche oder Kontrollverlust.",
    description: "Übermäßige Hemmung spontaner Handlungen, Gefühle oder Kommunikation.",
    typicalTrigger: "Situationen, die Offenheit, Verletzlichkeit oder Spontaneität erfordern.",
  },
  {
    id: "unrelenting_standards",
    label: "Überhöhte Standards",
    coreBeliefText: "Ich muss in allem perfekt sein und höchste Ansprüche erfüllen — alles andere ist Versagen.",
    description: "Der Glaube, dass man nach sehr hohen verinnerlichten Standards streben muss.",
    typicalTrigger: "Fehler, Mittelmäßigkeit, Entspannung, Freizeit — das Gefühl, nicht genug zu tun.",
  },
  {
    id: "punitiveness",
    label: "Bestrafungsneigung",
    coreBeliefText: "Menschen, die Fehler machen, verdienen harte Kritik und Strafe — das gilt besonders für mich.",
    description: "Der Glaube, dass Menschen für Fehler hart bestraft werden sollten.",
    typicalTrigger: "Eigene Fehler, Fehler anderer, wahrgenommene Schwächen.",
  },
  {
    id: "vulnerability",
    label: "Verletzlichkeit & Bedrohung",
    coreBeliefText: "Eine Katastrophe kann jederzeit eintreten — ich bin dem schutzlos ausgeliefert.",
    description: "Übertriebene Angst vor jederzeit drohenden Katastrophen — Krankheit, Kriminalität, Naturkatastrophen.",
    typicalTrigger: "Ungewöhnliche Körpersymptome, Nachrichten, unsichere Situationen, Reisen.",
  },
];

export const SCHEMA_MAP = new Map(SCHEMAS.map((s) => [s.id, s]));
