export interface SchemaInfo {
  id: string;
  label: string;
  coreBeliefText: string;
  description: string;
  typicalTrigger: string;
  guidedQuestions: string[];
}

export const SCHEMAS: SchemaInfo[] = [
  {
    id: "abandonment",
    label: "Verlassenheit",
    coreBeliefText: "Menschen, die mir wichtig sind, werden mich früher oder später verlassen.",
    description: "Die Erwartung, dass nahestehende Menschen sterben, weggehen oder mich zugunsten anderer aufgeben werden.",
    typicalTrigger: "Wenn jemand Abstand nimmt, eine Beziehung beendet oder unzuverlässig ist.",
    guidedQuestions: [
      "Wann hast du das Gefühl des Verlassenwerdens zum ersten Mal gespürt? Was ist damals passiert?",
      "Wie alt warst du, und wer war damals wichtig für dich?",
      "Wie hast du dich damals verhalten, um zu verhindern, dass jemand geht?",
      "Welche Muster erkennst du heute, wenn du Nähe oder Abstand bei anderen wahrnimmst?",
    ],
  },
  {
    id: "mistrust",
    label: "Misstrauen & Missbrauch",
    coreBeliefText: "Andere werden mich früher oder später verletzen, benutzen oder hintergehen.",
    description: "Die Erwartung, dass andere absichtlich verletzen, demütigen, betrügen oder manipulieren.",
    typicalTrigger: "Wenn jemand einen Fehler macht, etwas vergisst oder undurchsichtig handelt.",
    guidedQuestions: [
      "Wann hat jemand Wichtiges dein Vertrauen gebrochen? Was ist damals passiert?",
      "Wie hast du dich als Kind oder Jugendlicher vor Verletzungen geschützt?",
      "Wo in deinem Körper spürst du Misstrauen, wenn es aktiviert wird?",
      "Gibt es Menschen in deinem Leben, denen du tatsächlich vertrauen könntest — was hält dich davon ab?",
    ],
  },
  {
    id: "emotional_deprivation",
    label: "Emotionale Entbehrung",
    coreBeliefText: "Meine emotionalen Bedürfnisse nach Wärme, Empathie und Fürsorge werden nie wirklich erfüllt.",
    description: "Die Überzeugung, dass die eigenen emotionalen Bedürfnisse von anderen nie angemessen befriedigt werden.",
    typicalTrigger: "Wenn andere nicht von sich aus fragen, wie es einem geht, oder Fürsorge nicht zeigen.",
    guidedQuestions: [
      "Was hast du als Kind emotional gebraucht, das du nicht oder zu selten bekommen hast?",
      "Hast du gelernt, deine Bedürfnisse zu verstecken oder zu minimieren? Warum?",
      "Wie reagierst du, wenn jemand dir gegenüber wirklich fürsorglich ist — fühlt es sich echt an?",
      "Was bräuchtest du heute, um dich emotional wirklich gesehen zu fühlen?",
    ],
  },
  {
    id: "defectiveness",
    label: "Unzulänglichkeit & Scham",
    coreBeliefText: "Ich bin im Kern fehlerhaft, wertlos oder nicht liebenswert — wenn andere mich wirklich kennen würden, würden sie mich ablehnen.",
    description: "Das Gefühl, im Wesentlichen defekt, schlecht, unerwünscht oder minderwertig zu sein.",
    typicalTrigger: "Kritik, Ablehnung, Vergleiche mit anderen, Intimität.",
    guidedQuestions: [
      "Welche Botschaften hast du früh in deinem Leben über dich selbst bekommen — direkt oder indirekt?",
      "Gibt es eine innere Stimme, die dir sagt, du seiest fehlerhaft? Wie klingt sie — wessen Stimme könnte das sein?",
      "Wann versteckst du Teile von dir, aus Angst, abgelehnt zu werden?",
      "Was wäre, wenn genau die Dinge, die du für Fehler hältst, dich menschlich und verbindbar machen?",
    ],
  },
  {
    id: "social_isolation",
    label: "Soziale Isolation",
    coreBeliefText: "Ich bin grundlegend anders als andere Menschen — ich gehöre nirgendwo dazu.",
    description: "Das Gefühl, von der übrigen Welt isoliert, anders oder nicht dazugehörig zu sein.",
    typicalTrigger: "Soziale Situationen, Gruppen, Gespräche über persönliche Themen.",
    guidedQuestions: [
      "Wann hast du dich zum ersten Mal wie ein Außenseiter gefühlt? Was war der Auslöser?",
      "Gibt es Situationen, in denen du dich zugehörig fühlst — auch wenn sie selten sind?",
      "Was ist das 'Anders-Sein', das du an dir wahrgenommen hast — ist das wirklich ein Makel?",
      "Was bräuchtest du, um dich einer Gruppe oder Person wirklich anzuschließen?",
    ],
  },
  {
    id: "failure",
    label: "Versagen",
    coreBeliefText: "Ich versage früher oder später bei allem, was mir wirklich wichtig ist — im Vergleich zu anderen bin ich nicht kompetent genug.",
    description: "Die Überzeugung, dass man im Leistungsbereich versagt hat, zwangsläufig versagen wird oder grundlegend inkompetent ist.",
    typicalTrigger: "Herausforderungen, Vergleiche mit Gleichaltrigen, Feedback, neue Aufgaben.",
    guidedQuestions: [
      "Wo hast du gelernt, dass du nicht gut genug bist? Was hat dir das vermittelt?",
      "Erinnere dich an einen echten Erfolg in deinem Leben — wie hast du ihn bewertet?",
      "Wie misst du 'Erfolg' und 'Versagen'? Wessen Maßstab benutzt du?",
      "Was würdest du versuchen, wenn du weißt, dass Scheitern keine Gefahr ist?",
    ],
  },
  {
    id: "subjugation",
    label: "Unterwerfung",
    coreBeliefText: "Ich muss die Kontrolle anderen überlassen oder ihre Bedürfnisse über meine stellen — sonst drohen Ablehnung oder Bestrafung.",
    description: "Übermäßige Unterwerfung unter andere, um Wut, Vergeltung oder Verlassenwerden zu vermeiden.",
    typicalTrigger: "Wenn eigene Bedürfnisse mit denen anderer kollidieren; Konfliktsituationen.",
    guidedQuestions: [
      "Wessen Bedürfnisse hast du als Kind oder Jugendlicher vor deine eigenen gestellt? Warum?",
      "Was passiert in dir, wenn du 'Nein' sagst oder eigene Wünsche äußerst?",
      "Woran erkennst du, dass du dich unterordnest — gibt es körperliche Signale?",
      "Was wäre das Schlimmste, das passieren könnte, wenn du klar sagst, was du willst?",
    ],
  },
  {
    id: "self_sacrifice",
    label: "Selbstaufopferung",
    coreBeliefText: "Ich muss die Bedürfnisse anderer über meine eigenen stellen — sonst bin ich egoistisch und schlechter Mensch.",
    description: "Freiwilliger Verzicht auf die Befriedigung eigener Bedürfnisse, um anderen zu helfen.",
    typicalTrigger: "Wenn andere Hilfe brauchen oder leiden; eigene Bedürfnisse äußern.",
    guidedQuestions: [
      "Was bekommst du dafür, dass du anderen gibst? Wärme, Anerkennung, Sicherheit?",
      "Wann hast du gelernt, dass Eigeninteresse 'egoistisch' ist?",
      "Wie fühlst du dich nach langen Phasen des Gebens — erschöpft, leer, ärgerlich?",
      "Was wäre ein konkreter Schritt, dir selbst gegenüber so fürsorglich zu sein wie gegenüber anderen?",
    ],
  },
  {
    id: "approval_seeking",
    label: "Zustimmungssuche",
    coreBeliefText: "Ich bin nur dann wertvoll und akzeptabel, wenn andere mich mögen und anerkennen.",
    description: "Übermäßige Orientierung am Erlangen von Anerkennung, Zustimmung oder Aufmerksamkeit.",
    typicalTrigger: "Ablehnung, Kritik, Gleichgültigkeit anderer; Entscheidungen, die andere nicht gutheißen.",
    guidedQuestions: [
      "Wessen Anerkennung hast du als Kind am meisten gewollt? Hast du sie bekommen?",
      "Wie veränderst du dich, wenn du Anerkennung suchst — was gibst du von dir auf?",
      "Wann hast du zuletzt eine Entscheidung getroffen, die andere nicht verstanden haben — wie hat sich das angefühlt?",
      "Was würde passieren, wenn du wüsstest, dass du bedingungslos akzeptabel bist?",
    ],
  },
  {
    id: "negativity",
    label: "Negativität & Pessimismus",
    coreBeliefText: "Das Leben ist grundlegend negativ — Verlust, Enttäuschung und Schmerz sind unvermeidlich.",
    description: "Anhaltender Fokus auf negative Aspekte des Lebens unter Vernachlässigung positiver Seiten.",
    typicalTrigger: "Unsicherheiten, Entscheidungen, kleine Rückschläge, Zukunftspläne.",
    guidedQuestions: [
      "Welche frühen Erfahrungen haben dich gelehrt, das Schlechteste zu erwarten?",
      "Dient diese Haltung dir auf eine bestimmte Art — schützt sie dich vor Enttäuschung?",
      "Was wäre das Schlimmste an einem optimistischen Blick auf eine Situation?",
      "Denke an etwas, das tatsächlich gut gelaufen ist — wie hast du es damals bewertet?",
    ],
  },
  {
    id: "emotional_inhibition",
    label: "Emotionale Hemmung",
    coreBeliefText: "Ich darf meine Gefühle nicht zeigen oder spontan handeln — das wäre ein Zeichen von Schwäche oder Kontrollverlust.",
    description: "Übermäßige Hemmung spontaner Handlungen, Gefühle oder Kommunikation.",
    typicalTrigger: "Situationen, die Offenheit, Verletzlichkeit oder Spontaneität erfordern.",
    guidedQuestions: [
      "Was passierte, wenn du als Kind starke Gefühle gezeigt hast? Was war die Reaktion?",
      "Welche Gefühle erlaubst du dir — und welche unterdrückst du?",
      "Wie fühlt es sich an, wenn eine Emotion 'durchkommt'? Was passiert danach?",
      "Was wäre ein sicherer Ort oder Moment, in dem du dich zeigen könntest?",
    ],
  },
  {
    id: "unrelenting_standards",
    label: "Überhöhte Standards",
    coreBeliefText: "Ich muss in allem perfekt sein und höchste Ansprüche erfüllen — alles andere ist Versagen.",
    description: "Der Glaube, dass man nach sehr hohen verinnerlichten Standards streben muss.",
    typicalTrigger: "Fehler, Mittelmäßigkeit, Entspannung, Freizeit — das Gefühl, nicht genug zu tun.",
    guidedQuestions: [
      "Wer hat den Standard 'gut genug' für dich gesetzt? Wurde er je erreicht?",
      "Was passierte, wenn du als Kind einen Fehler gemacht hast?",
      "Wie reagierst du auf deinen eigenen Fehler im Vergleich zum Fehler einer anderen Person?",
      "Was würdest du in deinem Leben anders machen, wenn 'gut genug' wirklich gut genug wäre?",
    ],
  },
  {
    id: "punitiveness",
    label: "Bestrafungsneigung",
    coreBeliefText: "Menschen, die Fehler machen, verdienen harte Kritik und Strafe — das gilt besonders für mich.",
    description: "Der Glaube, dass Menschen für Fehler hart bestraft werden sollten.",
    typicalTrigger: "Eigene Fehler, Fehler anderer, wahrgenommene Schwächen.",
    guidedQuestions: [
      "Wie wurden Fehler in deiner Familie behandelt? Welche Botschaft hast du dazu bekommen?",
      "Wie klingt deine innere Stimme, wenn du einen Fehler machst?",
      "Wenn du einen guten Freund so behandeln würdest wie dich selbst — wie würde sich das anfühlen?",
      "Was wäre ein erster Schritt zu Selbstmitgefühl — nicht als Schwäche, sondern als Stärke?",
    ],
  },
  {
    id: "vulnerability",
    label: "Verletzlichkeit & Bedrohung",
    coreBeliefText: "Eine Katastrophe kann jederzeit eintreten — ich bin dem schutzlos ausgeliefert.",
    description: "Übertriebene Angst vor jederzeit drohenden Katastrophen — Krankheit, Kriminalität, Naturkatastrophen.",
    typicalTrigger: "Ungewöhnliche Körpersymptome, Nachrichten, unsichere Situationen, Reisen.",
    guidedQuestions: [
      "Welche Erfahrungen haben dich gelehrt, dass die Welt grundlegend gefährlich ist?",
      "Gibt es bestimmte Bedrohungsszenarien, die sich immer wiederholen? Was liegt dahinter?",
      "Wie reagiert dein Körper, wenn die Angst auftaucht — was sind die ersten Signale?",
      "Was hilft dir (auch kurzfristig), dich sicher genug zu fühlen, um handlungsfähig zu bleiben?",
    ],
  },
];

export const SCHEMA_MAP = new Map(SCHEMAS.map((s) => [s.id, s]));
