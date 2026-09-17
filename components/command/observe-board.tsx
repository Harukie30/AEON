"use client";

import { useEffect, useMemo, useState } from "react";
import { useDeckReveal } from "@/components/command/deck-reveal";
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  MapBackdrop,
  project,
} from "@/components/command/map-backdrop";
import {
  observations,
  observeLayers,
  type Observation,
  type ObserveFilter,
  type ObserveLayer,
  type ObserveStatus,
} from "@/lib/mock/observe";

const statusClass: Record<ObserveStatus, string> = {
  alert: "text-aeon-red border-aeon-red/40",
  watch: "text-aeon-amber border-aeon-amber/40",
  nominal: "text-aeon-cyan border-aeon-cyan/40",
};

const statusFill: Record<ObserveStatus, string> = {
  alert: "#ff5a5a",
  watch: "#f0b429",
  nominal: "#4ff4e2",
};

const trendMark: Record<Observation["trend"], string> = {
  up: "▲",
  down: "▼",
  stable: "■",
};

const layerLabel: Record<ObserveLayer, string> = {
  weather: "WX",
  temperature: "TMP",
  air: "AIR",
  ocean: "OCN",
  seismic: "SEI",
};

function formatCoord(lat: number, lon: number) {
  const latHemisphere = lat >= 0 ? "N" : "S";
  const lonHemisphere = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${latHemisphere}  ${Math.abs(lon).toFixed(1)}°${lonHemisphere}`;
}

export function ObserveBoard() {
  const revealed = useDeckReveal();
  const [live, setLive] = useState(false);
  const [layer, setLayer] = useState<ObserveFilter>("all");
  const [selectedId, setSelectedId] = useState(observations[0].id);

  const meta = observeLayers.find((item) => item.id === layer) ?? observeLayers[0];
  const rows = useMemo(
    () =>
      layer === "all"
        ? observations
        : observations.filter((item) => item.layer === layer),
    [layer],
  );
  const selected = rows.find((item) => item.id === selectedId) ?? rows[0];

  useEffect(() => {
    if (!revealed) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setLive(true), reduced ? 0 : 1100);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  function selectLayer(next: ObserveFilter) {
    setLayer(next);
    if (next === "all") return;
    const keep = observations.find(
      (item) => item.id === selectedId && item.layer === next,
    );
    if (keep) return;
    const first = observations.find((item) => item.layer === next);
    if (first) setSelectedId(first.id);
  }

  if (!selected) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
          ENVIRONMENT LAYERS // {meta.kicker}
        </p>
        <div className="flex flex-wrap gap-1">
          {observeLayers.map((item) => (
            <button
              className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] ${
                layer === item.id
                  ? "border border-aeon-cyan/50 bg-aeon-cyan/10 text-aeon-cyan"
                  : "border border-transparent text-foreground/40 hover:text-aeon-cyan/80"
              }`}
              key={item.id}
              onClick={() => selectLayer(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {meta.kpis.map((kpi, index) => (
          <KpiCard index={index} key={`${layer}-${kpi.label}`} kpi={kpi} live={live} />
        ))}
      </section>

      <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)]">
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <div className="relative h-[22rem] min-h-[16rem] overflow-hidden border border-aeon-cyan/15 bg-[#07131a]/80 lg:h-[26rem]">
            <div className="pointer-events-none absolute left-3 top-3 z-10 font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
              {live ? `LAYER // ${meta.label}` : "LAYER // ACQUIRING"}
            </div>
            {live ? (
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex gap-3 font-mono text-[9px] tracking-[0.16em] text-foreground/45">
                <span className="text-aeon-red">● ALERT</span>
                <span className="text-aeon-amber">● WATCH</span>
                <span className="text-aeon-cyan">● NOMINAL</span>
              </div>
            ) : (
              <div className="aeon-map-scanline pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-transparent via-aeon-cyan/25 to-transparent" />
            )}
            <ObserveMap
              live={live}
              onSelect={setSelectedId}
              rows={rows}
              selectedId={selected.id}
            />
          </div>

          <div className="max-h-[16rem] min-h-0 overflow-hidden border border-aeon-cyan/15 bg-black/20">
            <div className="border-b border-aeon-cyan/15 px-3 py-3 font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
              STATION READINGS
            </div>
            {live ? (
              <div className="max-h-[12.5rem] overflow-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-[#071015] font-mono text-[9px] tracking-[0.16em] text-foreground/40">
                    <tr>
                      <th className="px-3 py-2 font-medium">ID</th>
                      <th className="px-3 py-2 font-medium">STATION</th>
                      <th className="hidden px-3 py-2 font-medium sm:table-cell">VALUE</th>
                      <th className="px-3 py-2 font-medium">STATUS</th>
                      <th className="hidden px-3 py-2 font-medium md:table-cell">LAYER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <ReadingRow
                        index={index}
                        key={row.id}
                        onSelect={setSelectedId}
                        row={row}
                        selected={row.id === selected.id}
                        showLayer={layer === "all"}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ul className="space-y-3 p-4">
                {rows.slice(0, 4).map((row) => (
                  <li className="space-y-2" key={row.id}>
                    <div className="aeon-shimmer h-3 w-24" />
                    <div className="aeon-shimmer h-4 w-full" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="min-h-0">
          <ReadingDetail live={live} row={selected} />
        </aside>
      </section>
    </div>
  );
}

function ObserveMap({
  live,
  onSelect,
  rows,
  selectedId,
}: {
  live: boolean;
  onSelect: (id: string) => void;
  rows: Observation[];
  selectedId: string;
}) {
  return (
    <svg
      aria-label="Environmental observation map"
      className="h-full w-full"
      role="img"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
    >
      <MapBackdrop live={live} />
      {live
        ? rows.map((row, index) => {
            const { x, y } = project(row.lat, row.lon);
            const selected = row.id === selectedId;
            const fill = statusFill[row.status];
            const radius = row.status === "alert" ? 16 : row.status === "watch" ? 12 : 9;

            return (
              <g key={row.id} transform={`translate(${x} ${y})`}>
                <g
                  className="aeon-marker-in cursor-pointer"
                  onClick={() => onSelect(row.id)}
                  style={{ animationDelay: `${160 + index * 90}ms` }}
                >
                  <LayerSignature fill={fill} layer={row.layer} selected={selected} />
                  {selected ? (
                    <circle
                      className="aeon-radar"
                      fill="none"
                      r="10"
                      stroke={fill}
                      strokeWidth="1.5"
                    />
                  ) : null}
                  <circle fill={fill} opacity="0.2" r={selected ? radius + 4 : radius} />
                  <circle fill={fill} r={selected ? 5 : 3.5} />
                  {selected ? (
                    <text
                      fill="#d8ecea"
                      fontFamily="monospace"
                      fontSize="10"
                      letterSpacing="1.2"
                      x="10"
                      y="-10"
                    >
                      {row.id}
                    </text>
                  ) : null}
                </g>
              </g>
            );
          })
        : null}
    </svg>
  );
}

function LayerSignature({
  fill,
  layer,
  selected,
}: {
  fill: string;
  layer: ObserveLayer;
  selected: boolean;
}) {
  const opacity = selected ? 0.55 : 0.28;

  if (layer === "weather") {
    return (
      <>
        <circle fill="none" opacity={opacity} r="22" stroke={fill} strokeDasharray="4 5" />
        <circle fill="none" opacity={opacity} r="32" stroke={fill} strokeDasharray="2 6" />
      </>
    );
  }

  if (layer === "temperature") {
    return (
      <ellipse
        fill={fill}
        opacity={selected ? 0.16 : 0.1}
        rx="28"
        ry="18"
        stroke={fill}
        strokeOpacity={opacity}
      />
    );
  }

  if (layer === "air") {
    return (
      <ellipse
        fill="none"
        opacity={opacity}
        rx="36"
        ry="12"
        stroke={fill}
        strokeDasharray="6 4"
        transform="rotate(-18)"
      />
    );
  }

  if (layer === "ocean") {
    return (
      <>
        <path d="M-28 6 Q-10 0 8 6 T44 6" fill="none" opacity={opacity} stroke={fill} />
        <path d="M-24 14 Q-6 8 12 14 T40 14" fill="none" opacity={opacity} stroke={fill} />
      </>
    );
  }

  return (
    <>
      <circle fill="none" opacity={opacity} r="18" stroke={fill} />
      <circle fill="none" opacity={opacity} r="28" stroke={fill} strokeDasharray="1 4" />
    </>
  );
}

function KpiCard({
  index,
  kpi,
  live,
}: {
  index: number;
  kpi: { label: string; value: string; hint: string };
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

function ReadingRow({
  index,
  onSelect,
  row,
  selected,
  showLayer,
}: {
  index: number;
  onSelect: (id: string) => void;
  row: Observation;
  selected: boolean;
  showLayer: boolean;
}) {
  return (
    <tr
      className={`aeon-rise cursor-pointer border-b border-aeon-cyan/10 ${
        selected ? "bg-aeon-cyan/10" : "hover:bg-white/5"
      }`}
      onClick={() => onSelect(row.id)}
      style={{ animationDelay: `${80 + index * 45}ms` }}
    >
      <td className="px-3 py-2 font-mono text-[11px] tracking-[0.12em] text-aeon-cyan/80">
        {row.id}
      </td>
      <td className="px-3 py-2 text-sm text-white">{row.station}</td>
      <td className="hidden px-3 py-2 font-mono text-[11px] text-foreground/70 sm:table-cell">
        {row.value} {row.unit} {trendMark[row.trend]}
      </td>
      <td className="px-3 py-2">
        <span
          className={`border px-2 py-1 font-mono text-[9px] tracking-[0.16em] ${statusClass[row.status]}`}
        >
          {row.status.toUpperCase()}
        </span>
      </td>
      <td className="hidden px-3 py-2 font-mono text-[10px] text-foreground/40 md:table-cell">
        {showLayer ? layerLabel[row.layer] : row.sensor}
      </td>
    </tr>
  );
}

function ReadingDetail({ live, row }: { live: boolean; row: Observation }) {
  if (!live) {
    return (
      <div className="space-y-3 border border-aeon-cyan/15 bg-black/20 p-4">
        <div className="aeon-shimmer h-3 w-28" />
        <div className="aeon-shimmer h-5 w-40" />
        <div className="aeon-shimmer h-3 w-full" />
        <div className="aeon-shimmer h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="aeon-rise h-full border border-aeon-cyan/15 bg-black/20 p-4">
      <p className="font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
        SELECTED // {row.id}
      </p>
      <h2 className="mt-2 font-display text-lg tracking-[0.12em] text-white">
        {row.station}
      </h2>
      <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-foreground/45">
        {layerLabel[row.layer]} · {row.region} · {row.sensor}
      </p>
      <p className="mt-4 font-display text-3xl tracking-[0.08em] text-white">
        {row.value}
        <span className="ml-2 font-mono text-sm tracking-[0.14em] text-aeon-cyan/70">
          {row.unit} {trendMark[row.trend]}
        </span>
      </p>
      <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-aeon-cyan/60">
        {formatCoord(row.lat, row.lon)} · INGEST {row.updated}
      </p>
      <Sparkline samples={row.samples} status={row.status} />
      <p className="mt-4 text-sm leading-6 text-foreground/70">{row.summary}</p>
      {row.incidentId ? (
        <p className="mt-4 border border-aeon-amber/30 bg-aeon-amber/10 px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-aeon-amber">
          LINKED {row.incidentId}
        </p>
      ) : (
        <p className="mt-4 font-mono text-[10px] tracking-[0.16em] text-foreground/35">
          NO INCIDENT LINK
        </p>
      )}
    </div>
  );
}

function Sparkline({
  samples,
  status,
}: {
  samples: number[];
  status: ObserveStatus;
}) {
  const width = 240;
  const height = 52;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const span = max - min || 1;
  const points = samples
    .map((value, index) => {
      const x = (index / (samples.length - 1)) * width;
      const y = height - 6 - ((value - min) / span) * (height - 12);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-4">
      <p className="font-mono text-[10px] tracking-[0.18em] text-foreground/40">
        8-SAMPLE TRACE
      </p>
      <svg
        aria-hidden="true"
        className="mt-2 h-14 w-full"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        <polyline
          fill="none"
          points={points}
          stroke={statusFill[status]}
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
