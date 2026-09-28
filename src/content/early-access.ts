/**
 * Copy for the early-access gate page (/early-access), one block per language. Closed mode (the default) shows
 * kicker, headline, lede and closedLine; public mode (GATE_PUBLIC=on) shows scarcity, fair, the sign-up button and
 * the fine print instead of closedLine. Both end on the quiet link to /team, the staff sign-in (team* fields).
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
  /** Both modes: the quiet link to /team at the bottom. */
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
  /** /team, the staff sign-in. */
  teamKicker: string;
  teamHeadline: string;
  teamLede: string;
  teamNonTeam: string;
  teamNonTeamLink: string;
  /** `{email}` is replaced. */
  teamSignedIn: string;
  teamContinue: string;
  /** Public mode: the e-mail code and phone callback alternatives under the Google button. */
  or: string;
  tabEmail: string;
  tabPhone: string;
  emailLabel: string;
  emailSend: string;
  /** `{email}` is replaced. */
  codeSent: string;
  codeLabel: string;
  codeConfirm: string;
  codeResend: string;
  codeWrong: string;
  codeExpired: string;
  phoneName: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneSubmit: string;
  phoneHint: string;
  phoneInvalid: string;
  /** The code mail; `{code}` is replaced. */
  mailSubject: string;
  mailLine: string;
  mailValidity: string;
  /** /team signed-in: `{count}` is replaced; the link downloads the CSV export. */
  teamCount: string;
  teamCsv: string;
  /** Welcome mail on a first registration with a verified email; `{n}`, `{first}`, `{host}` are replaced. */
  welcomeSubject: string;
  welcomeHello: string;
  /** The greeting when there is no name. */
  welcomeHelloBare: string;
  welcomeLine1: string;
  welcomeLine2: string;
  welcomeBye: string;
  welcomeSign: string;
  welcomeFooter: string;
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
    fine: "Mit der Registrierung speichern wir deinen Namen und deine E-Mail-Adresse oder Telefonnummer, um dich zum Early Access zu kontaktieren. Details in der ",
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
    teamKicker: "BEVMAQ · TEAM",
    teamHeadline: "Team-Login.",
    teamLede: "Melde dich mit deinem @bevmaq.com-Google-Konto an.",
    teamNonTeam: "Dieser Zugang ist nur für das BEVMAQ-Team.",
    teamNonTeamLink: "Als Early Adopter registrierst du dich hier.",
    teamSignedIn: "Angemeldet als {email}.",
    teamContinue: "Weiter",
    or: "oder",
    tabEmail: "Mit E-Mail",
    tabPhone: "Mit Telefon",
    emailLabel: "E-Mail-Adresse",
    emailSend: "Code senden",
    codeSent: "Wir haben dir einen 6-stelligen Code an {email} geschickt.",
    codeLabel: "Code",
    codeConfirm: "Bestätigen",
    codeResend: "Code erneut senden",
    codeWrong: "Der Code stimmt nicht.",
    codeExpired: "Der Code ist abgelaufen. Fordere einen neuen an.",
    phoneName: "Name",
    phoneLabel: "Telefonnummer mit Ländervorwahl",
    phonePlaceholder: "+49 …",
    phoneSubmit: "Rückruf anfordern",
    phoneHint: "Wir rufen dich an, sobald deine Runde startet.",
    phoneInvalid: "Bitte gib die Nummer mit Ländervorwahl an, zum Beispiel +49.",
    mailSubject: "Dein Code für BEVMAQ Early Access: {code}",
    mailLine: "Dein Code: {code}",
    mailValidity: "Er gilt 15 Minuten. Wenn du dich nicht registriert hast, ignoriere diese E-Mail einfach.",
    teamCount: "{count} Early Adopter registriert.",
    teamCsv: "Liste als CSV",
    welcomeSubject: "Du bist dabei: BEVMAQ Early Adopter Nr. {n}",
    welcomeHello: "Hallo {first},",
    welcomeHelloBare: "Hallo,",
    welcomeLine1: "schön, dass du dabei bist. Deine Early-Adopter-Nummer: {n}.",
    welcomeLine2:
      "Wir öffnen den Zugang in kleinen Runden und melden uns, sobald deine startet. Live zu sehen: CIBUS TEC 2026 in Parma.",
    welcomeBye: "Bis bald",
    welcomeSign: "Dein BEVMAQ-Team",
    welcomeFooter:
      "Du bekommst diese E-Mail, weil du dich auf {host} als Early Adopter registriert hast. Datenschutz: https://www.bevmaq.com/de/privacy/",
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
    fine: "When you register, we store your name and your email address or phone number to contact you about early access. Details in our ",
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
    teamKicker: "BEVMAQ · TEAM",
    teamHeadline: "Team sign-in.",
    teamLede: "Sign in with your @bevmaq.com Google account.",
    teamNonTeam: "This sign-in is for the BEVMAQ team only.",
    teamNonTeamLink: "Register as an early adopter here.",
    teamSignedIn: "Signed in as {email}.",
    teamContinue: "Continue",
    or: "or",
    tabEmail: "With email",
    tabPhone: "With phone",
    emailLabel: "Email address",
    emailSend: "Send code",
    codeSent: "We sent a 6-digit code to {email}.",
    codeLabel: "Code",
    codeConfirm: "Confirm",
    codeResend: "Send the code again",
    codeWrong: "That code isn't right.",
    codeExpired: "That code has expired. Request a new one.",
    phoneName: "Name",
    phoneLabel: "Phone number with country code",
    phonePlaceholder: "+44 …",
    phoneSubmit: "Request a callback",
    phoneHint: "We'll call you as soon as your round opens.",
    phoneInvalid: "Please include the country code, for example +49.",
    mailSubject: "Your BEVMAQ Early Access code: {code}",
    mailLine: "Your code: {code}",
    mailValidity: "It is valid for 15 minutes. If you didn't sign up, just ignore this email.",
    teamCount: "{count} early adopters registered.",
    teamCsv: "Download as CSV",
    welcomeSubject: "You're on the list: BEVMAQ early adopter no. {n}",
    welcomeHello: "Hi {first},",
    welcomeHelloBare: "Hi,",
    welcomeLine1: "great to have you on board. Your early adopter number: {n}.",
    welcomeLine2:
      "We're opening access in small rounds and will get in touch as soon as yours starts. See it live at CIBUS TEC 2026 in Parma.",
    welcomeBye: "See you soon,",
    welcomeSign: "The BEVMAQ team",
    welcomeFooter:
      "You're receiving this email because you registered as an early adopter on {host}. Privacy: https://www.bevmaq.com/privacy/",
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
    fine: "Con la registrazione salviamo il tuo nome e il tuo indirizzo email o numero di telefono per contattarti sull'early access. Dettagli nell'",
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
    teamKicker: "BEVMAQ · TEAM",
    teamHeadline: "Accesso team.",
    teamLede: "Accedi con il tuo account Google @bevmaq.com.",
    teamNonTeam: "Questo accesso è riservato al team BEVMAQ.",
    teamNonTeamLink: "Registrati come early adopter qui.",
    teamSignedIn: "Accesso come {email}.",
    teamContinue: "Continua",
    or: "oppure",
    tabEmail: "Con email",
    tabPhone: "Con telefono",
    emailLabel: "Indirizzo email",
    emailSend: "Invia codice",
    codeSent: "Ti abbiamo inviato un codice di 6 cifre a {email}.",
    codeLabel: "Codice",
    codeConfirm: "Conferma",
    codeResend: "Invia di nuovo il codice",
    codeWrong: "Il codice non è corretto.",
    codeExpired: "Il codice è scaduto. Richiedine uno nuovo.",
    phoneName: "Nome",
    phoneLabel: "Numero di telefono con prefisso internazionale",
    phonePlaceholder: "+39 …",
    phoneSubmit: "Richiedi una chiamata",
    phoneHint: "Ti chiamiamo appena si apre il tuo turno.",
    phoneInvalid: "Inserisci il numero con il prefisso internazionale, per esempio +39.",
    mailSubject: "Il tuo codice BEVMAQ Early Access: {code}",
    mailLine: "Il tuo codice: {code}",
    mailValidity: "È valido per 15 minuti. Se non ti sei registrato, ignora questa email.",
    teamCount: "{count} early adopter registrati.",
    teamCsv: "Scarica CSV",
    welcomeSubject: "Ci sei: BEVMAQ early adopter n. {n}",
    welcomeHello: "Ciao {first},",
    welcomeHelloBare: "Ciao,",
    welcomeLine1: "che bello averti con noi. Il tuo numero di early adopter: {n}.",
    welcomeLine2:
      "Apriamo l'accesso a piccoli gruppi e ti contatteremo appena si apre il tuo turno. Dal vivo a CIBUS TEC 2026, Parma.",
    welcomeBye: "A presto,",
    welcomeSign: "Il team BEVMAQ",
    welcomeFooter:
      "Ricevi questa email perché hai effettuato la registrazione come early adopter su {host}. Privacy: https://www.bevmaq.com/privacy/",
  },
};
