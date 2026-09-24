/**
 * All copy and demo data for the BEVMard landing page lives here.
 * Marketing edits this file; components stay untouched.
 */

export type Language = {
  code: string;
  name: string;
  /** The buyer's brief, written the way a real buyer types, not a translator. */
  req: string;
  /** Bevmard's first line, in the same language. */
  reply: string;
};

/**
 * The same vague brief in every language bevmaq.com speaks.
 * Replace with the real ten and have each line native-checked.
 */
export const LANGS: readonly Language[] = [
  {
    code: "EN",
    name: "English",
    req: "I need a filler for my new Syrah line. Dunno, capacity around 2,500 bottles an hour… got something available?",
    reply: "Got it: filler for still wine, about 2,500 bottles/hour, 0.75 l glass. Three on the floor right now:",
  },
  {
    code: "DE",
    name: "Deutsch",
    req: "Ich brauch einen Füller für meine neue Syrah-Linie. Keine Ahnung, so um die 2.500 Flaschen die Stunde… habt ihr da was?",
    reply: "Verstanden: Füller für Stillwein, ca. 2.500 Fl/h, 0,75 l Glas. Drei sind gerade verfügbar:",
  },
  {
    code: "FR",
    name: "Français",
    req: "Il me faut une tireuse pour ma nouvelle ligne Syrah. Je sais pas, environ 2 500 bouteilles/heure… vous avez quelque chose de dispo ?",
    reply: "Compris : tireuse pour vin tranquille, ~2 500 b/h, verre 0,75 l. Trois disponibles en ce moment :",
  },
  {
    code: "ES",
    name: "Español",
    req: "Necesito una llenadora para mi nueva línea de Syrah. No sé, unas 2.500 botellas por hora… ¿tenéis algo disponible?",
    reply: "Entendido: llenadora para vino tranquilo, ~2.500 b/h, vidrio 0,75 l. Tres disponibles ahora mismo:",
  },
  {
    code: "IT",
    name: "Italiano",
    req: "Mi serve una riempitrice per la nuova linea Syrah. Boh, circa 2.500 bottiglie l’ora… avete qualcosa di disponibile?",
    reply: "Capito: riempitrice per vino fermo, ~2.500 b/h, vetro 0,75 l. Tre disponibili adesso:",
  },
  {
    code: "PT",
    name: "Português",
    req: "Preciso de uma enchedora para a minha nova linha de Syrah. Sei lá, umas 2.500 garrafas por hora… têm alguma coisa disponível?",
    reply: "Entendido: enchedora para vinho tranquilo, ~2.500 g/h, vidro 0,75 l. Três disponíveis agora:",
  },
  {
    code: "NL",
    name: "Nederlands",
    req: "Ik zoek een vulmachine voor mijn nieuwe Syrah-lijn. Geen idee, zo’n 2.500 flessen per uur… hebben jullie iets?",
    reply: "Begrepen: vulmachine voor stille wijn, ~2.500 fl/u, 0,75 l glas. Drie nu beschikbaar:",
  },
  {
    code: "PL",
    name: "Polski",
    req: "Potrzebuję rozlewaczki do nowej linii Syrah. Nie wiem, jakieś 2 500 butelek na godzinę… macie coś dostępnego?",
    reply: "Jasne: rozlewaczka do wina spokojnego, ~2 500 but./h, szkło 0,75 l. Trzy dostępne od ręki:",
  },
  {
    code: "TR",
    name: "Türkçe",
    req: "Yeni Syrah hattım için bir dolum makinesi lazım. Bilmiyorum, saatte 2.500 şişe civarı… elinizde bir şey var mı?",
    reply: "Anladım: sakin şarap için dolum makinesi, ~2.500 şişe/saat, 0,75 l cam. Şu an üç tane mevcut:",
  },
  {
    code: "CS",
    name: "Čeština",
    req: "Potřebuju plničku pro novou linku na Syrah. Nevím, tak 2 500 lahví za hodinu… máte něco k dispozici?",
    reply: "Rozumím: plnička na tichá vína, ~2 500 lahví/h, sklo 0,75 l. Tři jsou teď k dispozici:",
  },
];

const first = LANGS[0];
if (!first) throw new Error("LANGS must not be empty");
/** The language the page renders at rest (server side). */
export const FIRST_LANG: Language = first;

/** Progress lines shown while Bevmard works. */
export const STATUS: readonly string[] = [
  "reading the request · product: still wine · container: 0.75 l glass · target ≈ 2,500 bph",
  "checking live availability · product.bevmaq.com/V1/status",
  "ranking 3 of 41 fillers · sold machines excluded",
];

export type Machine = {
  tag: string;
  best?: boolean;
  bph: string;
  name: string;
  spec: [string, string];
  location: string;
};

/** Placeholder machines until the product API feed is wired in. */
export const MACHINES: readonly Machine[] = [
  {
    tag: "Best fit",
    best: true,
    bph: "2,400",
    name: "Monobloc rinser · filler · corker, 24 valves",
    spec: ["0.75 l Bordeaux & Burgundy", "still wine · built 2017"],
    location: "Piedmont, IT",
  },
  {
    tag: "Headroom",
    bph: "3,200",
    name: "Gravity filler, 32 valves",
    spec: ["glass 0.375 – 1.5 l", "still wine · built 2014"],
    location: "Baden-Württemberg, DE",
  },
  {
    tag: "Future-proof",
    bph: "2,000",
    name: "Isobaric filler, 20 valves",
    spec: ["still & sparkling · 0.75 l", "built 2019"],
    location: "Catalonia, ES",
  },
];

export const STAGED = {
  label: "Inquiry staged",
  machine: "Monobloc 24 valves",
  next: "your BEVMAQ contact confirms price & delivery",
} as const;

export const NAMEPLATE: readonly [string, string, boolean?][] = [
  ["Typ / Type", "Artificial Recommendation Dispatcher"],
  ["Serial", "ARD-0001"],
  ["Languages", "10, and every one you throw at him", true],
  ["Shift", "24/7, no coffee breaks"],
  ["Inventory", "live from product.bevmaq.com"],
  ["Maker", "BMi · BEVMAQ GmbH"],
];

export const TICKER: readonly string[] = [...LANGS.map((l) => l.name), "and the one you write in"];

export type ArdColumn = {
  letter: string;
  word: string;
  title: string;
  body: string;
  note: [string, string][];
};

export const ARD: readonly ArdColumn[] = [
  {
    letter: "A",
    word: "Artificial",
    title: "Understands the vague version.",
    body: "Product, container, capacity, budget, the thing you didn't mention: Bevmard reads a half-sentence like an experienced sales engineer, and asks back only when it actually matters.",
    note: [
      ["Input", "“dunno, around 2,500 an hour”"],
      ["Spec", "still wine · 0.75 l · ≈2,500 bph · rotary preferred"],
    ],
  },
  {
    letter: "R",
    word: "Recommendation",
    title: "Matches against what is on the floor.",
    body: "Every suggestion is checked against BEVMAQ's live inventory before it reaches you. Sold machines don't show up. Reserved ones say so. Three options, ranked, with a reason each.",
    note: [
      ["Source", "product.bevmaq.com · /V1/status"],
      ["Rule", "only available machines get recommended"],
    ],
  },
  {
    letter: "D",
    word: "Dispatcher",
    title: "Routes. Never buys.",
    body: "Bevmard stages an inquiry with the right machine and the right BEVMAQ contact attached. Nothing is ordered, reserved or charged without a human on both ends of the line.",
    note: [
      ["Output", "staged inquiry → sales contact"],
      ["Never", "orders · reservations · payments"],
    ],
  },
];

export type HoodItem = { k: string; title: string; body: string };

export const HOOD: readonly HoodItem[] = [
  {
    k: "Quick or thorough",
    title: "Quick on small talk, thorough on specs.",
    body: "“Do you ship to Austria?” gets an instant answer. The moment a machine spec is on the table, Bevmard slows down and does the full check: product, container, capacity, availability, and what you did not say.",
  },
  {
    k: "Progress lines",
    title: "You see what he is doing, not a spinner.",
    body: "Status lines (“checking live availability…”) appear while he works, so you know what is happening at every step. That is the little log you saw in the demo above.",
  },
  {
    k: "Your language",
    title: "Every turn, in the language you wrote.",
    body: "Switch from German to Polish mid-conversation and he switches with you. He answers in the language of your last message, and the machines he finds stay the same.",
  },
  {
    k: "Staged, not sent",
    title: "Quoted from the floor, approved by a person.",
    body: "Every price and availability he quotes is read from the inventory at the moment you ask, never from memory. Anything that would change something on our side is staged until someone at BEVMAQ approves it.",
  },
];

export type Guarantee = { icon: "shield" | "clock" | "lines"; title: string; body: string };

export const GUARANTEES: readonly Guarantee[] = [
  {
    icon: "shield",
    title: "No purchase without a person",
    body: "Bevmard stages inquiries. Your BEVMAQ contact confirms price, delivery and inspection.",
  },
  {
    icon: "clock",
    title: "Live inventory, not a brochure",
    body: "Availability is read at the moment you ask. What he shows you can be inspected this week.",
  },
  {
    icon: "lines",
    title: "Remembers your line, not your data",
    body: "He keeps your production context for the conversation and forgets what you ask him to forget.",
  },
];

/**
 * Outbound links. Public bevmaq.com pages only: nothing here should point at
 * internal tooling or roadmap material.
 */
export const LINKS = {
  buy: "https://www.bevmaq.com/buy/",
  contact: "https://www.bevmaq.com/contact/",
  home: "https://www.bevmaq.com/",
  linkedin: "https://www.linkedin.com/company/bevmaq-gmbh",
} as const;
