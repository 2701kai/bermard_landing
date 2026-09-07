"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { FIRST_LANG, LANGS, MACHINES, type Machine, STAGED, STATUS } from "@/content/bevmard";
import { SPRING } from "./Reveal";

type Stage = "rest" | "leave" | "typing" | "status" | "reply" | "cards" | "staged";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * The dispatch console: one brief, ten languages, on a loop.
 * Server-renders the finished English exchange (the page at rest), then the
 * script takes over: the buyer types in the next language, progress lines
 * appear, Bevmard answers, three machines spring in, the inquiry gets staged.
 */
export function Console() {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<Stage>("rest");
  const [req, setReq] = useState(FIRST_LANG.req);
  const [reply, setReply] = useState(FIRST_LANG.reply);
  const [statusShown, setStatusShown] = useState(STATUS.length);
  const [statusDone, setStatusDone] = useState(STATUS.length);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lang = LANGS[idx] ?? FIRST_LANG;

  useEffect(() => {
    let alive = true;

    if (reduced) {
      // Plain language swap, no typing, no motion.
      const id = setInterval(() => {
        setIdx((i) => {
          const n = (i + 1) % LANGS.length;
          const L = LANGS[n] ?? FIRST_LANG;
          setReq(L.req);
          setReply(L.reply);
          return n;
        });
      }, 6000);
      return () => clearInterval(id);
    }

    (async () => {
      await sleep(3800);
      let i = 0;
      while (alive) {
        if (document.hidden) {
          await sleep(800);
          continue;
        }
        i = (i + 1) % LANGS.length;
        const L = LANGS[i] ?? FIRST_LANG;

        setStage("leave");
        await sleep(360);
        if (!alive) return;

        setIdx(i);
        setReq("");
        setReply("");
        setStatusShown(0);
        setStatusDone(0);
        setStage("typing");

        for (let c = 1; c <= L.req.length; c++) {
          if (!alive) return;
          setReq(L.req.slice(0, c));
          await sleep(L.req[c - 1] === " " ? 16 : 26);
        }
        await sleep(380);

        setStage("status");
        for (let s = 1; s <= STATUS.length; s++) {
          if (!alive) return;
          setStatusShown(s);
          await sleep(s === 2 ? 900 : 520);
          setStatusDone(s);
        }
        await sleep(200);

        setStage("reply");
        for (let c = 1; c <= L.reply.length; c++) {
          if (!alive) return;
          setReply(L.reply.slice(0, c));
          await sleep(11);
        }

        setStage("cards");
        await sleep(720);
        setStage("staged");
        await sleep(5600);
      }
    })();

    return () => {
      alive = false;
    };
  }, [reduced]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(id);
  }, [toast]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = inputRef.current?.value.trim();
    setToast(
      v
        ? "Bevmard is in preview. This console is scripted; the live agent lands on bevmaq.com/buy."
        : "Type a brief first. Any language works, even a vague one.",
    );
  }

  const answerVisible =
    stage === "rest" || stage === "staged" || stage === "cards" || stage === "reply" || stage === "status";
  const showStatus = stage === "rest" || (statusShown > 0 && stage !== "typing" && stage !== "leave");
  const showReply = stage === "rest" || stage === "reply" || stage === "cards" || stage === "staged";
  const showCards = stage === "rest" || stage === "cards" || stage === "staged";
  const showStaged = stage === "rest" || stage === "staged";
  const typingReq = stage === "typing";
  const typingReply = stage === "reply";

  return (
    <motion.div
      id="console"
      className="console-shadow relative overflow-hidden rounded-[10px] border border-line bg-ink-1"
      initial={{ opacity: 0, y: 28, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING, delay: 0.45 }}
    >
      {/* bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-ink-2 px-4 py-3 font-mono text-[12px] text-muted">
        <div className="flex gap-1.5" aria-hidden="true">
          <i className="block h-2.5 w-2.5 rounded-full bg-orange" />
          <i className="block h-2.5 w-2.5 rounded-full bg-[#2b3a5e]" />
          <i className="block h-2.5 w-2.5 rounded-full bg-[#2b3a5e]" />
        </div>
        <span>bevmard · dispatch console</span>
        <motion.span
          key={lang.code}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={SPRING}
          className="inline-flex items-center gap-2 rounded-full border border-blue/35 bg-blue/12 px-2.5 py-1 font-medium tracking-[0.08em] text-blue-soft before:h-1.5 before:w-1.5 before:rounded-full before:bg-blue before:shadow-[0_0_8px_var(--color-blue)] before:content-['']"
        >
          {lang.code} · {lang.name}
        </motion.span>
      </div>

      {/* body */}
      <div className="flex min-h-0 flex-col gap-3.5 px-3 pt-4 pb-1.5 sm:px-4 md:min-h-[520px]" aria-live="polite">
        {/* buyer */}
        <div className="flex items-start gap-2.5">
          <Who kind="user" />
          <div className="min-h-11 rounded-[10px] rounded-tl-[3px] border border-line-soft bg-ink-2 px-3.5 py-[11px] text-[15.5px] leading-[1.45]">
            <span lang={lang.code.toLowerCase()}>{req}</span>
            {typingReq && <Caret />}
          </div>
        </div>

        <motion.div
          className="flex flex-col gap-3.5"
          animate={{ opacity: answerVisible ? 1 : 0, y: answerVisible ? 0 : 6 }}
          transition={{ duration: 0.35 }}
        >
          {/* progress lines */}
          {showStatus && (
            <div className="flex flex-col gap-1.5 font-mono text-[12.5px] text-muted sm:pl-10">
              {STATUS.slice(0, stage === "rest" ? STATUS.length : statusShown).map((line, i) => {
                const done = stage === "rest" || i < statusDone;
                return (
                  <motion.div
                    key={`${idx}-${line}`}
                    initial={stage === "rest" ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`flex items-center gap-2.5 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:content-[''] ${
                      done ? "text-dim before:bg-ok" : "before:bg-blue before:shadow-[0_0_8px_rgba(61,123,255,0.35)]"
                    }`}
                  >
                    {line}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Bevmard */}
          {showReply && (
            <div className="flex items-start gap-2.5">
              <Who kind="bot" />
              <div className="min-h-11 pt-1 pl-0.5 text-[15.5px] leading-[1.45] text-text">
                <span lang={lang.code.toLowerCase()}>{reply}</span>
                {typingReply && <Caret />}
              </div>
            </div>
          )}

          {/* machines */}
          {showCards && (
            <div className="grid grid-cols-1 gap-2.5 sm:pl-10 md:grid-cols-3">
              {MACHINES.map((m, i) => (
                <MachineCard key={`${idx}-${m.name}`} m={m} index={i} animateIn={stage !== "rest"} />
              ))}
            </div>
          )}

          {/* staged inquiry */}
          <AnimatePresence>
            {showStaged && (
              <motion.div
                key={`staged-${idx}`}
                initial={stage === "rest" ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SPRING}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-orange/35 bg-orange/8 px-3 py-2.5 text-sm text-orange-soft sm:ml-10"
              >
                <span className="font-mono text-[11px] tracking-[0.12em] text-orange uppercase">{STAGED.label}</span>
                <span>{STAGED.machine}</span>
                <span className="text-dim">→</span>
                <span>{STAGED.next}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* input, honest about being a preview */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line-soft bg-ink-1 px-4 pt-3 pb-3.5">
        <label htmlFor="askInput" className="sr-only">
          Ask Bevmard
        </label>
        <input
          ref={inputRef}
          id="askInput"
          type="text"
          autoComplete="off"
          placeholder="Ask Bevmard in any language…"
          className="min-w-0 flex-1 rounded-brand border border-line bg-ink-0 px-3.5 py-[11px] text-[15px] text-text placeholder:text-dim focus:border-blue focus:outline-none"
        />
        <motion.button
          type="submit"
          aria-label="Send"
          whileTap={{ scale: 0.95 }}
          className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-brand bg-orange text-orange-ink"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </motion.button>
      </form>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="absolute right-3 bottom-[72px] left-3 z-10 rounded-lg border border-line bg-ink-2 px-4 py-3 text-center text-sm text-text shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Who({ kind }: { kind: "user" | "bot" }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full font-display text-[15px] font-extrabold tracking-[0.04em] ${
        kind === "user" ? "border border-line bg-ink-3 text-blue-soft" : "bg-orange text-orange-ink"
      }`}
    >
      {kind === "user" ? "You" : "B"}
    </span>
  );
}

function Caret() {
  return <i className="ml-0.5 inline-block h-[1em] w-0.5 animate-blink bg-orange align-[-0.15em]" aria-hidden="true" />;
}

function MachineCard({ m, index, animateIn }: { m: Machine; index: number; animateIn: boolean }) {
  return (
    <motion.article
      initial={animateIn ? { opacity: 0, y: 22, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING, delay: animateIn ? 0.05 + index * 0.12 : 0 }}
      whileHover={{ y: -4 }}
      className={`relative flex flex-col gap-2 rounded-lg border bg-ink-2 px-3.5 pt-3.5 pb-3 ${
        m.best ? "card-best border-orange/55" : "border-line"
      }`}
    >
      <span
        className={`absolute -top-[9px] left-3 rounded-full border px-2 py-[3px] font-mono text-[10.5px] tracking-[0.12em] uppercase ${
          m.best ? "border-orange bg-orange font-medium text-orange-ink" : "border-line bg-ink-1 text-muted"
        }`}
      >
        {m.tag}
      </span>
      <div className="font-display text-[40px] leading-[0.95] font-extrabold tracking-[0.01em] tabular-nums">
        {m.bph}
        <small className="ml-1.5 font-mono text-[11px] font-normal tracking-[0.1em] text-muted">BPH</small>
      </div>
      <div className="text-[14.5px] leading-[1.3] font-semibold">{m.name}</div>
      <div className="font-mono text-[11.5px] leading-[1.5] text-muted">
        {m.spec[0]}
        <br />
        {m.spec[1]}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 border-t border-dashed border-line pt-2 font-mono text-[11px] text-dim">
        <span className="inline-flex items-center gap-1.5 text-ok before:h-1.5 before:w-1.5 before:rounded-full before:bg-ok before:shadow-[0_0_8px_rgba(61,220,151,0.6)] before:content-['']">
          Available
        </span>
        <span>{m.location}</span>
      </div>
    </motion.article>
  );
}
