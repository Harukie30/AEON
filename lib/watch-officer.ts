import { alertQueue, type AlertItem } from "@/lib/mock/alerts";
import { observations } from "@/lib/mock/observe";
import { overviewKpis } from "@/lib/mock/overview";
import { satellites } from "@/lib/mock/network";
import { getWatchVoice } from "@/lib/watch-voice";

export type WatchDeck = "overview" | "network" | "observe" | "alerts";
export type WatchTone = "cyan" | "amber" | "red";

export type WatchLine = {
  tone: WatchTone;
  text: string;
};

export const WATCH_VOICE_KEY = "aeon.watch.voice";
export const WATCH_READBACK_EVENT = "aeon-watch-readback";

let queuedReadback: WatchLine[] | null = null;
let queuedReadbackId: string | null = null;

export function findAlert(id: string) {
  return alertQueue.find((item) => item.id === id) ?? null;
}

export function incidentBrief(alert: AlertItem): WatchLine[] {
  const tone: WatchTone =
    alert.severity === "critical" ? "red" : alert.severity === "high" ? "amber" : "cyan";
  const point =
    alert.severity === "critical"
      ? "Critical point"
      : alert.severity === "high"
        ? "High point"
        : "Watch item";

  return [
    {
      tone,
      text: `Acknowledged. ${point} ${alert.id}, ${alert.title}. ${alert.region}, station ${alert.station}. SLA ${alert.slaMin} minutes. Owner ${alert.owner ?? "unassigned"}.`,
    },
    {
      tone,
      text: alert.summary,
    },
    {
      tone: "amber",
      text: `Forecast ${alert.prediction.horizon}, ${alert.prediction.confidence} percent confidence. ${alert.prediction.outlook}`,
    },
    {
      tone,
      text: `Impact: ${alert.prediction.impact} Next action: ${alert.prediction.next}`,
    },
  ];
}

export function beginIncidentReadback(alert: AlertItem) {
  const lines = incidentBrief(alert);
  queuedReadback = lines;
  queuedReadbackId = alert.id;
  void getWatchVoice().speak(lines.map((line) => line.text).join(" "));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WATCH_READBACK_EVENT));
  }
  return lines;
}

export function takeQueuedReadback() {
  if (!queuedReadback) return null;
  const next = { id: queuedReadbackId, lines: queuedReadback };
  queuedReadback = null;
  queuedReadbackId = null;
  return next;
}

export function deckFromPath(pathname: string): WatchDeck {
  if (pathname.startsWith("/command/network")) return "network";
  if (pathname.startsWith("/command/observe")) return "observe";
  if (pathname.startsWith("/command/alerts")) return "alerts";
  return "overview";
}

function coverageHint() {
  return overviewKpis.find((kpi) => kpi.label === "COVERAGE")?.value ?? "98.4%";
}

function listNames(items: string[]) {
  if (items.length === 0) return "none";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function briefFor(
  deck: WatchDeck,
  operatorId: string,
  kind: "boot" | "module",
): WatchLine[] {
  switch (deck) {
    case "network":
      return networkBrief(kind);
    case "observe":
      return observeBrief(kind);
    case "alerts":
      return alertsBrief(kind);
    default:
      return overviewBrief(operatorId, kind);
  }
}

export function heartbeatFor(deck: WatchDeck, tick: number): WatchLine {
  const pool = heartbeatPool(deck);
  return pool[tick % pool.length];
}

function overviewBrief(operatorId: string, kind: "boot" | "module"): WatchLine[] {
  const critical = alertQueue.filter((item) => item.severity === "critical");
  const high = alertQueue.filter((item) => item.severity === "high");
  const watch = alertQueue.filter(
    (item) => item.severity === "watch" && item.disposition !== "standdown",
  );
  const unassigned = critical.find((item) => !item.owner);

  const lines: WatchLine[] = [
    {
      tone: "cyan",
      text:
        kind === "boot"
          ? `Operator ${operatorId}, Pacific Node 07 is live. Command deck is on the grid. Coverage is holding at ${coverageHint()}.`
          : `Back on overview. Global grid is locked at ${coverageHint()}. Watch officer holding the picture.`,
    },
  ];

  if (critical[0]) {
    lines.push({
      tone: "red",
      text: `Critical point: ${critical[0].title} over ${critical[0].region}. ${critical[0].summary}${
        unassigned ? " The item is still unassigned." : ""
      }`,
    });
  }

  if (high[0]) {
    lines.push({
      tone: "amber",
      text: `High track: ${high[0].title}. ${high[0].summary}`,
    });
  }

  if (watch.length) {
    lines.push({
      tone: "cyan",
      text: `Watch board: ${listNames(watch.map((item) => item.title))}.`,
    });
  }

  return lines;
}

function networkBrief(kind: "boot" | "module"): WatchLine[] {
  const online = satellites.filter((sat) => sat.status === "online");
  const degraded = satellites.filter((sat) => sat.status === "degraded");
  const down = satellites.filter((sat) => sat.status === "down");
  const stare = satellites.filter((sat) => sat.status === "stare");

  return [
    {
      tone: "cyan",
      text:
        kind === "boot"
          ? `Constellation is live. ${online.length} birds nominal, ${degraded.length} degraded, ${down.length} down.`
          : `Switching to constellation. ${online.length} online, ${degraded.length} degraded, ${down.length} down.`,
    },
    ...(stare.length
      ? [
          {
            tone: "amber" as const,
            text: `${stare[0].id} ${stare[0].name} is holding stare over ${stare[0].region}. Task is ${stare[0].task}.`,
          },
        ]
      : []),
    ...(down.length
      ? [
          {
            tone: "red" as const,
            text: `${down[0].id} ${down[0].name} is down. Last ping ${down[0].lastPingSec}s ago. No lock.`,
          },
        ]
      : []),
    ...(degraded.length
      ? [
          {
            tone: "amber" as const,
            text: `Degraded birds: ${listNames(
              degraded.map((sat) => `${sat.id} ${sat.name}`),
            )}.`,
          },
        ]
      : []),
  ];
}

function observeBrief(kind: "boot" | "module"): WatchLine[] {
  const alert = observations.filter((row) => row.status === "alert");
  const watch = observations.filter((row) => row.status === "watch");
  const layers = Array.from(new Set(alert.map((row) => row.layer.toUpperCase())));

  return [
    {
      tone: "cyan",
      text:
        kind === "boot"
          ? `Observation grid is live. ${alert.length} stations in alert, ${watch.length} on watch, five layers armed.`
          : `Observation layers are up. ${alert.length} alert cells, ${watch.length} watch cells.`,
    },
    ...(alert.length
      ? [
          {
            tone: "red" as const,
            text: `Priority stations: ${listNames(alert.map((row) => row.station))}. ${
              alert[0].summary
            }`,
          },
        ]
      : []),
    ...(layers.length
      ? [
          {
            tone: "amber" as const,
            text: `Alert layers in play: ${listNames(layers)}.`,
          },
        ]
      : []),
  ];
}

function alertsBrief(kind: "boot" | "module"): WatchLine[] {
  const open = alertQueue.filter((item) => item.disposition === "open");
  const unacked = open.filter((item) => !item.owner);
  const priority =
    alertQueue.find((item) => item.severity === "critical" && item.disposition !== "standdown") ??
    open[0];

  return [
    {
      tone: open.some((item) => item.severity === "critical") ? "red" : "amber",
      text:
        kind === "boot"
          ? `Alert queue is live. ${open.length} open, ${unacked.length} unacknowledged.`
          : `Alert queue on screen. ${open.length} open items, ${unacked.length} still unacked.`,
    },
    ...(priority
      ? [
          {
            tone: (priority.severity === "critical" ? "red" : "amber") as WatchTone,
            text: `Priority is ${priority.id}, ${priority.title}. SLA ${priority.slaMin} minutes. Owner ${
              priority.owner ?? "unassigned"
            }.`,
          },
        ]
      : []),
  ];
}

function heartbeatPool(deck: WatchDeck): WatchLine[] {
  const critical = alertQueue.find(
    (item) => item.severity === "critical" && item.disposition !== "standdown",
  );
  const high = alertQueue.find(
    (item) => item.severity === "high" && item.disposition !== "standdown",
  );
  const down = satellites.find((sat) => sat.status === "down");
  const stare = satellites.find((sat) => sat.status === "stare");
  const alertCount = observations.filter((row) => row.status === "alert").length;

  const common: WatchLine[] = [
    {
      tone: "cyan",
      text: `Uplink remains stable on Node-01. Coverage holding at ${coverageHint()}.`,
    },
  ];

  if (critical) {
    common.push({
      tone: "red",
      text: `${critical.id} still ${critical.disposition === "open" ? "open" : critical.disposition}. ${critical.title} remains the critical point.`,
    });
  }

  if (high) {
    common.push({
      tone: "amber",
      text: `${high.id} ${high.title} is still on a high track.`,
    });
  }

  if (deck === "network") {
    return [
      ...common,
      ...(stare
        ? [
            {
              tone: "amber" as const,
              text: `${stare.id} remains in stare hold over ${stare.region}.`,
            },
          ]
        : []),
      ...(down
        ? [
            {
              tone: "red" as const,
              text: `${down.id} ${down.name} is still down. No lock.`,
            },
          ]
        : []),
    ];
  }

  if (deck === "observe") {
    return [
      ...common,
      {
        tone: alertCount ? "red" : "cyan",
        text: `${alertCount} observation stations remain in alert.`,
      },
    ];
  }

  if (deck === "alerts") {
    const open = alertQueue.filter((item) => item.disposition === "open").length;
    return [
      ...common,
      {
        tone: open ? "amber" : "cyan",
        text: `${open} items remain open on the queue.`,
      },
    ];
  }

  return [
    ...common,
    {
      tone: "cyan",
      text: "No tsunami signature on the Japan trench swarm. Stare hold remains.",
    },
    {
      tone: "amber",
      text: "Sahel dust corridor remains loaded. Air-quality layer is armed.",
    },
  ];
}
