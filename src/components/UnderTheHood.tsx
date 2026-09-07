import { GUARANTEES, type Guarantee, HOOD } from "@/content/bevmard";
import { Reveal } from "./Reveal";

export function UnderTheHood() {
  return (
    <section id="hood" className="pb-[72px] md:pb-24">
      <div className="wrap">
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-12">
          <div className="flex max-w-[720px] flex-col gap-3.5">
            <p className="eyebrow">Under the hood</p>
            <h2 className="h2">
              Made in-house. <span className="text-orange">Wired</span> to the floor.
            </h2>
            <p className="max-w-[58ch] text-[17px] text-muted">
              Bevmard is built by BMi, BEVMAQ's own intelligence team, on the same product API that runs bevmaq.com. No
              demo catalogue, no generic chatbot: he only knows machines that exist, and only recommends the ones that
              are available.
            </p>
          </div>

          <div className="flex flex-col border-t border-line">
            {HOOD.map((item, i) => (
              <Reveal
                key={item.k}
                delay={i * 0.06}
                className="grid grid-cols-1 gap-2 border-b border-line py-[22px] sm:grid-cols-[150px_1fr] sm:gap-5"
              >
                <div className="pt-[3px] font-mono text-[12px] tracking-[0.1em] text-orange uppercase">{item.k}</div>
                <div>
                  <h3 className="mb-1.5 text-[18px] font-semibold">{item.title}</h3>
                  <p className="max-w-[56ch] text-[15px] text-muted">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {GUARANTEES.map((g, i) => (
            <Reveal
              key={g.title}
              delay={i * 0.08}
              className="flex items-start gap-3.5 rounded-lg border border-line-soft bg-ink-1 px-[18px] py-[18px]"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue/12 text-blue-soft">
                <Icon kind={g.icon} />
              </div>
              <div>
                <h3 className="mb-1 text-[15.5px] font-semibold">{g.title}</h3>
                <p className="text-sm text-muted">{g.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Icon({ kind }: { kind: Guarantee["icon"] }) {
  const common = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    className: "h-[18px] w-[18px]",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "shield") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  if (kind === "clock") {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden="true">
      <path d="M4 5h16M4 12h10M4 19h16" />
    </svg>
  );
}
