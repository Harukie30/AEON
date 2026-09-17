"use client";

import { useEffect } from "react";
import type { AlertFeedKind, AlertItem, AlertSeverity } from "@/lib/mock/alerts";

const severityClass: Record<AlertSeverity, string> = {
  critical: "text-aeon-red border-aeon-red/40",
  high: "text-aeon-amber border-aeon-amber/40",
  watch: "text-aeon-cyan border-aeon-cyan/40",
};

const kindClass: Record<AlertFeedKind, string> = {
  SAT: "text-aeon-cyan border-aeon-cyan/35",
  NODE: "text-aeon-cyan border-aeon-cyan/35",
  OBS: "text-aeon-amber border-aeon-amber/35",
  MODEL: "text-aeon-amber border-aeon-amber/35",
};

function formatCoord(lat: number, lon: number) {
  const latHemisphere = lat >= 0 ? "N" : "S";
  const lonHemisphere = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${latHemisphere}  ${Math.abs(lon).toFixed(1)}°${lonHemisphere}`;
}

export function IncidentBriefModal({
  alert,
  onClose,
}: {
  alert: AlertItem;
  onClose: () => void;
}) {
  const critical = alert.severity === "critical";
  const tone = critical ? "red" : alert.severity === "high" ? "amber" : "cyan";
  const toneText =
    tone === "red" ? "text-aeon-red" : tone === "amber" ? "text-aeon-amber" : "text-aeon-cyan";
  const toneBorder =
    tone === "red"
      ? "border-aeon-red/45 shadow-[0_0_80px_rgba(255,90,90,0.14)]"
      : tone === "amber"
        ? "border-aeon-amber/45 shadow-[0_0_80px_rgba(240,180,41,0.12)]"
        : "border-aeon-cyan/35 shadow-[0_0_80px_rgba(79,244,226,0.12)]";
  const corner =
    tone === "red" ? "border-aeon-red" : tone === "amber" ? "border-aeon-amber" : "border-aeon-cyan";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      aria-labelledby="aeon-brief-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070a]/80 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="aeon-alert-in relative w-full max-w-2xl">
        <span className={`pointer-events-none absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 ${corner}`} />
        <span className={`pointer-events-none absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 ${corner}`} />
        <span className={`pointer-events-none absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 ${corner}`} />
        <span className={`pointer-events-none absolute -bottom-px -right-px h-4 w-4 border-r-2 border-b-2 ${corner}`} />

        <div className={`max-h-[min(40rem,86dvh)] overflow-auto border bg-[#071015]/95 p-5 sm:p-7 ${toneBorder}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className={`font-mono text-[10px] tracking-[0.3em] ${
                  tone === "red"
                    ? "text-aeon-red/80"
                    : tone === "amber"
                      ? "text-aeon-amber/80"
                      : "text-aeon-cyan/70"
                }`}
              >
                NODE-01 // FULL BRIEF
              </p>
              <h2
                className="mt-2 font-display text-xl tracking-[0.16em] text-white"
                id="aeon-brief-title"
              >
                {alert.title.toUpperCase()}
              </h2>
              <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-foreground/45">
                {alert.id} · {alert.layer} · {alert.station}
              </p>
            </div>
            <span
              className={`border px-2 py-1 font-mono text-[9px] tracking-[0.16em] ${severityClass[alert.severity]}`}
            >
              {alert.severity.toUpperCase()}
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-foreground/75">{alert.summary}</p>
          <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-aeon-cyan/60">
            {formatCoord(alert.lat, alert.lon)} · OPEN {alert.opened} · SLA {alert.slaMin}m · OWNER{" "}
            {alert.owner ?? "UNASSIGNED"}
          </p>

          <section className="mt-6">
            <p className="font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
              SOURCES IN USE
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {alert.feeds.map((feed) => (
                <li
                  className="border border-aeon-cyan/15 bg-black/25 px-3 py-3"
                  key={`${feed.kind}-${feed.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[11px] tracking-[0.12em] text-white">{feed.id}</p>
                    <span
                      className={`border px-2 py-0.5 font-mono text-[9px] tracking-[0.14em] ${kindClass[feed.kind]}`}
                    >
                      {feed.kind}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-aeon-cyan/70">
                    {feed.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-foreground/60">{feed.use}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 border border-aeon-cyan/15 bg-black/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
                FORECAST MODEL
              </p>
              <p className={`font-mono text-[10px] tracking-[0.16em] ${toneText}`}>
                {alert.prediction.horizon} · {alert.prediction.confidence}% CONF
              </p>
            </div>
            <div className="mt-3 h-1.5 bg-black/50">
              <div
                className={critical ? "h-full bg-aeon-red" : "h-full bg-aeon-amber"}
                style={{ width: `${alert.prediction.confidence}%` }}
              />
            </div>
            <dl className="mt-4 grid gap-3 text-sm leading-6 text-foreground/70 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[10px] tracking-[0.16em] text-foreground/40">
                  OUTLOOK
                </dt>
                <dd className="mt-1">{alert.prediction.outlook}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.16em] text-foreground/40">
                  TRACK
                </dt>
                <dd className="mt-1">{alert.prediction.track}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.16em] text-foreground/40">
                  IMPACT
                </dt>
                <dd className="mt-1">{alert.prediction.impact}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.16em] text-foreground/40">
                  NEXT ACTION
                </dt>
                <dd className="mt-1">{alert.prediction.next}</dd>
              </div>
            </dl>
            <p className="mt-4 font-mono text-[10px] tracking-[0.14em] text-foreground/35">
              PROJECTION IS A MOCK ENVELOPE // NOT A LIVE FORECAST
            </p>
          </section>

          <section className="mt-6">
            <p className="font-mono text-[10px] tracking-[0.22em] text-foreground/40">EVENT LOG</p>
            <ul className="mt-3 space-y-2">
              {alert.timeline.map((event, index) => (
                <li
                  className="font-mono text-[10px] leading-5 tracking-[0.08em] text-foreground/60"
                  key={`${event.stamp}-${index}`}
                >
                  <span className="text-aeon-cyan/70">{event.stamp}</span>
                  <span className="ml-2 text-foreground/75">{event.note}</span>
                </li>
              ))}
            </ul>
          </section>

          <button
            className={`mt-6 w-full border px-4 py-3 font-display text-sm tracking-[0.2em] transition ${
              critical
                ? "border-aeon-red/50 bg-aeon-red/10 text-aeon-red hover:bg-aeon-red/20"
                : "border-aeon-amber/50 bg-aeon-amber/10 text-aeon-amber hover:bg-aeon-amber/20"
            }`}
            onClick={onClose}
            type="button"
          >
            RETURN TO QUEUE
          </button>
        </div>
      </div>
    </div>
  );
}
