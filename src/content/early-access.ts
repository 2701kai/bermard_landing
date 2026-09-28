/**
 * Copy for the early-access gate page (/early-access), one block per language. Closed mode (the default) shows
 * kicker, headline, lede, closedLine and the team entry; public mode (GATE_PUBLIC=on) shows scarcity, fair, the
 * sign-up button and the fine print instead of closedLine and the team entry.
 * Hyphens only, German with real umlauts, informal du/tu.
 */
import type { Locale } from "@/lib/gate/locale";

export type GateCopy = {
  kicker: string;
  headline: string;
  lede: string;
  scarcity: string;
  fair: string;
  /** Closed mode: replaces scarcity and fair. */
  closedLine: string;
  /** Closed mode: the quiet team sign-in entry at the bottom. */
  teamEntry: string;
  /** Fine print up to the link (keeps its own trailing space); `privacyLink` follows as the link to `privacyUrl`, then a period. */
  fine: string;
  privacyLink: string;
  privacyUrl: string;
  error: string;
  notConfigured: string;
  waitKicker: string;
  waitHeadline: string;
  waitNumberLabel: string;
  waitBody: string;
  signedInAs: string;
  signOut: string;
};

// bevmaq.com serves /de/privacy/ and /privacy/ (200); /it/privacy/ is a 404, so Italian links the English page.
const PRIVACY_DE = "https://www.bevmaq.com/de/privacy/";
const PRIVACY_EN = "https://www.bevmaq.com/privacy/";

export const GATE_COPY: Record<Locale, GateCopy> = {
  de: {
    kicker: "EARLY ACCESS · NUR AUF EINLADUNG",
    headline: "Herzlichen Glückwunsch.",
    lede: "Du interessierst dich für State-of-the-Art-Software, die dir im Alltag wirklich weiterhilft. Wir freuen uns. Und ehrlich gesagt sind wir selbst ein bisschen aufgeregt.",
    scarcity:
      "Wir öffnen den Zugang in kleinen Runden. Registriere dich jetzt als Early Adopter und sichere dir deinen Vorsprung, bevor es alle haben.",
    fair: "Live zu sehen auf der CIBUS TEC 2026 in Parma.",
    closedLine: "Wir öffnen den Zugang in kleinen Runden. Die erste startet auf der CIBUS TEC 2026 in Parma.",
    teamEntry: "BEVMAQ-Team? Hier anmelden.",
    fine: "Mit der Registrierung speichern wir deinen Namen und deine E-Mail-Adresse, um dich zum Early Access zu kontaktieren. Details in der ",
    privacyLink: "Datenschutzerklärung",
    privacyUrl: PRIVACY_DE,
    error: "Das hat nicht geklappt. Versuch es bitte noch einmal.",
    notConfigured: "Google sign-in not configured",
    waitKicker: "✓ REGISTRIERT",
    waitHeadline: "Du bist dabei.",
    waitNumberLabel: "Early Adopter Nr.",
    waitBody:
      "Sobald deine Runde startet, melden wir uns bei dir. Bis dahin: Wir sehen uns auf der CIBUS TEC 2026 in Parma.",
    signedInAs: "Angemeldet als",
    signOut: "Abmelden",
  },
  en: {
    kicker: "EARLY ACCESS · BY INVITATION",
    headline: "Congratulations.",
    lede: "You're interested in state-of-the-art software that genuinely helps you day to day. We're delighted. And honestly, a little excited ourselves.",
    scarcity:
      "We're opening access in small rounds. Register now as an early adopter and lock in your head start before everyone else has it.",
    fair: "See it live at CIBUS TEC 2026 in Parma.",
    closedLine: "We're opening access in small rounds. The first one starts at CIBUS TEC 2026 in Parma.",
    teamEntry: "BEVMAQ team? Sign in here.",
    fine: "When you register, we store your name and email address to contact you about early access. Details in our ",
    privacyLink: "privacy policy",
    privacyUrl: PRIVACY_EN,
    error: "That didn't work. Please try again.",
    notConfigured: "Google sign-in not configured",
    waitKicker: "✓ REGISTERED",
    waitHeadline: "You're on the list.",
    waitNumberLabel: "Early adopter no.",
    waitBody: "We'll reach out as soon as your round opens. Until then: see you at CIBUS TEC 2026 in Parma.",
    signedInAs: "Signed in as",
    signOut: "Sign out",
  },
  it: {
    kicker: "EARLY ACCESS · SU INVITO",
    headline: "Congratulazioni.",
    lede: "Ti interessa un software all'avanguardia che ti aiuta davvero, ogni giorno. Ne siamo felici. E, a dirla tutta, anche un po' emozionati.",
    scarcity:
      "Apriamo l'accesso a piccoli gruppi. Registrati ora come early adopter e assicurati il vantaggio prima che ce l'abbiano tutti.",
    fair: "Dal vivo a CIBUS TEC 2026, Parma.",
    closedLine: "Apriamo l'accesso a piccoli gruppi. Il primo parte a CIBUS TEC 2026, Parma.",
    teamEntry: "Team BEVMAQ? Accedi qui.",
    fine: "Con la registrazione salviamo il tuo nome e il tuo indirizzo email per contattarti sull'early access. Dettagli nell'",
    privacyLink: "informativa sulla privacy",
    privacyUrl: PRIVACY_EN,
    error: "Qualcosa è andato storto. Riprova.",
    notConfigured: "Google sign-in not configured",
    waitKicker: "✓ REGISTRATO",
    waitHeadline: "Ci sei.",
    waitNumberLabel: "Early adopter n.",
    waitBody: "Ti scriviamo appena si apre il tuo turno. Nel frattempo: ci vediamo a CIBUS TEC 2026, Parma.",
    signedInAs: "Accesso come",
    signOut: "Esci",
  },
};
