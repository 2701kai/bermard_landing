import { TICKER } from "@/content/bevmard";

/** Language marquee under the hero. Pure CSS; pauses on hover and under reduced motion. */
export function Ticker() {
  const List = () => (
    <ul className="m-0 flex list-none p-0 py-3.5">
      {TICKER.map((name) => (
        <li
          key={name}
          className="flex items-center gap-[22px] px-[22px] font-display text-[22px] font-bold tracking-[0.06em] whitespace-nowrap text-muted uppercase after:h-1.5 after:w-1.5 after:rounded-full after:bg-orange after:content-['']"
        >
          {name}
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="ticker-mask relative mt-14 overflow-hidden border-y border-line-soft bg-ink-1/60"
      aria-hidden="true"
    >
      <div className="flex w-max animate-ticker hover:[animation-play-state:paused] motion-reduce:animate-none">
        <List />
        <List />
      </div>
    </div>
  );
}
