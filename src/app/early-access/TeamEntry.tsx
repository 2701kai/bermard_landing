"use client";

// Closed mode's quiet team entry: a muted mono line that reveals the Google sign-in button on click.
// The GIS script loads only once revealed.
import { useState } from "react";
import { GoogleButton } from "./GoogleButton";

export function TeamEntry({
  label,
  next,
  locale,
  errorText,
  notConfiguredText,
}: {
  label: string;
  next: string;
  locale: string;
  errorText: string;
  notConfiguredText: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-start gap-4">
      {open && (
        <GoogleButton
          next={next}
          locale={locale}
          text="signin_with"
          errorText={errorText}
          notConfiguredText={notConfiguredText}
        />
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer border-0 bg-transparent p-0 text-left font-mono text-[12px] tracking-[0.04em] text-dim underline-offset-4 transition-colors hover:text-muted hover:underline"
      >
        {label}
      </button>
    </div>
  );
}
