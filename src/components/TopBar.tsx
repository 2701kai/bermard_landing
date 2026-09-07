"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 border-b py-3.5 backdrop-blur-[10px] transition-colors duration-300 ${
        scrolled ? "border-line-soft" : "border-transparent"
      }`}
      style={{ background: "rgba(7, 10, 18, 0.72)" }}
    >
      <div className="wrap flex items-center justify-between gap-4">
        <a href="/" className="flex items-baseline gap-2.5 no-underline" aria-label="BMi, BEVMAQ Intelligence">
          <span className="font-display text-[28px] leading-none font-black tracking-[0.02em]">
            BM<span className="text-blue-soft">i</span>
          </span>
          <span className="text-[12px] tracking-[0.08em] text-muted uppercase">by BEVMAQ</span>
        </a>
        <nav className="flex items-center gap-3.5">
          <a href="#ard" className="hidden text-sm text-muted no-underline hover:text-text sm:inline">
            What ARD stands for
          </a>
          <a href="#languages" className="hidden text-sm text-muted no-underline hover:text-text sm:inline">
            10 languages
          </a>
          <motion.a href="#console" className="btn btn-orange px-3.5 py-2.5 text-sm" whileTap={{ scale: 0.97 }}>
            Ask Bevmard
          </motion.a>
        </nav>
      </div>
    </header>
  );
}
