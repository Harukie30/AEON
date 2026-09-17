import { clearDismissedThreats } from "@/lib/threat-bulletin";

export const SESSION_KEY = "aeon.session";
export const SESSION_EVENT = "aeon-session";
export const SESSION_ENDED_KEY = "aeon.session.ended";

export type AeonSession = {
  operatorId: string;
  authenticatedAt: string;
};

export const SESSION_BOOT = "boot" as const;
export type SessionState = AeonSession | typeof SESSION_BOOT | null;

export function getSessionBootSnapshot(): SessionState {
  return SESSION_BOOT;
}

let snapshotRaw: string | null = null;
let snapshot: AeonSession | null = null;

function parseSession(raw: string | null): AeonSession | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AeonSession;
    if (!parsed.operatorId || !parsed.authenticatedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function remember(raw: string | null, session: AeonSession | null) {
  snapshotRaw = raw;
  snapshot = session;
}

export function readSession(): AeonSession | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(SESSION_KEY);
  if (raw === snapshotRaw) return snapshot;

  const next = parseSession(raw);
  remember(raw, next);
  return next;
}

export function writeSession(operatorId: string): AeonSession {
  const session: AeonSession = {
    operatorId: operatorId.trim().toUpperCase(),
    authenticatedAt: new Date().toISOString(),
  };
  const raw = JSON.stringify(session);
  sessionStorage.setItem(SESSION_KEY, raw);
  remember(raw, session);
  window.dispatchEvent(new Event(SESSION_EVENT));
  return session;
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  remember(null, null);
  clearDismissedThreats();
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function markSessionEnded() {
  sessionStorage.setItem(SESSION_ENDED_KEY, "1");
}

export function consumeSessionEnded() {
  const ended = sessionStorage.getItem(SESSION_ENDED_KEY) === "1";
  sessionStorage.removeItem(SESSION_ENDED_KEY);
  return ended;
}

export function subscribeSession(onStoreChange: () => void) {
  window.addEventListener(SESSION_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}
