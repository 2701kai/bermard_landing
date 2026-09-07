"use client";

import { motion } from "motion/react";
import { LINKS } from "@/content/bevmard";
import { Reveal } from "./Reveal";

export function CtaBlock() {
  return (
    <section id="cta" className="pb-[72px] md:pb-24">
      <div className="wrap">
        <Reveal className="cta-glow relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[14px] border border-line px-6 py-11 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:px-12 md:py-16">
          <div>
            <p className="eyebrow">Now on shift</p>
            <h2 className="h2 mt-3.5 text-[clamp(48px,8vw,96px)]">
              Bevmard is <span className="text-orange">listening.</span>
            </h2>
            <p className="mt-3.5 max-w-[46ch] text-[17px] text-muted">
              Bring the brief you would send a colleague at 11 pm: half a sentence, a capacity you are not sure about, a
              deadline. He'll take it from there.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3">
            <motion.a href="#console" className="btn btn-orange px-[22px] py-4 text-[16px]" whileTap={{ scale: 0.97 }}>
              Ask Bevmard now
            </motion.a>
            <motion.a
              href={LINKS.roadmap}
              className="btn btn-ghost px-[22px] py-4 text-[16px]"
              whileTap={{ scale: 0.97 }}
            >
              See the BMi roadmap
            </motion.a>
            <span className="text-center font-mono text-[12px] text-dim">
              preview · scripted demo · live agent lands on bevmaq.com/buy
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
