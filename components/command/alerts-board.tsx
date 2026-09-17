"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IncidentBriefModal } from "@/components/command/incident-brief-modal";
import { useDeckReveal } from "@/components/command/deck-reveal";
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  MapBackdrop,
  project,
} from "@/components/command/map-backdrop";
import {
  alertQueue,
  type AlertDisposition,
  type AlertItem,
  type AlertSeverity,
} from "@/lib/mock/alerts";
import { SESSION_BOOT } from "@/lib/session";
import { useAeonSession } from "@/lib/use-session";

type QueueFilter =
  | "all"
  | "unacked"
  | "critical"
  | "high"
  | "watch"
  | "closed";

const FILTERS: { id: QueueFilter; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "unacked", label: "UNACKED" },
  { id: "critical", label: "CRITICAL" },
  { id: "high", label: "HIGH" },
  { id: "watch", label: "WATCH" },
  { id: "closed", label: "CLOSED" },
];

const severityClass: Record<AlertSeverity, string> = {
  critical: "text-aeon-red border-aeon-red/40",
  high: "text-aeon-amber border-aeon-amber/40",
  watch: "text-aeon-cyan border-aeon-cyan/40",
};

const severityFill: Record<AlertSeverity, string> = {
  critical: "#ff5a5a",
  high: "#f0b429",
  watch: "#4ff4e2",
};

const dispositionClass: Record<AlertDisposition, string> = {
  open: "text-aeon-red border-aeon-red/40",
  acked: "text-aeon-cyan border-aeon-cyan/40",
  escalated: "text-aeon-amber border-aeon-amber/40",
  standdown: "text-foreground/40 border-white/15",
};

const dispositionLabel: Record<AlertDisposition, string> = {
  open: "OPEN",
  acked: "ACKED",
  escalated: "ESCALATED",
  standdown: "CLOSED",
};

function formatCoord(lat: number, lon: number) {
  const latHemisphere = lat >= 0 ? "N" : "S";
  const lonHemisphere = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${latHemisphere}  ${Math.abs(lon).toFixed(1)}°${lonHemisphere}`;
}

function stampNow() {
  return `${new Date().toISOString().slice(11, 19)} UTC`;
}

function bumpSeverity(severity: AlertSeverity): AlertSeverity {
  if (severity === "watch") return "high";
  if (severity === "high") return "critical";
  return "critical";
}

function matchesFilter(alert: AlertItem, filter: QueueFilter) {
  if (filter === "all") return true;
  if (filter === "unacked") return alert.disposition === "open";
  if (filter === "closed") return alert.disposition === "standdown";
  if (filter === "critical" || filter === "high" || filter === "watch") {
    return alert.severity === filter && alert.disposition !== "standdown";
  }
  return true;
}

export function AlertsBoard() {
  const revealed = useDeckReveal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefId = searchParams.get("brief");
  const session = useAeonSession();
  const operatorId =
    session && session !== SESSION_BOOT ? session.operatorId : "AEON-OPS-01";
  const [live, setLive] = useState(false);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [items, setItems] = useState(alertQueue);
  const [selectedId, setSelectedId] = useState(alertQueue[0].id);

  useEffect(() => {
    if (!briefId) return;
    setSelectedId(briefId);
    setFilter("all");
  }, [briefId]);

  const visible = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [filter, items],
  );
  const selected =
    items.find((item) => item.id === selectedId) ?? items[0] ?? alertQueue[0];
  const briefItem = briefId
    ? (items.find((item) => item.id === briefId) ??
      alertQueue.find((item) => item.id === briefId) ??
      null)
    : null;

  const openItems = items.filter((item) => item.disposition !== "standdown");
  const unacked = items.filter((item) => item.disposition === "open");
  const critical = openItems.filter((item) => item.severity === "critical");
  const sla = openItems.length
    ? Math.min(...openItems.map((item) => item.slaMin))
    : null;
  const held = items.filter(
    (item) => item.disposition === "acked" || item.disposition === "escalated",
  );

  const kpis = [
    { label: "OPEN", value: String(openItems.length), hint: "ACTIVE" },
    { label: "UNACKED", value: String(unacked.length), hint: "NEEDS OWNER" },
    { label: "CRITICAL", value: String(critical.length), hint: "PRIORITY" },
    { label: "SLA", value: sla === null ? "—" : `${sla}m`, hint: "WORST LEFT" },
    { label: "HELD", value: String(held.length), hint: "ACK / ESC" },
  ];

  useEffect(() => {
    if (!revealed) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setLive(true), reduced ? 0 : 1100);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  function selectAlert(id: string) {
    setSelectedId(id);
    const item = items.find((alert) => alert.id === id);
    if (item && !matchesFilter(item, filter)) setFilter("all");
  }

  function patchSelected(
    next: Partial<AlertItem>,
    event: { stamp: string; note: string },
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? { ...item, ...next, timeline: [event, ...item.timeline] }
          : item,
      ),
    );
  }

  function acknowledge() {
    if (selected.disposition !== "open") return;
    patchSelected(
      { disposition: "acked", status: "ACKED", owner: operatorId },
      { stamp: stampNow(), note: `ACKED by ${operatorId}` },
    );
  }

  function escalate() {
    if (selected.disposition === "standdown") return;
    patchSelected(
      {
        disposition: "escalated",
        status: "ESCALATED",
        severity: bumpSeverity(selected.severity),
        owner: operatorId,
        slaMin: Math.max(6, selected.slaMin - 8),
      },
      { stamp: stampNow(), note: `ESCALATED by ${operatorId}` },
    );
  }

  function standDown() {
    if (selected.disposition === "standdown") return;
    patchSelected(
      { disposition: "standdown", status: "CLOSED", owner: operatorId },
      { stamp: stampNow(), note: `STAND DOWN by ${operatorId}` },
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi, index) => (
          <KpiCard index={index} key={kpi.label} kpi={kpi} live={live} />
        ))}
      </section>

      <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)]">
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <div className="relative h-[16rem] min-h-[12rem] overflow-hidden border border-aeon-cyan/15 bg-[#07131a]/80 lg:h-[18rem]">
            <div className="pointer-events-none absolute left-3 top-3 z-10 font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
              {live ? "QUEUE // LOCATOR" : "QUEUE // ACQUIRING"}
            </div>
            {!live ? (
              <div className="aeon-map-scanline pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-transparent via-aeon-cyan/25 to-transparent" />
            ) : null}
            <AlertMap
              items={visible.length ? visible : items}
              live={live}
              onSelect={selectAlert}
              selectedId={selected.id}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-hidden border border-aeon-cyan/15 bg-black/20">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aeon-cyan/15 px-3 py-3">
              <p className="font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
                INCIDENT QUEUE
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
              visible.length ? (
                <div className="max-h-[18rem] overflow-auto">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[#071015] font-mono text-[9px] tracking-[0.16em] text-foreground/40">
                      <tr>
                        <th className="px-3 py-2 font-medium">ID</th>
                        <th className="px-3 py-2 font-medium">INCIDENT</th>
                        <th className="px-3 py-2 font-medium">SEV</th>
                        <th className="hidden px-3 py-2 font-medium sm:table-cell">
                          STATE
                        </th>
                        <th className="hidden px-3 py-2 font-medium md:table-cell">
                          SLA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((alert, index) => (
                        <QueueRow
                          alert={alert}
                          index={index}
                          key={alert.id}
                          onSelect={selectAlert}
                          selected={alert.id === selected.id}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-3 py-6 font-mono text-[10px] tracking-[0.18em] text-foreground/40">
                  NO INCIDENTS IN FILTER
                </p>
              )
            ) : (
              <ul className="space-y-3 p-4">
                {alertQueue.map((alert) => (
                  <li className="space-y-2" key={alert.id}>
                    <div className="aeon-shimmer h-3 w-24" />
                    <div className="aeon-shimmer h-4 w-full" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="min-h-0">
          <AlertDetail
            alert={selected}
            live={live}
            onAcknowledge={acknowledge}
            onEscalate={escalate}
            onOpenBrief={() =>
              router.replace(`/command/alerts?brief=${encodeURIComponent(selected.id)}`)
            }
            onStandDown={standDown}
          />
        </aside>
      </section>

      {revealed && briefItem ? (
        <IncidentBriefModal
          alert={briefItem}
          onClose={() => router.replace("/command/alerts")}
        />
      ) : null}
    </div>
  );
}

function AlertMap({
  items,
  live,
  onSelect,
  selectedId,
}: {
  items: AlertItem[];
  live: boolean;
  onSelect: (id: string) => void;
  selectedId: string;
}) {
  return (
    <svg
      aria-label="Incident locator map"
      className="h-full w-full"
      role="img"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
    >
      <MapBackdrop live={live} />
      {live
        ? items.map((item, index) => {
            const { x, y } = project(item.lat, item.lon);
            const selected = item.id === selectedId;
            const fill =
              item.disposition === "standdown"
                ? "rgba(216,236,234,0.35)"
                : severityFill[item.severity];

            return (
              <g key={item.id} transform={`translate(${x} ${y})`}>
                <g
                  className="aeon-marker-in cursor-pointer"
                  onClick={() => onSelect(item.id)}
                  style={{ animationDelay: `${160 + index * 110}ms` }}
                >
                  {selected ? (
                    <circle
                      className="aeon-radar"
                      fill="none"
                      r="10"
                      stroke={fill}
                      strokeWidth="1.5"
                    />
                  ) : null}
                  <circle fill={fill} opacity="0.2" r={selected ? 16 : 11} />
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
                      {item.id}
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

function QueueRow({
  alert,
  index,
  onSelect,
  selected,
}: {
  alert: AlertItem;
  index: number;
  onSelect: (id: string) => void;
  selected: boolean;
}) {
  return (
    <tr
      className={`aeon-rise cursor-pointer border-b border-aeon-cyan/10 ${
        selected ? "bg-aeon-cyan/10" : "hover:bg-white/5"
      }`}
      onClick={() => onSelect(alert.id)}
      style={{ animationDelay: `${80 + index * 50}ms` }}
    >
      <td className="px-3 py-2 font-mono text-[11px] tracking-[0.12em] text-aeon-cyan/80">
        {alert.id}
      </td>
      <td className="px-3 py-2 text-sm text-white">{alert.title}</td>
      <td className="px-3 py-2">
        <span
          className={`border px-2 py-1 font-mono text-[9px] tracking-[0.16em] ${severityClass[alert.severity]}`}
        >
          {alert.severity.toUpperCase()}
        </span>
      </td>
      <td className="hidden px-3 py-2 sm:table-cell">
        <span
          className={`border px-2 py-1 font-mono text-[9px] tracking-[0.16em] ${dispositionClass[alert.disposition]}`}
        >
          {dispositionLabel[alert.disposition]}
        </span>
      </td>
      <td className="hidden px-3 py-2 font-mono text-[10px] text-foreground/40 md:table-cell">
        {alert.disposition === "standdown" ? "—" : `${alert.slaMin}m`}
      </td>
    </tr>
  );
}

function AlertDetail({
  alert,
  live,
  onAcknowledge,
  onEscalate,
  onOpenBrief,
  onStandDown,
}: {
  alert: AlertItem;
  live: boolean;
  onAcknowledge: () => void;
  onEscalate: () => void;
  onOpenBrief: () => void;
  onStandDown: () => void;
}) {
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

  const closed = alert.disposition === "standdown";
  const canAck = alert.disposition === "open";

  return (
    <div className="aeon-rise flex h-full min-h-0 flex-col border border-aeon-cyan/15 bg-black/20 p-4">
      <p className="font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
        SELECTED // {alert.id}
      </p>
      <h2 className="mt-2 font-display text-lg tracking-[0.12em] text-white">
        {alert.title}
      </h2>
      <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-foreground/45">
        {alert.layer} · {alert.region} · {alert.station}
      </p>
      <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-aeon-cyan/60">
        {formatCoord(alert.lat, alert.lon)} · OPEN {alert.opened} · SLA{" "}
        {closed ? "—" : `${alert.slaMin}m`}
      </p>
      <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-foreground/40">
        OWNER {alert.owner ?? "UNASSIGNED"} · {alert.status}
      </p>
      <p className="mt-3 text-sm leading-6 text-foreground/70">{alert.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2 font-mono text-[9px] tracking-[0.14em]">
        {alert.satellites.map((id) => (
          <Link
            className="border border-aeon-cyan/30 px-2 py-1 text-aeon-cyan/80 hover:bg-aeon-cyan/10"
            href="/command/network"
            key={id}
          >
            SAT {id}
          </Link>
        ))}
        {alert.observations.map((id) => (
          <Link
            className="border border-aeon-cyan/30 px-2 py-1 text-aeon-cyan/80 hover:bg-aeon-cyan/10"
            href="/command/observe"
            key={id}
          >
            OBS {id}
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ActionButton disabled={!canAck} label="ACK" onClick={onAcknowledge} tone="cyan" />
        <ActionButton
          disabled={closed}
          label="ESCALATE"
          onClick={onEscalate}
          tone="amber"
        />
        <ActionButton
          disabled={closed}
          label="STAND DOWN"
          onClick={onStandDown}
          tone="red"
        />
      </div>
      <button
        className="mt-2 w-full border border-aeon-cyan/30 px-2 py-2 font-mono text-[9px] tracking-[0.16em] text-aeon-cyan/80 hover:bg-aeon-cyan/10"
        onClick={onOpenBrief}
        type="button"
      >
        FULL BRIEF
      </button>

      <div className="mt-4 min-h-0 flex-1 overflow-auto border-t border-aeon-cyan/15 pt-3">
        <p className="font-mono text-[10px] tracking-[0.18em] text-foreground/40">
          EVENT LOG
        </p>
        <ul className="mt-2 space-y-2">
          {alert.timeline.map((event, index) => (
            <li
              className="font-mono text-[10px] leading-5 tracking-[0.08em] text-foreground/60"
              key={`${event.stamp}-${index}`}
            >
              <span className="text-aeon-cyan/70">{event.stamp}</span>
              <span className="mt-0.5 block text-foreground/75">{event.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActionButton({
  disabled,
  label,
  onClick,
  tone,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
  tone: "cyan" | "amber" | "red";
}) {
  const toneClass = {
    cyan: "border-aeon-cyan/40 text-aeon-cyan hover:bg-aeon-cyan/10",
    amber: "border-aeon-amber/40 text-aeon-amber hover:bg-aeon-amber/10",
    red: "border-aeon-red/40 text-aeon-red hover:bg-aeon-red/10",
  }[tone];

  return (
    <button
      className={`px-2 py-2 font-mono text-[9px] tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-35 ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
