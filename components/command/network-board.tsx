"use client";

import { useEffect, useMemo, useState } from "react";
import { useDeckReveal } from "@/components/command/deck-reveal";
import { OrbitSchematic } from "@/components/command/orbit-schematic";
import {
  networkKpis,
  satellites,
  type Satellite,
  type SatStatus,
} from "@/lib/mock/network";

const FILTERS: { id: "all" | SatStatus; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "online", label: "ONLINE" },
  { id: "stare", label: "STARE" },
  { id: "degraded", label: "DEGRADED" },
  { id: "down", label: "DOWN" },
];

const statusClass: Record<SatStatus, string> = {
  online: "text-aeon-cyan border-aeon-cyan/40",
  stare: "text-aeon-amber border-aeon-amber/40",
  degraded: "text-aeon-amber border-aeon-amber/40",
  down: "text-aeon-red border-aeon-red/40",
};

function formatCoord(lat: number, lon: number) {
  const latHemisphere = lat >= 0 ? "N" : "S";
  const lonHemisphere = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${latHemisphere}  ${Math.abs(lon).toFixed(1)}°${lonHemisphere}`;
}

function pingLabel(seconds: number) {
  if (seconds >= 60) return `${Math.round(seconds / 60)}m AGO`;
  return `${seconds}s AGO`;
}

export function NetworkBoard() {
  const revealed = useDeckReveal();
  const [live, setLive] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [selectedId, setSelectedId] = useState(satellites[0].id);

  const visible = useMemo(
    () =>
      filter === "all"
        ? satellites
        : satellites.filter((sat) => sat.status === filter),
    [filter],
  );

  const selected =
    visible.find((sat) => sat.id === selectedId) ?? visible[0] ?? satellites[0];

  useEffect(() => {
    if (!revealed) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setLive(true), reduced ? 0 : 1100);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  function selectSat(id: string) {
    setSelectedId(id);
    const sat = satellites.find((item) => item.id === id);
    if (sat && filter !== "all" && sat.status !== filter) {
      setFilter("all");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {networkKpis.map((kpi, index) => (
          <KpiCard index={index} key={kpi.label} kpi={kpi} live={live} />
        ))}
      </section>

      <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)]">
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <div className="relative h-[22rem] min-h-[16rem] overflow-hidden border border-aeon-cyan/15 bg-[#07131a]/80 lg:h-[26rem]">
            <div className="pointer-events-none absolute left-3 top-3 z-10 font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
              {live ? "CONSTELLATION // ORBITAL MESH" : "CONSTELLATION // RANGING"}
            </div>
            {!live ? (
              <div className="aeon-map-scanline pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-transparent via-aeon-cyan/25 to-transparent" />
            ) : null}
            <OrbitSchematic
              live={live}
              onSelect={selectSat}
              satellites={satellites}
              selectedId={selected.id}
            />
          </div>

          <div className="max-h-[16rem] min-h-0 overflow-hidden border border-aeon-cyan/15 bg-black/20">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aeon-cyan/15 px-3 py-3">
              <p className="font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
                TRACKED ASSETS
              </p>
              <div className="flex flex-wrap gap-1">
                {FILTERS.map((item) => (
                  <button
                    className={`px-2 py-1 font-mono text-[9px] tracking-[0.16em] ${
                      filter === item.id
                        ? "border border-aeon-cyan/50 bg-aeon-cyan/10 text-aeon-cyan"
                        : "border border-transparent text-foreground/40 hover:text-aeon-cyan/80"
                    }`}
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            {live ? (
              <div className="max-h-[12.5rem] overflow-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-[#071015] font-mono text-[9px] tracking-[0.16em] text-foreground/40">
                    <tr>
                      <th className="px-3 py-2 font-medium">ID</th>
                      <th className="px-3 py-2 font-medium">NAME</th>
                      <th className="hidden px-3 py-2 font-medium sm:table-cell">TASK</th>
                      <th className="px-3 py-2 font-medium">STATUS</th>
                      <th className="hidden px-3 py-2 font-medium md:table-cell">PING</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((sat, index) => (
                      <SatRow
                        index={index}
                        key={sat.id}
                        onSelect={selectSat}
                        sat={sat}
                        selected={sat.id === selected.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ul className="space-y-3 p-4">
                {satellites.slice(0, 4).map((sat) => (
                  <li className="space-y-2" key={sat.id}>
                    <div className="aeon-shimmer h-3 w-24" />
                    <div className="aeon-shimmer h-4 w-full" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="min-h-0">
          <SatelliteDetail live={live} sat={selected} />
        </aside>
      </section>
    </div>
  );
}

function KpiCard({
  index,
  kpi,
  live,
}: {
  index: number;
  kpi: (typeof networkKpis)[number];
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

function SatRow({
  index,
  onSelect,
  sat,
  selected,
}: {
  index: number;
  onSelect: (id: string) => void;
  sat: Satellite;
  selected: boolean;
}) {
  return (
    <tr
      className={`aeon-rise cursor-pointer border-b border-aeon-cyan/10 ${
        selected ? "bg-aeon-cyan/10" : "hover:bg-white/5"
      }`}
      onClick={() => onSelect(sat.id)}
      style={{ animationDelay: `${80 + index * 50}ms` }}
    >
      <td className="px-3 py-2 font-mono text-[11px] tracking-[0.12em] text-aeon-cyan/80">
        {sat.id}
      </td>
      <td className="px-3 py-2 text-sm text-white">{sat.name}</td>
      <td className="hidden px-3 py-2 font-mono text-[11px] text-foreground/60 sm:table-cell">
        {sat.task}
      </td>
      <td className="px-3 py-2">
        <span
          className={`border px-2 py-1 font-mono text-[9px] tracking-[0.16em] ${statusClass[sat.status]}`}
        >
          {sat.status.toUpperCase()}
        </span>
      </td>
      <td className="hidden px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-foreground/40 md:table-cell">
        {pingLabel(sat.lastPingSec)}
      </td>
    </tr>
  );
}

function SatelliteDetail({ live, sat }: { live: boolean; sat: Satellite }) {
  if (!live) {
    return (
      <div className="space-y-3 border border-aeon-cyan/15 bg-black/20 p-4">
        <div className="aeon-shimmer h-3 w-28" />
        <div className="aeon-shimmer h-5 w-40" />
        <div className="aeon-shimmer h-3 w-full" />
        <div className="aeon-shimmer h-3 w-5/6" />
      </div>
    );
  }

  return (
      <div className="aeon-rise h-full border border-aeon-cyan/15 bg-black/20 p-4">
      <p className="font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
        SELECTED // {sat.id}
      </p>
      <h2 className="mt-2 font-display text-lg tracking-[0.12em] text-white">
        {sat.name}
      </h2>
      <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-foreground/45">
        {sat.region} · {sat.payload} · {sat.task}
      </p>
      <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-aeon-cyan/60">
        {formatCoord(sat.lat, sat.lon)} · {sat.altitudeKm} KM · INC {sat.inclination}°
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] tracking-[0.12em]">
        <Meter label="POWER" value={sat.powerPct} />
        <Meter label="LINK" value={sat.linkPct} />
        <div className="border border-aeon-cyan/15 px-2 py-2">
          <p className="text-foreground/40">THERMAL</p>
          <p className="mt-1 text-white">{sat.thermalC}°C</p>
        </div>
      </div>

      <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-foreground/45">
        PERIOD {sat.periodMin} MIN · LAST PING {pingLabel(sat.lastPingSec)}
      </p>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  const tone =
    value < 20 ? "bg-aeon-red" : value < 70 ? "bg-aeon-amber" : "bg-aeon-cyan";

  return (
    <div className="border border-aeon-cyan/15 px-2 py-2">
      <p className="text-foreground/40">{label}</p>
      <p className="mt-1 text-white">{value}%</p>
      <div className="mt-2 h-1 bg-black/50">
        <div className={`h-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
