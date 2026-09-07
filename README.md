# bevmard-landing

Campaign landing page for **BEVMard**, BEVMAQ's Artificial Recommendation Dispatcher. Dark dispatch-board look, orange for Bevmard's voice, blue for everything else, a scripted console demo that cycles one buyer brief through ten languages, and a conveyor of bottles behind the hero.

## Stack

- Next 16.3 (App Router, Turbopack, React Compiler on via `babel-plugin-react-compiler`)
- React 19.2
- TypeScript 7.0 (native compiler; `tsconfig.json` is TS 7 clean, no `baseUrl`)
- Tailwind CSS 4.3 via `@tailwindcss/postcss`, tokens in `src/app/globals.css`
- Motion 13.2 (`motion/react`) for springs, staggers, in-view reveals, hover and press
- Bun 1.4 as runtime, package manager and script runner
- Biome 2.5 for lint and format (typescript-eslint does not support TS 7 yet; Biome has its own parser)

## Run

```sh
bun install
bun dev        # http://localhost:3000
bun run build
bun start
bun run lint       # biome check
bun run format     # biome format --write
bun run typecheck  # tsc 7, native
```

## Where things live

```
src/
  app/
    layout.tsx      fonts (next/font), metadata, MotionConfig reducedMotion="user"
    page.tsx        section order
    globals.css     Tailwind import, @theme tokens, the few custom classes
    icon.svg        favicon
  content/
    bevmard.ts      every string on the page: languages, machines, copy, links
  components/
    Hero.tsx        wordmark, expansion, lede, CTAs, nameplate, page-load choreography
    Console.tsx     the scripted dispatch demo (client)
    Conveyor.tsx    ambient canvas behind the hero (client)
    Ticker.tsx      language marquee (CSS only)
    ArdSection.tsx  A / R / D
    Languages.tsx   ten tiles, one brief each
    UnderTheHood.tsx, CtaBlock.tsx, Footer.tsx, TopBar.tsx
    Reveal.tsx      whileInView wrapper + shared spring / ease constants
```

## Editing the campaign

Marketing edits `src/content/bevmard.ts` only. The ten languages are a placeholder guess at bevmaq.com's set; replace them and have each line native-checked. The three machines are placeholders until the product API feed is wired in.

## Reduced motion

`MotionConfig reducedMotion="user"` disables transform animations for users who asked for less motion; opacity still fades. The console then swaps languages without typing, the conveyor canvas is not rendered, and the ticker stands still.

## Deploy

Vercel picks up Bun from `packageManager`. No environment variables are required; `NEXT_PUBLIC_BEVMARD_URL` in `.env.example` is reserved for the live agent link.
