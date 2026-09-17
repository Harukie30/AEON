"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function bootStep(progress: number, mode: "boot" | "module" | "logout") {
  if (mode === "logout") {
    if (progress < 28) return "CLOSING COMMAND CHANNELS";
    if (progress < 55) return "FLUSHING OPERATOR CLEARANCE";
    if (progress < 82) return "SEVERING NODE-01 UPLINK";
    return "SESSION ENDED";
  }

  if (mode === "module") {
    if (progress < 40) return "MOUNTING INTERFACE";
    if (progress < 75) return "SYNCING LIVE FEEDS";
    return "MODULE ONLINE";
  }

  if (progress < 22) return "SYNCING OPERATOR SESSION";
  if (progress < 48) return "LOADING GLOBAL GRID";
  if (progress < 74) return "ARMING INCIDENT CHANNELS";
  if (progress < 96) return "CALIBRATING TICKER";
  return "DECK ONLINE";
}

export function DeckLoader({
  label,
  mode,
  onDone,
  operatorId,
}: {
  label: string;
  mode: "boot" | "module" | "logout";
  onDone: () => void;
  operatorId: string;
}) {
  const [progress, setProgress] = useState(0);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const duration = prefersReducedMotion()
      ? 200
      : mode === "boot"
        ? 2200
        : mode === "logout"
          ? 1600
          : 900;
    const started = performance.now();
    const timer = window.setInterval(() => {
      const next = Math.min(
        100,
        Math.round(((performance.now() - started) / duration) * 100),
      );
      setProgress(next);
      if (next >= 100) {
        window.clearInterval(timer);
        onDoneRef.current();
      }
    }, 32);

    return () => window.clearInterval(timer);
  }, [mode]);

  const logout = mode === "logout";

  return (
    <div
      aria-busy="true"
      aria-label={
        mode === "boot"
          ? "Initializing command deck"
          : logout
            ? "Ending operator session"
            : `Loading ${label}`
      }
      aria-modal="true"
      className="absolute inset-0 z-40 flex items-center justify-center bg-[#04070a]/80 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className={`${logout ? "aeon-alert-in" : "aeon-success-in"} relative w-full max-w-md`}>
        <span
          className={`pointer-events-none absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 ${
            logout ? "border-aeon-amber" : "border-aeon-cyan"
          }`}
        />
        <span
          className={`pointer-events-none absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 ${
            logout ? "border-aeon-amber" : "border-aeon-cyan"
          }`}
        />
        <span
          className={`pointer-events-none absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 ${
            logout ? "border-aeon-amber" : "border-aeon-cyan"
          }`}
        />
        <span
          className={`pointer-events-none absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 ${
            logout ? "border-aeon-amber" : "border-aeon-cyan"
          }`}
        />

        <div
          className={`border bg-[#071015]/95 p-6 sm:p-8 ${
            logout
              ? "border-aeon-amber/40 shadow-[0_0_80px_rgba(240,180,41,0.12)]"
              : "border-aeon-cyan/35 shadow-[0_0_80px_rgba(79,244,226,0.12)]"
          }`}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p
                className={`font-mono text-[10px] tracking-[0.3em] ${
                  logout ? "text-aeon-amber/80" : "text-aeon-cyan/70"
                }`}
              >
                {mode === "boot"
                  ? "NODE-01 // DECK BOOT"
                  : logout
                    ? "NODE-01 // SESSION CLOSE"
                    : "NODE-01 // MODULE"}
              </p>
              <h2 className="mt-2 font-display text-xl tracking-[0.18em] text-white">
                {mode === "boot" ? "INITIALIZING" : logout ? "TERMINATING" : "LOADING"}
              </h2>
            </div>
            <p
              className={`font-mono text-[10px] tracking-[0.16em] ${
                logout ? "text-aeon-amber" : "text-aeon-amber"
              }`}
            >
              {mode === "boot" ? "ENTERING DECK" : logout ? "END SESSION" : label}
            </p>
          </div>

          <p
            className={`font-mono text-[11px] tracking-[0.18em] ${
              logout ? "text-aeon-amber/80" : "text-aeon-cyan/80"
            }`}
          >
            {bootStep(progress, mode)}
          </p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-foreground/45">
              <span>
                {mode === "boot" ? "SYSTEM BRING-UP" : logout ? "UPLINK TEARDOWN" : label}
              </span>
              <span className={logout ? "text-aeon-amber" : "text-aeon-cyan"}>
                {progress.toString().padStart(3, "0")}%
              </span>
            </div>
            <div
              className={`h-2 overflow-hidden border bg-black/50 ${
                logout ? "border-aeon-amber/25" : "border-aeon-cyan/25"
              }`}
            >
              <div
                className={`aeon-progress-fill h-full ${
                  logout
                    ? "bg-aeon-amber shadow-[0_0_12px_rgba(240,180,41,0.65)]"
                    : "bg-aeon-cyan shadow-[0_0_12px_rgba(79,244,226,0.65)]"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="mt-5 font-mono text-[10px] tracking-[0.16em] text-foreground/40">
            OPERATOR {operatorId}
          </p>
        </div>
      </div>
    </div>
  );
}
