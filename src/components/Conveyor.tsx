"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type Lane = { y: number; speed: number; dir: 1 | -1 };
type Bottle = { lane: Lane; x: number; h: number; hot: boolean; wob: number };

const HOT_RATE = 0.09;

/**
 * Ambient: bottle silhouettes moving along conveyor lanes behind the hero.
 * One in eleven glows orange, the match. Renders nothing under reduced motion.
 */
export function Conveyor() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const cv = ref.current;
    if (!cv || reduced) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let lanes: Lane[] = [];
    let bottles: Bottle[] = [];
    let last = 0;
    let beltOff = 0;
    let raf = 0;
    let running = !document.hidden;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function resize() {
      if (!cv || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = Math.floor(W * dpr);
      cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lanes = [0.16, 0.42, 0.7, 0.9].map((f, i) => ({
        y: H * f,
        speed: 18 + i * 9,
        dir: i % 2 ? -1 : 1,
      }));
      bottles = [];
      const count = Math.min(56, Math.floor(W / 26));
      for (let i = 0; i < count; i++) {
        const lane = lanes[i % lanes.length];
        if (!lane) continue;
        bottles.push({
          lane,
          x: rand(-40, W + 40),
          h: rand(22, 34),
          hot: Math.random() < HOT_RATE,
          wob: rand(0, Math.PI * 2),
        });
      }
    }

    function drawBottle(b: Bottle, t: number) {
      if (!ctx) return;
      const w = b.h * 0.34;
      const h = b.h;
      const x = b.x;
      const y = b.lane.y + Math.sin(t / 900 + b.wob) * 0.8;
      ctx.beginPath();
      // Bordeaux silhouette: body, shoulders, neck
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x - w / 2, y - h * 0.55);
      ctx.quadraticCurveTo(x - w / 2, y - h * 0.72, x - w * 0.18, y - h * 0.76);
      ctx.lineTo(x - w * 0.18, y - h);
      ctx.lineTo(x + w * 0.18, y - h);
      ctx.lineTo(x + w * 0.18, y - h * 0.76);
      ctx.quadraticCurveTo(x + w / 2, y - h * 0.72, x + w / 2, y - h * 0.55);
      ctx.lineTo(x + w / 2, y);
      ctx.closePath();
      if (b.hot) {
        ctx.fillStyle = "rgba(255,122,26,0.55)";
        ctx.shadowColor = "rgba(255,122,26,0.9)";
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,181,119,0.9)";
      } else {
        ctx.strokeStyle = "rgba(61,123,255,0.28)";
      }
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function frame(t: number) {
      raf = requestAnimationFrame(frame);
      if (!ctx) return;
      if (!running) {
        last = t;
        return;
      }
      const dt = Math.min(48, t - (last || t)) / 1000;
      last = t;
      ctx.clearRect(0, 0, W, H);
      beltOff = (beltOff + dt * 22) % 24;
      ctx.setLineDash([10, 14]);
      for (const l of lanes) {
        ctx.lineDashOffset = -beltOff * l.dir;
        ctx.strokeStyle = "rgba(61,123,255,0.10)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, l.y + 1);
        ctx.lineTo(W, l.y + 1);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      for (const b of bottles) {
        b.x += b.lane.speed * b.lane.dir * dt;
        if (b.lane.dir > 0 && b.x > W + 40) {
          b.x = -40;
          b.hot = Math.random() < HOT_RATE;
        }
        if (b.lane.dir < 0 && b.x < -40) {
          b.x = W + 40;
          b.hot = Math.random() < HOT_RATE;
        }
        drawBottle(b, t);
      }
    }

    const onVisibility = () => {
      running = !document.hidden;
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
    />
  );
}
