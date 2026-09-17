"use client";

import { useEffect, useMemo, useState } from "react";
import {
  incidents,
  overviewKpis,
  tickerItems,
  type Incident,
  type Severity,
} from "@/lib/mock/overview";
import { useDeckReveal } from "@/components/command/deck-reveal";
import { WorldMap } from "@/components/command/world-map";

const severityClass: Record<Severity, string> = {
  critical: "text-aeon-red border-aeon-red/40",
  high: "text-aeon-amber border-aeon-amber/40",
  watch: "text-aeon-cyan border-aeon-cyan/40",
};

function formatCoord(lat: number, lon: number) {
  const latHemisphere = lat >= 0 ? "N" : "S";
  const lonHemisphere = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${latHemisphere}  ${Math.abs(lon).toFixed(1)}°${lonHemisphere}`;
}

export function OverviewBoard() {
  const revealed = useDeckReveal();
  const [live, setLive] = useState(false);
  const [selectedId, setSelectedId] = useState(incidents[0].id);
  const selected = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) ?? incidents[0],
    [selectedId],
  );

  useEffect(() => {
    if (!revealed) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setLive(true), reduced ? 0 : 1100);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {overviewKpis.map((kpi, index) => (
          <KpiCard index={index} key={kpi.label} kpi={kpi} live={live} />
        ))}
      </section>

      <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)]">
        <div className="relative min-h-[260px] overflow-hidden border border-aeon-cyan/15 bg-[#07131a]/80">
          <div className="pointer-events-none absolute left-3 top-3 z-10 font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
            {live ? "GLOBAL GRID // EQUIRECTANGULAR" : "GLOBAL GRID // ACQUIRING"}
          </div>
          {!live ? (
            <div className="aeon-map-scanline pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-transparent via-aeon-cyan/25 to-transparent" />
          ) : null}
          <WorldMap
            incidents={incidents}
            live={live}
            onSelect={setSelectedId}
            selectedId={selected.id}
          />
        </div>

        <aside className="flex min-h-0 flex-col gap-3">
          <div className="min-h-0 flex-1 overflow-auto border border-aeon-cyan/15 bg-black/20">
            <div className="border-b border-aeon-cyan/15 px-4 py-3 font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
              ACTIVE INCIDENTS
            </div>
            {live ? (
              <ul>
                {incidents.map((incident, index) => (
                  <IncidentRow
                    incident={incident}
                    index={index}
                    key={incident.id}
                    onSelect={setSelectedId}
                    selected={incident.id === selected.id}
                  />
                ))}
              </ul>
            ) : (
              <ul className="space-y-3 p-4">
                {incidents.map((incident) => (
                  <li className="space-y-2" key={incident.id}>
                    <div className="aeon-shimmer h-3 w-24" />
                    <div className="aeon-shimmer h-4 w-full" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-aeon-cyan/15 bg-black/20 p-4">
            {live ? (
              <div className="aeon-rise" style={{ animationDelay: "280ms" }}>
                <p className="font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
                  SELECTED // {selected.id}
                </p>
                <h2 className="mt-2 font-display text-lg tracking-[0.12em] text-white">
                  {selected.title}
                </h2>
                <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-foreground/45">
                  {selected.region} · {selected.status}
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {selected.summary}
                </p>
                <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-aeon-cyan/60">
                  {formatCoord(selected.lat, selected.lon)}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="aeon-shimmer h-3 w-28" />
                <div className="aeon-shimmer h-5 w-40" />
                <div className="aeon-shimmer h-3 w-full" />
                <div className="aeon-shimmer h-3 w-5/6" />
              </div>
            )}
          </div>
        </aside>
      </section>

      <footer className="overflow-hidden border border-aeon-cyan/15 bg-black/30 py-2">
        {live ? (
          <div className="aeon-marquee flex w-max gap-10 whitespace-nowrap font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/75">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        ) : (
          <div className="aeon-shimmer mx-3 h-3" />
        )}
      </footer>
    </div>
  );
}

function KpiCard({
  index,
  kpi,
  live,
}: {
  index: number;
  kpi: (typeof overviewKpis)[number];
  live: boolean;
}) {
  if (!live) {
    return (
      <div className="border border-aeon-cyan/15 bg-black/25 px-3 py-3">
        <div className="aeon-shimmer h-3 w-16" />
        <div className="aeon-shimmer mt-3 h-6 w-20" />
        <div className="aeon-shimmer mt-2 h-2 w-12" />
      </div>
    );
  }

  return (
    <div
      className="aeon-rise border border-aeon-cyan/15 bg-black/25 px-3 py-3"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <p className="font-mono text-[10px] tracking-[0.2em] text-foreground/40">
        {kpi.label}
      </p>
      <p className="mt-1 font-display text-xl tracking-[0.12em] text-white">
        {kpi.value}
      </p>
      <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-aeon-cyan/60">
        {kpi.hint}
      </p>
    </div>
  );
}

function IncidentRow({
  incident,
  index,
  onSelect,
  selected,
}: {
  incident: Incident;
  index: number;
  onSelect: (id: string) => void;
  selected: boolean;
}) {
  return (
    <li className="aeon-rise" style={{ animationDelay: `${120 + index * 80}ms` }}>
      <button
        className={`flex w-full items-start justify-between gap-3 border-b border-aeon-cyan/10 px-4 py-3 text-left transition ${
          selected ? "bg-aeon-cyan/10" : "hover:bg-white/5"
        }`}
        onClick={() => onSelect(incident.id)}
        type="button"
      >
        <span>
          <span className="block font-mono text-[10px] tracking-[0.16em] text-foreground/40">
            {incident.id}
          </span>
          <span className="mt-1 block text-sm text-white">{incident.title}</span>
        </span>
        <span
          className={`shrink-0 border px-2 py-1 font-mono text-[9px] tracking-[0.16em] ${severityClass[incident.severity]}`}
        >
          {incident.severity.toUpperCase()}
        </span>
      </button>
    </li>
  );
}
