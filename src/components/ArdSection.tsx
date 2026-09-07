import { ARD } from "@/content/bevmard";
import { Reveal } from "./Reveal";

export function ArdSection() {
  return (
    <section id="ard" className="py-[72px] md:py-24">
      <div className="wrap">
        <div className="mb-11 flex max-w-[720px] flex-col gap-3.5">
          <p className="eyebrow">The name on the plate</p>
          <h2 className="h2">
            Three letters. <span className="text-orange">One</span> shift.
          </h2>
          <p className="max-w-[58ch] text-[17px] text-muted">
            Bernard was the colleague who knew every machine in the hall and could translate “something around 2,500 an
            hour” into a real spec before you finished the sentence. BEVMard is that colleague, on every language, every
            hour.
          </p>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-[10px] border border-line bg-ink-1 md:grid-cols-3">
          {ARD.map((col, i) => (
            <Reveal
              key={col.letter}
              delay={i * 0.08}
              className="flex flex-col gap-3.5 border-line px-7 pt-8 pb-[30px] not-last:border-b md:not-last:border-r md:not-last:border-b-0"
            >
              <div className="font-display text-[120px] leading-[0.8] font-black tracking-[-0.02em] text-orange">
                {col.letter}
              </div>
              <div className="wide mt-1.5 font-body text-[13px] font-bold tracking-[0.2em] text-blue-soft uppercase">
                {col.word}
              </div>
              <h3 className="text-[22px] leading-[1.25] font-semibold" style={{ textWrap: "balance" }}>
                {col.title}
              </h3>
              <p className="max-w-[42ch] text-[15.5px] text-muted">{col.body}</p>
              <div className="mt-auto border-t border-dashed border-line pt-3.5 font-mono text-[12px] text-dim">
                {col.note.map(([k, v]) => (
                  <div key={k}>
                    <b className="font-medium text-muted">{k}:</b> {v}
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
