"use client";

import { motion } from "motion/react";
import { NAMEPLATE } from "@/content/bevmard";
import { Console } from "./Console";
import { Conveyor } from "./Conveyor";
import { EASE } from "./Reveal";

/** Page-load choreography: each hero line lifts in, one after the other. */
function Line({ index, children, className = "" }: { index: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.1 + index * 0.09 }}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  return (
    <section
      className="blueprint relative overflow-hidden bg-ink-0 pt-14"
      style={{ backgroundImage: "linear-gradient(180deg, rgba(61,123,255,0.06) 0%, rgba(61,123,255,0) 60%)" }}
    >
      <Conveyor />
      <div className="wrap">
        <div className="relative grid grid-cols-1 items-start gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-12">
          <div className="flex flex-col gap-[22px] pt-3">
            <Line index={0}>
              <p className="eyebrow">Featuring</p>
            </Line>
            <Line index={1}>
              <h1 className="-ml-[3px] font-display text-[clamp(96px,17vw,200px)] leading-[0.84] font-black tracking-[-0.01em]">
                BEVM
                <br />
                <span className="text-orange">ard</span>
              </h1>
            </Line>
            <Line index={2}>
              <p className="wide font-body text-[clamp(15px,2vw,19px)] font-semibold tracking-[0.04em] text-blue-soft uppercase">
                BEVMAQ <b className="font-bold text-orange">A</b>rtificial <b className="font-bold text-orange">R</b>
                ecommendation <b className="font-bold text-orange">D</b>ispatcher
              </p>
            </Line>
            <Line index={3}>
              <p
                className="max-w-[22ch] text-[clamp(20px,2.6vw,27px)] leading-[1.3] text-text"
                style={{ textWrap: "balance" }}
              >
                Tell him what you need. In your language.{" "}
                <em className="text-orange-soft not-italic">Even the vague version.</em>
              </p>
            </Line>
            <Line index={4}>
              <p className="max-w-[52ch] text-[16px] text-muted">
                Bevmard is the new shopping agent on bevmaq.com. He reads a half-formed request the way a sales engineer
                does, checks what is actually available on the floor right now, and stages the inquiry for you. He never
                buys, reserves or charges anything.
              </p>
            </Line>
            <Line index={5} className="mt-1 flex flex-wrap gap-3">
              <motion.a href="#console" className="btn btn-orange" whileTap={{ scale: 0.97 }}>
                Talk to Bevmard
              </motion.a>
              <motion.a href="#ard" className="btn btn-ghost" whileTap={{ scale: 0.97 }}>
                See how he dispatches
              </motion.a>
            </Line>
            <Line index={6}>
              <Nameplate />
            </Line>
          </div>

          <Console />
        </div>
      </div>
    </section>
  );
}

/** The Typenschild: every machine on the floor has one, so does Bevmard. */
function Nameplate() {
  return (
    <section
      className="plate relative mt-2.5 max-w-[420px] rounded border border-[#2b3a5e] px-[22px] pt-[18px] pb-4 font-mono text-[12.5px] text-blue-soft"
      aria-label="Nameplate"
    >
      <i className="rivet top-[7px] left-[7px]" />
      <i className="rivet top-[7px] right-[7px]" />
      <i className="rivet bottom-[7px] left-[7px]" />
      <i className="rivet right-[7px] bottom-[7px]" />
      <div className="mb-2.5 flex items-baseline justify-between border-b border-dashed border-[#2b3a5e] pb-2">
        <strong className="font-display text-[22px] font-extrabold tracking-[0.04em] text-text">BEVMard</strong>
        <span className="text-[11px] tracking-[0.1em] text-dim">TYPENSCHILD · NAMEPLATE</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-[18px] gap-y-1.5">
        {NAMEPLATE.map(([k, v, hot]) => (
          <div key={k} className="contents">
            <dt className="text-[11px] tracking-[0.06em] text-dim uppercase">{k}</dt>
            <dd className={hot ? "text-orange-soft" : "text-text"}>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
