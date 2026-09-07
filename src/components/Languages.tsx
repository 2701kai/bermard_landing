"use client";

import { motion } from "motion/react";
import { LANGS } from "@/content/bevmard";
import { Reveal, SPRING } from "./Reveal";

export function Languages() {
  return (
    <section id="languages" className="pb-[72px] md:pb-24">
      <div className="wrap">
        <div className="mb-11 flex max-w-[720px] flex-col gap-3.5">
          <p className="eyebrow">Multilingual by default</p>
          <h2 className="h2">
            One request. <span className="text-blue-soft">Ten</span> languages. One answer.
          </h2>
          <p className="max-w-[58ch] text-[17px] text-muted">
            The same Syrah line, the same vague brief, in every language bevmaq.com speaks. Bevmard answers in the
            language you wrote in, and the machines he finds are the same three.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
          {LANGS.map((l, i) => (
            <Reveal key={l.code} delay={(i % 4) * 0.06}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={SPRING}
                className="flex h-full flex-col gap-2.5 rounded-lg border border-line-soft bg-ink-1 px-[18px] pt-[18px] pb-4 transition-colors hover:border-blue hover:bg-ink-2"
              >
                <div className="flex items-baseline justify-between font-mono text-[11.5px] tracking-[0.12em] text-blue-soft uppercase">
                  {l.code} <span className="tracking-[0.04em] text-dim normal-case">{l.name}</span>
                </div>
                <q
                  lang={l.code.toLowerCase()}
                  className="text-[14.5px] leading-[1.45] text-text before:text-orange after:text-orange"
                >
                  {l.req}
                </q>
              </motion.div>
            </Reveal>
          ))}
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-center gap-2.5 rounded-lg border border-dashed border-line-soft px-[18px] pt-[18px] pb-4">
              <div className="font-display text-[44px] leading-[0.9] font-extrabold text-orange">+</div>
              <p className="text-sm text-muted">
                Write in any other language. He will answer in it and still find the same three fillers.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
