"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  activeThreatBulletins,
  dismissThreat,
  dismissThreats,
  getDismissedThreatSnapshot,
  readDismissedThreats,
  subscribeDismissedThreats,
} from "@/lib/threat-bulletin";
import { beginIncidentReadback } from "@/lib/watch-officer";
import type { AlertItem } from "@/lib/mock/alerts";

export function ThreatBulletin({ ready }: { ready: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefing = Boolean(searchParams.get("brief"));
  const [armed, setArmed] = useState(false);
  const dismissed = useSyncExternalStore(
    subscribeDismissedThreats,
    readDismissedThreats,
    getDismissedThreatSnapshot,
  );
  const queue = activeThreatBulletins(dismissed);
  const current = queue[0] ?? null;
  const next = queue[1] ?? null;

  useEffect(() => {
    if (!ready) {
      setArmed(false);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setArmed(true), reduced ? 0 : 280);
    return () => window.clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (!armed || !current || briefing) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismissThreat(current.id);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [armed, briefing, current]);

  if (!armed || !current || briefing) return null;

  const alert = current.severity === "critical";
  const remaining = queue.length;

  function acceptBrief() {
    beginIncidentReadback(current);
    dismissThreat(current.id);
    router.push(`/command/alerts?brief=${encodeURIComponent(current.id)}`);
  }

  function openQueue() {
    beginIncidentReadback(current);
    dismissThreats(queue.map((item) => item.id));
    router.push(`/command/alerts?brief=${encodeURIComponent(current.id)}`);
  }

  return (
    <div
      aria-labelledby="aeon-threat-title"
      aria-modal="true"
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#04070a]/80 p-4 backdrop-blur-sm"
      role="alertdialog"
    >
      <div
        className={`${alert ? "aeon-alert-in aeon-shake" : "aeon-alert-in"} relative w-full max-w-md`}
        key={current.id}
      >
        <HudCorners tone={alert ? "red" : "amber"} />
        <div
          className={`border bg-[#071015]/95 p-6 sm:p-8 ${
            alert
              ? "aeon-lock-flash border-aeon-red/45 shadow-[0_0_80px_rgba(255,90,90,0.16)]"
              : "border-aeon-amber/45 shadow-[0_0_80px_rgba(240,180,41,0.14)]"
          }`}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p
                className={`font-mono text-[10px] tracking-[0.3em] ${
                  alert ? "text-aeon-red/80" : "text-aeon-amber/80"
                }`}
              >
                NODE-01 // {alert ? "PRIORITY ALERT" : "TRACK WARNING"}
              </p>
              <h2
                className={`mt-2 font-display text-xl tracking-[0.18em] ${
                  alert ? "text-aeon-red" : "text-aeon-amber"
                }`}
                id="aeon-threat-title"
              >
                {alert ? "CRITICAL POINT" : "HIGH POINT"}
              </h2>
            </div>
            <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-foreground/45">
              <span
                className={`aeon-pulse size-1.5 rounded-full ${
                  alert ? "bg-aeon-red" : "bg-aeon-amber"
                }`}
              />
              {remaining.toString().padStart(2, "0")} OPEN
            </span>
          </div>

          <ThreatCard alert={current} critical={alert} />

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              className={`border px-3 py-3 font-display text-sm tracking-[0.18em] transition ${
                alert
                  ? "border-aeon-red/50 bg-aeon-red/10 text-aeon-red hover:bg-aeon-red/20"
                  : "border-aeon-amber/50 bg-aeon-amber/10 text-aeon-amber hover:bg-aeon-amber/20"
              }`}
              onClick={acceptBrief}
              type="button"
            >
              ACKNOWLEDGE
            </button>
            <button
              className="border border-aeon-cyan/40 bg-aeon-cyan/10 px-3 py-3 font-display text-sm tracking-[0.18em] text-aeon-cyan transition hover:bg-aeon-cyan/20"
              onClick={openQueue}
              type="button"
            >
              OPEN QUEUE
            </button>
          </div>

          <p className="mt-4 font-mono text-[10px] tracking-[0.16em] text-foreground/40">
            {next
              ? "ACCEPT OPENS FULL BRIEF // NEXT WARNING WAITS"
              : "ACCEPT OPENS FULL BRIEF"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ThreatCard({ alert, critical }: { alert: AlertItem; critical: boolean }) {
  const tone = critical
    ? {
        box: "border-aeon-red/45 bg-aeon-red/10",
        text: "text-aeon-red",
        label: "ALERT",
      }
    : {
        box: "border-aeon-amber/45 bg-aeon-amber/10",
        text: "text-aeon-amber",
        label: "WARNING",
      };

  return (
    <div className={`border p-4 ${tone.box}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`font-mono text-[10px] tracking-[0.22em] ${tone.text}`}>
          {tone.label} // {alert.id}
        </p>
        <span
          className={`border px-2 py-1 font-mono text-[9px] tracking-[0.16em] ${tone.text} ${
            critical ? "border-aeon-red/40" : "border-aeon-amber/40"
          }`}
        >
          {alert.severity.toUpperCase()}
        </span>
      </div>
      <p className={`mt-2 font-display text-sm tracking-[0.14em] ${tone.text}`}>
        {alert.title.toUpperCase()}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground/75">{alert.summary}</p>
      <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-foreground/45">
        {alert.region} · {alert.station} · SLA {alert.slaMin}m
      </p>
    </div>
  );
}

function HudCorners({ tone }: { tone: "red" | "amber" }) {
  const border = tone === "red" ? "border-aeon-red" : "border-aeon-amber";

  return (
    <>
      <span
        className={`pointer-events-none absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 ${border}`}
      />
      <span
        className={`pointer-events-none absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 ${border}`}
      />
      <span
        className={`pointer-events-none absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 ${border}`}
      />
      <span
        className={`pointer-events-none absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 ${border}`}
      />
    </>
  );
}
