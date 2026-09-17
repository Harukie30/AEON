import { alertQueue, type AlertItem } from "@/lib/mock/alerts";

export const THREAT_DISMISS_KEY = "aeon.threat.dismissed";
export const THREAT_DISMISS_EVENT = "aeon-threat-dismissed";

const EMPTY: string[] = [];

let snapshotRaw: string | null = null;
let snapshot: string[] = EMPTY;

function parseIds(raw: string | null): string[] {
  if (!raw) return EMPTY;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
    const ids = parsed.filter((item): item is string => typeof item === "string");
    return ids.length ? ids : EMPTY;
  } catch {
    return EMPTY;
  }
}

function remember(raw: string | null, ids: string[]) {
  snapshotRaw = raw;
  snapshot = ids;
}

export function readDismissedThreats(): string[] {
  if (typeof window === "undefined") return EMPTY;

  const raw = sessionStorage.getItem(THREAT_DISMISS_KEY);
  if (raw === snapshotRaw) return snapshot;

  const next = parseIds(raw);
  remember(raw, next);
  return next;
}

export function getDismissedThreatSnapshot(): string[] {
  return EMPTY;
}

export function dismissThreat(id: string) {
  const next = Array.from(new Set([...readDismissedThreats(), id]));
  const raw = JSON.stringify(next);
  sessionStorage.setItem(THREAT_DISMISS_KEY, raw);
  remember(raw, next);
  window.dispatchEvent(new Event(THREAT_DISMISS_EVENT));
}

export function dismissThreats(ids: string[]) {
  const next = Array.from(new Set([...readDismissedThreats(), ...ids]));
  const raw = JSON.stringify(next);
  sessionStorage.setItem(THREAT_DISMISS_KEY, raw);
  remember(raw, next);
  window.dispatchEvent(new Event(THREAT_DISMISS_EVENT));
}

export function clearDismissedThreats() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(THREAT_DISMISS_KEY);
  remember(null, EMPTY);
  window.dispatchEvent(new Event(THREAT_DISMISS_EVENT));
}

export function subscribeDismissedThreats(onStoreChange: () => void) {
  window.addEventListener(THREAT_DISMISS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(THREAT_DISMISS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function activeThreatBulletins(dismissed: string[]): AlertItem[] {
  const skip = new Set(dismissed);

  return alertQueue
    .filter(
      (item) =>
        (item.severity === "critical" || item.severity === "high") &&
        item.disposition === "open" &&
        !skip.has(item.id),
    )
    .sort((left, right) => {
      if (left.severity === right.severity) return 0;
      return left.severity === "critical" ? -1 : 1;
    });
}
