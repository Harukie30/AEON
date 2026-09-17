"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { consumeSessionEnded, SESSION_ENDED_KEY, writeSession } from "@/lib/session";

const DEMO_OPERATOR = "AEON-OPS-01";
const DEMO_KEY = "ORBIT-7749";

type AuthView = "form" | "uplink" | "unauthorized" | "granted";
type FormAlert = "none" | "input";

type HudTone = "cyan" | "amber" | "red";

function uplinkStep(progress: number) {
  if (progress < 22) return "OPENING SECURE CHANNEL";
  if (progress < 48) return "VERIFYING OPERATOR CLEARANCE";
  if (progress < 74) return "HANDSHAKE WITH NODE-01";
  if (progress < 96) return "AUTHORIZING COMMAND UPLINK";
  return "UPLINK LOCKED";
}

function subscribeEndedFlag(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function readEndedFlag() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_ENDED_KEY) === "1";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AccessTerminal() {
  const router = useRouter();
  const runId = useRef(0);
  const busy = useRef(false);
  const [operatorId, setOperatorId] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [view, setView] = useState<AuthView>("form");
  const [alert, setAlert] = useState<FormAlert>("none");
  const [progress, setProgress] = useState(0);
  const [operator, setOperator] = useState("");
  const [animToken, setAnimToken] = useState(0);
  const [dismissedEnd, setDismissedEnd] = useState(false);
  const sessionEnded = useSyncExternalStore(
    subscribeEndedFlag,
    readEndedFlag,
    () => false,
  );
  const showEnded = sessionEnded && !dismissedEnd && view === "form";

  useEffect(() => {
    return () => {
      runId.current += 1;
    };
  }, []);

  useEffect(() => {
    if (view !== "granted") return;

    const delay = prefersReducedMotion() ? 400 : 1200;
    const timer = window.setTimeout(() => {
      router.push("/command");
    }, delay);

    return () => window.clearTimeout(timer);
  }, [view, router]);

  const statusLabel = useMemo(() => {
    if (view === "unauthorized") return "ACCESS REJECTED";
    if (view === "granted") return "UPLINK ESTABLISHED";
    if (view === "uplink") return "HANDSHAKE IN PROGRESS";
    if (alert === "input") return "INPUT FAULT";
    if (showEnded) return "SESSION CLOSED";
    return "AWAITING CREDENTIALS";
  }, [alert, showEnded, view]);

  const tone: HudTone =
    view === "unauthorized"
      ? "red"
      : alert === "input" || showEnded
        ? "amber"
        : "cyan";

  function dismissEndedNotice() {
    consumeSessionEnded();
    setDismissedEnd(true);
  }

  function fillDemo() {
    setOperatorId(DEMO_OPERATOR);
    setAccessKey(DEMO_KEY);
    setAlert("none");
    dismissEndedNotice();
  }

  function retry() {
    busy.current = false;
    setView("form");
    setProgress(0);
    setAlert("none");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;

    const id = operatorId.trim();
    const key = accessKey.trim();

    if (id.length < 3 || key.length < 4) {
      setAlert("input");
      setAnimToken((token) => token + 1);
      return;
    }

    busy.current = true;
    const thisRun = ++runId.current;
    const aborted = () => runId.current !== thisRun;

    setAlert("none");
    setProgress(0);
    setView("uplink");

    const duration = prefersReducedMotion() ? 180 : 2200;
    await animateProgress(0, 88, duration, setProgress, aborted);
    if (aborted()) return;

    const authorized =
      id.toUpperCase() === DEMO_OPERATOR && key === DEMO_KEY;

    if (!authorized) {
      busy.current = false;
      setAnimToken((token) => token + 1);
      setView("unauthorized");
      return;
    }

    await animateProgress(88, 100, prefersReducedMotion() ? 80 : 500, setProgress, aborted);
    if (aborted()) return;

    writeSession(id);
    setOperator(id.toUpperCase());
    setView("granted");
  }

  const panelMotion =
    view === "unauthorized"
      ? "aeon-lock-flash"
      : view === "granted"
        ? "aeon-grant-glow"
        : "";

  const shellMotion =
    view === "unauthorized" || alert === "input" || showEnded
      ? "aeon-shake"
      : "";

  return (
    <section
      className={`relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end ${shellMotion}`}
      key={`${view}-${animToken}`}
    >
      <HudCorners tone={tone} />
      <div
        className={`min-h-[28rem] border bg-[#071015]/80 p-6 shadow-[0_0_80px_rgba(79,244,226,0.08)] backdrop-blur-md transition-colors sm:p-8 ${
          tone === "red"
            ? "border-aeon-red/50"
            : tone === "amber"
              ? "border-aeon-amber/40"
              : view === "granted"
                ? "border-aeon-cyan/60 shadow-[0_0_90px_rgba(79,244,226,0.18)]"
                : "border-aeon-cyan/25"
        } ${panelMotion}`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
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
              NODE-01 // UPLINK
            </p>
            <h2 className="mt-2 font-display text-xl tracking-[0.18em] text-white">
              {view === "unauthorized"
                ? "LOCKOUT"
                : view === "granted"
                  ? "CLEARANCE"
                  : view === "uplink"
                    ? "UPLINK"
                    : "AUTHENTICATE"}
            </h2>
          </div>
          <p
            className={`font-mono text-[10px] tracking-[0.16em] ${
              tone === "red"
                ? "text-aeon-red"
                : tone === "amber"
                  ? "text-aeon-amber"
                  : view === "granted"
                    ? "text-aeon-cyan"
                    : "text-aeon-amber"
            }`}
          >
            {statusLabel}
          </p>
        </div>

        {view === "uplink" ? (
          <UplinkLoader progress={progress} />
        ) : view === "unauthorized" ? (
          <UnauthorizedCard onRetry={retry} />
        ) : view === "granted" ? (
          <GrantedCard
            onEnter={() => router.push("/command")}
            operatorId={operator}
          />
        ) : (
          <form className="space-y-5" onSubmit={onSubmit}>
            {alert === "input" ? (
              <AlertCard
                body="Operator ID and access key are required to open a command channel."
                code="ERR-INPUT-04"
                title="INCOMPLETE CREDENTIALS"
                tone="amber"
              />
            ) : showEnded ? (
              <AlertCard
                body="Operator uplink was closed from the command deck. Re-authenticate to restore observation access."
                code="204-AEON"
                title="SESSION TERMINATED"
                tone="amber"
              />
            ) : null}

            <label className="block">
              <span className="mb-2 block font-mono text-[10px] tracking-[0.24em] text-foreground/50">
                OPERATOR ID
              </span>
              <input
                autoComplete="username"
                className="w-full border border-aeon-cyan/20 bg-black/40 px-3 py-3 font-mono text-sm tracking-[0.12em] text-white outline-none transition focus:border-aeon-cyan/70 focus:shadow-[0_0_0_1px_rgba(79,244,226,0.25)]"
                onChange={(event) => {
                  setOperatorId(event.target.value);
                  setAlert("none");
                  dismissEndedNotice();
                }}
                placeholder="AEON-OPS-01"
                value={operatorId}
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[10px] tracking-[0.24em] text-foreground/50">
                ACCESS KEY
              </span>
              <input
                autoComplete="current-password"
                className="w-full border border-aeon-cyan/20 bg-black/40 px-3 py-3 font-mono text-sm tracking-[0.12em] text-white outline-none transition focus:border-aeon-cyan/70 focus:shadow-[0_0_0_1px_rgba(79,244,226,0.25)]"
                onChange={(event) => {
                  setAccessKey(event.target.value);
                  setAlert("none");
                  dismissEndedNotice();
                }}
                placeholder="••••••••"
                type="password"
                value={accessKey}
              />
            </label>

            <p className="font-mono text-[11px] leading-5 tracking-[0.08em] text-foreground/40">
              Demo clearance: {DEMO_OPERATOR} / {DEMO_KEY}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="flex-1 border border-aeon-cyan/70 bg-aeon-cyan/10 px-4 py-3 font-display text-sm tracking-[0.22em] text-aeon-cyan transition hover:bg-aeon-cyan/20"
                type="submit"
              >
                INITIATE UPLINK
              </button>
              <button
                className="border border-white/10 px-4 py-3 font-mono text-[11px] tracking-[0.16em] text-foreground/60 transition hover:border-aeon-cyan/30 hover:text-aeon-cyan"
                onClick={fillDemo}
                type="button"
              >
                LOAD DEMO
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function UplinkLoader({ progress }: { progress: number }) {
  return (
    <div className="aeon-alert-in flex flex-col gap-6" role="status" aria-live="polite">
      <p className="font-mono text-[11px] tracking-[0.18em] text-aeon-cyan/80">
        {uplinkStep(progress)}
      </p>

      <div>
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-foreground/45">
          <span>CHANNEL INTEGRITY</span>
          <span className="text-aeon-cyan">{progress.toString().padStart(3, "0")}%</span>
        </div>
        <div className="relative h-2 overflow-hidden border border-aeon-cyan/25 bg-black/50">
          <div
            className="aeon-progress-fill h-full bg-aeon-cyan shadow-[0_0_12px_rgba(79,244,226,0.65)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2 font-mono text-[10px] tracking-[0.16em] text-foreground/40">
        <li className={progress >= 18 ? "text-aeon-cyan/70" : ""}>
          {progress >= 18 ? "OK" : "--"}  TLS 1.3 / AEON-GRID
        </li>
        <li className={progress >= 46 ? "text-aeon-cyan/70" : ""}>
          {progress >= 46 ? "OK" : "--"}  ROSTER LOOKUP
        </li>
        <li className={progress >= 72 ? "text-aeon-cyan/70" : ""}>
          {progress >= 72 ? "OK" : "--"}  NODE-01 HANDSHAKE
        </li>
        <li
          className={progress >= 96 ? "text-aeon-cyan" : progress >= 88 ? "text-aeon-amber" : ""}
        >
          {progress >= 96 ? "OK" : progress >= 88 ? ".." : "--"}  COMMAND CLEARANCE
        </li>
      </ul>
    </div>
  );
}

function GrantedCard({
  onEnter,
  operatorId,
}: {
  onEnter: () => void;
  operatorId: string;
}) {
  return (
    <div className="aeon-success-in flex flex-col gap-5" role="status" aria-live="polite">
      <AlertCard
        body={`${operatorId} is cleared for command operations. Routing you to the observation deck.`}
        code="200-AEON"
        title="ACCESS GRANTED"
        tone="cyan"
      />
      <dl className="grid grid-cols-2 gap-3 font-mono text-[10px] tracking-[0.16em] text-aeon-cyan/70">
        <div className="border border-aeon-cyan/20 bg-black/25 px-3 py-3">
          <dt className="text-foreground/40">OPERATOR</dt>
          <dd className="mt-1 text-xs text-white">{operatorId}</dd>
        </div>
        <div className="border border-aeon-cyan/20 bg-black/25 px-3 py-3">
          <dt className="text-foreground/40">CLEARANCE</dt>
          <dd className="mt-1 text-xs text-white">LEVEL 3</dd>
        </div>
      </dl>
      <p className="font-mono text-[10px] tracking-[0.16em] text-foreground/40">
        TRANSFER IN PROGRESS // COMMAND DECK
      </p>
      <button
        className="border border-aeon-cyan/70 bg-aeon-cyan/10 px-4 py-3 font-display text-sm tracking-[0.22em] text-aeon-cyan transition hover:bg-aeon-cyan/20"
        onClick={onEnter}
        type="button"
      >
        ENTER COMMAND DECK
      </button>
    </div>
  );
}

function UnauthorizedCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="aeon-alert-in flex flex-col gap-5" role="alert">
      <AlertCard
        body="Operator identity failed roster verification. This attempt has been logged against NODE-01."
        code="401-AEON"
        title="UNAUTHORIZED ACCESS"
        tone="red"
      />
      <p className="font-mono text-[10px] tracking-[0.16em] text-foreground/40">
        HINT: LOAD DEMO CLEARANCE OR USE AEON-OPS-01
      </p>
      <button
        className="border border-aeon-red/50 bg-aeon-red/10 px-4 py-3 font-display text-sm tracking-[0.22em] text-aeon-red transition hover:bg-aeon-red/20"
        onClick={onRetry}
        type="button"
      >
        RETRY AUTHENTICATION
      </button>
    </div>
  );
}

function AlertCard({
  body,
  code,
  title,
  tone,
}: {
  body: string;
  code: string;
  title: string;
  tone: "amber" | "red" | "cyan";
}) {
  const palette =
    tone === "red"
      ? {
          box: "border-aeon-red/45 bg-aeon-red/10",
          text: "text-aeon-red",
          dot: "bg-aeon-red",
        }
      : tone === "cyan"
        ? {
            box: "border-aeon-cyan/45 bg-aeon-cyan/10",
            text: "text-aeon-cyan",
            dot: "bg-aeon-cyan",
          }
        : {
            box: "border-aeon-amber/45 bg-aeon-amber/10",
            text: "text-aeon-amber",
            dot: "bg-aeon-amber",
          };

  return (
    <div className={`aeon-alert-in border p-4 ${palette.box}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`font-mono text-[10px] tracking-[0.22em] ${palette.text}`}>
          ALERT // {code}
        </p>
        <span className={`aeon-pulse size-1.5 rounded-full ${palette.dot}`} />
      </div>
      <p className={`mt-2 font-display text-sm tracking-[0.14em] ${palette.text}`}>
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground/75">{body}</p>
    </div>
  );
}

function HudCorners({ tone }: { tone: HudTone }) {
  const border =
    tone === "red"
      ? "border-aeon-red"
      : tone === "amber"
        ? "border-aeon-amber"
        : "border-aeon-cyan";

  return (
    <>
      <span className={`pointer-events-none absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 ${border}`} />
      <span className={`pointer-events-none absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 ${border}`} />
      <span className={`pointer-events-none absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 ${border}`} />
      <span className={`pointer-events-none absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 ${border}`} />
    </>
  );
}

function animateProgress(
  from: number,
  to: number,
  duration: number,
  onFrame: (value: number) => void,
  aborted: () => boolean,
) {
  return new Promise<void>((resolve) => {
    const start = performance.now();

    const tick = (now: number) => {
      if (aborted()) {
        resolve();
        return;
      }

      const t = Math.min(1, (now - start) / Math.max(duration, 1));
      onFrame(Math.round(from + (to - from) * t));
      if (t < 1) {
        window.requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };

    window.requestAnimationFrame(tick);
  });
}
