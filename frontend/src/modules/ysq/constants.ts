export interface YsqSchema {
  id: string; // stable identifier, reuses beliefs_schema IDs where overlap exists
  label: string; // German schema name shown in UI
  items: string[]; // exactly 5 item texts — YSQ-S3 standard items (German)
}

// 18 schemas in standard YSQ-S3 order.
// Array index determines answer slot position: schemaIdx * 5 + itemIdx
export const YSQ_SCHEMAS: YsqSchema[] = [
  {
    id: "abandonment",
    label: "Verlassenheit / Instabilität",
    items: [
      "Ich mache mir Sorgen, dass mir nahestehende Menschen mich verlassen oder weggehen werden.",
      "Ich klammere mich an Menschen, weil ich Angst habe, allein gelassen zu werden.",
      "Ich bin verzweifelt, wenn jemand, dem ich nahestand, mich verlässt.",
      "Ich mache mir Sorgen, dass die Menschen, die mir wichtig sind, mich für andere verlassen werden.",
      "Wenn jemand mich verlässt, glaube ich, dass es keinen anderen geben wird, der für mich da ist.",
    ],
  },
  {
    id: "mistrust",
    label: "Misstrauen / Missbrauch",
    items: [
      "Ich erwarte, dass die Menschen mich verletzen oder ausnutzen werden.",
      "Ich halte es für das Beste, anderen Menschen nicht zu vertrauen, weil sie mich verletzen werden.",
      "Ich glaube, dass andere mich ausnutzen werden, wenn sie die Gelegenheit dazu haben.",
      "Ich erwarte, dass die Menschen mich täuschen, anlügen oder manipulieren werden.",
      "Es ist nur eine Frage der Zeit, bis mein Vertrauen von den Menschen, die ich kenne, missbraucht wird.",
    ],
  },
  {
    id: "emotional_deprivation",
    label: "Emotionale Entbehrung",
    items: [
      "Die meisten Menschen verstehen meine Gefühle nicht.",
      "Ich fühle mich von den meisten Menschen nicht gesehen, und meine Gefühle werden nicht wahrgenommen.",
      "Ich vermisse jemanden, der mir wirklich zuhört, der versteht, wie ich mich wirklich fühle.",
      "Ich habe nicht jemanden, der mir wirklich Wärme und Zuneigung gibt.",
      "Die Menschen in meinem Leben geben mir nicht die emotionale Unterstützung, die ich brauche.",
    ],
  },
  {
    id: "defectiveness",
    label: "Unzulänglichkeit / Scham",
    items: [
      "Kein Mensch, der mich wirklich kennt, würde mich mögen oder respektieren.",
      "Ich bin fundamental fehlerhaft und schlecht.",
      "Wenn andere wüssten, wer ich wirklich bin, würden sie mich ablehnen.",
      "Ich bin im Grunde unerwünscht.",
      "Ich fühle mich minderwertig gegenüber anderen Menschen.",
    ],
  },
  {
    id: "social_isolation",
    label: "Soziale Isolation / Entfremdung",
    items: [
      "Ich passe nicht dazu.",
      "Ich bin grundlegend anders als andere Menschen.",
      "Ich gehöre nirgendwo dazu.",
      "Ich fühle mich von der übrigen Welt abgetrennt und isoliert.",
      "Ich bin immer ein Außenseiter.",
    ],
  },
  {
    id: "dependence",
    label: "Abhängigkeit / Inkompetenz",
    items: [
      "Ich bin nicht in der Lage, mich ohne die Hilfe anderer durchzuschlagen.",
      "Ich brauche andere Menschen, die mir helfen, um zurechtzukommen.",
      "Ich fühle mich nicht in der Lage, mit den Herausforderungen des täglichen Lebens umzugehen.",
      "Ich fühle mich hilflos ohne die Führung oder Unterstützung anderer.",
      "Ich vertraue meinem eigenen Urteil kaum.",
    ],
  },
  {
    id: "vulnerability",
    label: "Anfälligkeit für Schaden oder Krankheit",
    items: [
      "Ich bin ängstlich, dass etwas Schreckliches mir passieren wird.",
      "Ich mache mir viele Sorgen darum, schwer erkrankt zu werden.",
      "Ich fühle, dass eine Katastrophe — medizinisch, emotional oder finanziell — kurz bevorsteht.",
      "Ich bin übermäßig besorgt, dass ich die Kontrolle verliere.",
      "Ich glaube, die Welt ist ein gefährlicher Ort.",
    ],
  },
  {
    id: "enmeshment",
    label: "Verstrickung / Unterentwickeltes Selbst",
    items: [
      "Ich habe keine klare, eigene Identität getrennt von meinen Eltern oder vom Partner.",
      "Ich bin sehr involviert in die Probleme und Sorgen meiner Eltern (oder des Partners).",
      "Es ist sehr schwer für mich und meine wichtigen Bezugspersonen, eine gesunde Distanz zu wahren.",
      "Ich fühle oft, dass ich keine eigene Richtung im Leben habe — ich bin zu sehr von anderen beeinflusst.",
      "Ich fühle, dass ich mein Leben und das eines wichtigen anderen kaum trennen kann.",
    ],
  },
  {
    id: "failure",
    label: "Versagen",
    items: [
      "Ich bin gescheitert.",
      "Ich bin nicht so erfolgreich wie andere.",
      "Ich halte mich für unfähig, weil die meisten anderen fähiger zu sein scheinen.",
      "Ich habe das Gefühl, nicht so klug wie die meisten anderen zu sein.",
      "Meine bisherigen Leistungen zeigen, dass ich grundlegend gescheitert bin.",
    ],
  },
  {
    id: "entitlement",
    label: "Anspruchlichkeit / Grandiosität",
    items: [
      "Ich habe Schwierigkeiten, meine Bedürfnisse hinter die anderer zu stellen.",
      "Ich habe das Gefühl, besondere Rechte zu haben, die andere nicht haben.",
      "Was mich betrifft, sollte ich nicht an die gleichen Einschränkungen gebunden sein wie andere.",
      "Ich mag es nicht, wenn ich nicht bekomme, was ich will.",
      "Ich glaube, ich bin besser als andere Menschen.",
    ],
  },
  {
    id: "insufficient_self_control",
    label: "Unzureichende Selbstkontrolle",
    items: [
      "Ich bin unfähig, mich selbst zu disziplinieren, unangenehme Aufgaben fertig zu stellen.",
      "Wenn ich ein Ziel nicht leicht erreichen kann, gebe ich schnell auf.",
      "Es ist sehr schwer für mich, meine Gefühle und Impulse zu beherrschen.",
      "Ich muss nicht lernen, mich zu beherrschen — ich kann das, was ich will, sofort tun.",
      "Ich verliere leicht die Kontrolle über meine Emotionen und Handlungen.",
    ],
  },
  {
    id: "subjugation",
    label: "Unterwerfung",
    items: [
      "Ich fühle mich dazu gezwungen, dem Willen anderer nachzugeben, sonst werden sie sich an mir rächen.",
      "Ich glaube, wenn ich das tue, was ich will, passiert etwas Schlechtes.",
      "In Beziehungen lasse ich die andere Person das Sagen haben.",
      "Ich habe das Gefühl, dass ich keine Wahl habe, wenn es darum geht, eigene Wünsche gegenüber anderen zu vertreten.",
      "Ich tue, was andere von mir wollen, anstatt das, was ich selbst möchte.",
    ],
  },
  {
    id: "self_sacrifice",
    label: "Selbstaufopferung",
    items: [
      "Ich bin derjenige, der sich um andere kümmert.",
      "Es ist für mich schwer, die eigenen Bedürfnisse nicht hinter die anderer zu stellen.",
      "Ich lasse kaum Zeit für mich selbst, weil ich so beschäftigt damit bin, für andere zu sorgen.",
      "Meine eigenen Bedürfnisse kümmern andere kaum, deshalb sorge ich mich selbst kaum darum.",
      "Ich bin eine gute Zuhörerin für andere, aber wenn es mir schlecht geht, habe ich kaum jemanden.",
    ],
  },
  {
    id: "approval_seeking",
    label: "Streben nach Zustimmung",
    items: [
      "Ich benötige die Zustimmung anderer Menschen, um mich gut zu fühlen.",
      "Mir ist sehr wichtig, was andere von mir halten.",
      "Meine Entscheidungen werden stark davon beeinflusst, ob andere sie gutheißen werden.",
      "Ich vergleiche mich ständig mit anderen, um zu sehen, wie gut ich mir vergleiche.",
      "Ich ändere mich ständig so, dass ich der Person entspreche, mit der ich zusammen bin.",
    ],
  },
  {
    id: "negativity",
    label: "Negativität / Pessimismus",
    items: [
      "Die negativen Aspekte des Lebens beschäftigen mich viel mehr als die positiven.",
      "Wenn die Dinge gut zu laufen scheinen, warte ich auf das Schlechte, das folgen wird.",
      "Gute Dinge dauern nicht an — also spielt es keine Rolle, ob etwas gut läuft.",
      "Ich kann mich nicht entspannen, weil ich immer befürchte, dass etwas schiefgehen wird.",
      "Obwohl es keine konkreten Belege gibt, mache ich mir übermäßig Sorgen um viele Dinge.",
    ],
  },
  {
    id: "emotional_inhibition",
    label: "Emotionale Gehemmtheit",
    items: [
      "Ich finde es peinlich, meine Gefühle zu zeigen.",
      "Ich halte meine Gefühle und Emotionen für mich.",
      "Es ist schwierig für mich, spontan zu sein.",
      "Ich kontrolliere mich so stark, dass Menschen denken, ich habe keine Gefühle.",
      "Menschen halten mich für kalt oder gefühllos.",
    ],
  },
  {
    id: "unrelenting_standards",
    label: "Hohe Standards / Überkritik",
    items: [
      "Ich bin überkritisch gegenüber mir und anderen, wenn es um Leistung geht.",
      "Ich kann mich kaum entspannen, weil ich das Gefühl habe, so viel tun zu müssen.",
      "Ich mache mir viel Druck, Dinge zu erledigen — ich kann keine Pause einlegen.",
      "Meine persönlichen Standards sind so hoch, dass ich fast nie das Gefühl habe, genug getan zu haben.",
      "Die Zeit und Energie, die ich in die Erledigung der wichtigen Dinge des Lebens investieren muss, ist enorm.",
    ],
  },
  {
    id: "punitiveness",
    label: "Bestrafen",
    items: [
      "Wenn jemand Fehler macht, hat er eine Bestrafung verdient.",
      "Ich finde es schwer, den Schwächen anderer oder meinen eigenen gegenüber mitfühlend zu sein.",
      "Ich glaube, dass Menschen die Konsequenzen für ihr Fehlverhalten tragen sollen.",
      "Ich vergebe mir selbst wenig, wenn ich etwas falsch mache.",
      "Ich bin sehr wütend auf mich selbst, wenn ich einen Fehler mache.",
    ],
  },
];

// Maximum score per item — YSQ-S3 uses a 6-point Likert scale:
// 1 = trifft überhaupt nicht auf mich zu, 6 = trifft vollkommen auf mich zu
export const YSQ_MAX_ITEM_SCORE = 6;
export const YSQ_MAX_SCHEMA_SCORE = 5 * YSQ_MAX_ITEM_SCORE; // 30 at 1-6 scale

// Lookup map: schema index string "0"–"17" → YsqSchema
export const YSQ_SCHEMA_MAP = new Map(YSQ_SCHEMAS.map((s, i) => [String(i), s]));

// 6-point Likert answer scale labels — standard YSQ-S3
export const YSQ_ANSWER_SCALE = [
  { value: 1, label: "Trifft überhaupt nicht zu" },
  { value: 2, label: "Trifft größtenteils nicht zu" },
  { value: 3, label: "Trifft eher nicht zu" },
  { value: 4, label: "Trifft eher zu" },
  { value: 5, label: "Trifft größtenteils zu" },
  { value: 6, label: "Trifft vollkommen zu" },
];
