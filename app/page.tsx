"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccessTerminal } from "@/components/landing/access-terminal";
import { useUtcLabel } from "@/lib/clock";
import { readSession } from "@/lib/session";

export default function Home() {
  const router = useRouter();
  const utcLabel = useUtcLabel();

  useEffect(() => {
    if (readSession()) {
      router.replace("/command");
    }
  }, [router]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="aeon-stars pointer-events-none absolute inset-0" />
      <div className="aeon-grid pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#04070a_78%)]" />
      <div className="aeon-scanlines pointer-events-none absolute inset-0 opacity-40" />

      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-aeon-cyan/15 px-4 py-3 font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/80 sm:px-8 sm:text-[11px]">
        <p>AEON // SECURE ACCESS TERMINAL</p>
        <p className="hidden text-foreground/55 sm:block">{utcLabel}</p>
        <p className="flex items-center gap-2">
          <span className="aeon-pulse inline-block size-1.5 rounded-full bg-aeon-cyan shadow-[0_0_8px_#4ff4e2]" />
          NET NOMINAL
        </p>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6 lg:px-8">
        <section className="relative min-h-[320px] sm:min-h-[420px] lg:min-h-[560px]">
          <EarthMark />
          <div className="relative z-10 flex h-full max-w-xl flex-col justify-end gap-5 pt-8 lg:pt-0">
            <p className="font-mono text-[11px] tracking-[0.38em] text-aeon-cyan/80">
              CLASSIFIED OBSERVATION GRID
            </p>
            <h1 className="font-display text-6xl font-semibold leading-none tracking-[0.18em] text-white sm:text-7xl lg:text-8xl">
              AEON
            </h1>
            <p className="max-w-md font-display text-sm font-medium uppercase leading-relaxed tracking-[0.22em] text-aeon-cyan/90 sm:text-base">
              Advanced Environmental
              <br />
              Observational Network
            </p>
            <p className="max-w-md text-sm leading-6 text-foreground/65">
              Planetary command access for constellation telemetry, environmental
              layers, and incident response. Authorized operators only.
            </p>
            <dl className="mt-2 grid max-w-lg grid-cols-3 gap-3 font-mono text-[10px] tracking-[0.16em] text-aeon-cyan/70 sm:text-[11px]">
              <div className="border border-aeon-cyan/15 bg-black/25 px-3 py-3">
                <dt className="text-foreground/40">SATELLITES</dt>
                <dd className="mt-1 text-sm text-white">412 ONLINE</dd>
              </div>
              <div className="border border-aeon-cyan/15 bg-black/25 px-3 py-3">
                <dt className="text-foreground/40">COVERAGE</dt>
                <dd className="mt-1 text-sm text-white">98.4%</dd>
              </div>
              <div className="border border-aeon-cyan/15 bg-black/25 px-3 py-3">
                <dt className="text-foreground/40">ALERTS</dt>
                <dd className="mt-1 text-sm text-aeon-amber">3 WATCH</dd>
              </div>
            </dl>
          </div>
        </section>

        <AccessTerminal />
      </main>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-aeon-cyan/15 px-4 py-3 font-mono text-[10px] tracking-[0.18em] text-foreground/40 sm:px-8">
        <p>PACIFIC NODE 07</p>
        <p className="sm:hidden">{utcLabel}</p>
        <p>NO CRITICAL EVENTS</p>
        <p>CLEARANCE LEVEL 3</p>
      </footer>
    </div>
  );
}

function EarthMark() {
  return (
    <div className="pointer-events-none absolute -left-16 top-1/2 w-[min(90vw,620px)] -translate-y-1/2 opacity-80 sm:left-0 lg:-left-8">
      <svg
        aria-hidden="true"
        className="aeon-glow h-auto w-full"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="aeon-ocean" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#1b8f86" />
            <stop offset="45%" stopColor="#0b3d44" />
            <stop offset="100%" stopColor="#041318" />
          </radialGradient>
          <radialGradient id="aeon-atmos" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="rgba(79,244,226,0)" />
            <stop offset="100%" stopColor="rgba(79,244,226,0.35)" />
          </radialGradient>
          <clipPath id="aeon-disk">
            <circle cx="300" cy="300" r="168" />
          </clipPath>
        </defs>

        <circle cx="300" cy="300" r="210" fill="url(#aeon-atmos)" />
        <circle
          cx="300"
          cy="300"
          r="168"
          fill="url(#aeon-ocean)"
          stroke="rgba(79,244,226,0.35)"
          strokeWidth="1.5"
        />

        <g clipPath="url(#aeon-disk)" fill="rgba(79,244,226,0.22)">
          <ellipse cx="214" cy="248" rx="58" ry="28" />
          <ellipse cx="268" cy="206" rx="34" ry="16" />
          <ellipse cx="372" cy="268" rx="72" ry="30" />
          <ellipse cx="348" cy="338" rx="40" ry="22" />
          <ellipse cx="236" cy="352" rx="36" ry="18" />
          <ellipse cx="318" cy="402" rx="50" ry="16" />
        </g>

        <g
          fill="none"
          stroke="rgba(79,244,226,0.18)"
          strokeWidth="1"
          clipPath="url(#aeon-disk)"
        >
          <ellipse cx="300" cy="300" rx="168" ry="52" />
          <ellipse cx="300" cy="300" rx="168" ry="104" />
          <ellipse cx="300" cy="300" rx="52" ry="168" />
          <ellipse cx="300" cy="300" rx="104" ry="168" />
          <line x1="132" x2="468" y1="300" y2="300" />
        </g>

        <g className="aeon-orbit" fill="none">
          <ellipse
            cx="300"
            cy="300"
            rx="230"
            ry="78"
            stroke="rgba(79,244,226,0.35)"
            strokeDasharray="4 10"
            transform="rotate(-18 300 300)"
          />
          <circle cx="512" cy="274" fill="#4ff4e2" r="4" />
        </g>

        <g className="aeon-orbit-slow" fill="none">
          <ellipse
            cx="300"
            cy="300"
            rx="250"
            ry="96"
            stroke="rgba(240,180,41,0.28)"
            strokeDasharray="2 12"
            transform="rotate(24 300 300)"
          />
          <circle cx="88" cy="338" fill="#f0b429" r="3.5" />
        </g>
      </svg>
    </div>
  );
}
