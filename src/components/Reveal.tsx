"use client";

import { type HTMLMotionProps, motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

type RevealProps = HTMLMotionProps<"div"> & {
  /** Seconds to wait before the reveal starts; use for stagger within a row. */
  delay?: number;
};

/** Fades and lifts children into place the first time they scroll into view. */
export function Reveal({ delay = 0, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.65, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export const SPRING = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 } as const;
export { EASE };
