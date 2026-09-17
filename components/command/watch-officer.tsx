"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useDeckReveal } from "@/components/command/deck-reveal";
import {
  activeThreatBulletins,
  getDismissedThreatSnapshot,
  readDismissedThreats,
  subscribeDismissedThreats,
} from "@/lib/threat-bulletin";
import {
  briefFor,
  deckFromPath,
  heartbeatFor,
  WATCH_VOICE_KEY,
  type WatchLine,
  type WatchTone,
} from "@/lib/watch-officer";
import { createWatchVoice } from "@/lib/watch-voice";

type QueuedLine = WatchLine & { id: string };

const toneClass: Record<WatchTone, string> = {
  cyan: "text-aeon-cyan/90",
  amber: "text-aeon-amber",
  red: "text-aeon-red",
};

function readVoicePref() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(WATCH_VOICE_KEY) === "1";
}

function writeVoicePref(on: boolean) {
  window.sessionStorage.setItem(WATCH_VOICE_KEY, on ? "1" : "0");
}

export function WatchOfficer({ operatorId }: { operatorId: string }) {
  const revealed = useDeckReveal();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const briefing = Boolean(searchParams.get("brief"));
  const dismissed = useSyncExternalStore(
    subscribeDismissedThreats,
    readDismissedThreats,
    getDismissedThreatSnapshot,
  );
  const threatOpen = Boolean(activeThreatBulletins(dismissed)[0]) && !briefing;
  const deck = useMemo(() => deckFromPath(pathname), [pathname]);

  const [live, setLive] = useState(false);
  const [held, setHeld] = useState(false);
  const [voice, setVoice] = useState(false);
  const [typed, setTyped] = useState("");
  const [current, setCurrent] = useState<QueuedLine | null>(null);
  const [history, setHistory] = useState<QueuedLine[]>([]);
  const [speechDone, setSpeechDone] = useState(true);

  const seq = useRef(0);
  const pending = useRef<QueuedLine[]>([]);
  const booted = useRef(false);
  const pulse = useRef(0);
  const currentRef = useRef<QueuedLine | null>(null);
  const typedIndex = useRef(0);
  const spokenId = useRef<string | null>(null);
  const voiceCtl = useRef(createWatchVoice());
  const paused = held || threatOpen || !revealed;
  const [queueTick, setQueueTick] = useState(0);

  currentRef.current = current;

  function tag(line: WatchLine): QueuedLine {
    seq.current += 1;
    return { ...line, id: `wo-${seq.current}` };
  }

  function enqueue(lines: WatchLine[], replace = false) {
    const next = lines.map(tag);
    pending.current = replace ? next : [...pending.current, ...next];
    setQueueTick((tick) => tick + 1);
  }

  useEffect(() => {
    if (!revealed) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      setVoice(readVoicePref());
      setLive(true);
    }, reduced ? 0 : 1100);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  useEffect(() => {
    if (!live) return;
    const kind = booted.current ? "module" : "boot";
    booted.current = true;
    pending.current = [];
    enqueue(briefFor(deck, operatorId, kind), true);
    spokenId.current = null;
    typedIndex.current = 0;
    voiceCtl.current.cancel();
    setSpeechDone(true);
    setCurrent(null);
    setTyped("");
  }, [deck, live, operatorId]);

  useEffect(() => {
    if (!live || paused || current) return;

    const next = pending.current.shift();
    if (!next) return;

    typedIndex.current = 0;
    setCurrent(next);
    setTyped("");
  }, [current, live, paused, queueTick]);

  useEffect(() => {
    if (!voice || !live || !current) {
      voiceCtl.current.cancel();
      spokenId.current = null;
      setSpeechDone(true);
      return;
    }

    if (spokenId.current && spokenId.current !== current.id) {
      voiceCtl.current.cancel();
      spokenId.current = null;
    }

    if (paused) {
      voiceCtl.current.pause();
      return;
    }

    if (spokenId.current === current.id) {
      voiceCtl.current.resume();
      return;
    }

    const lineId = current.id;
    spokenId.current = lineId;
    setSpeechDone(false);
    voiceCtl.current.speak(current.text).then((completed) => {
      if (completed && spokenId.current === lineId) setSpeechDone(true);
    });
  }, [current, live, paused, voice]);

  useEffect(() => {
    if (!live || paused || !current) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      typedIndex.current = current.text.length;
      setTyped(current.text);
      return;
    }

    const timer = window.setInterval(() => {
      typedIndex.current = Math.min(current.text.length, typedIndex.current + 1);
      setTyped(current.text.slice(0, typedIndex.current));
      if (typedIndex.current >= current.text.length) window.clearInterval(timer);
    }, 16);

    return () => window.clearInterval(timer);
  }, [current, live, paused]);

  useEffect(() => {
    if (!live || paused || !current) return;
    if (typed !== current.text) return;
    if (voice && !speechDone) return;

    const dwell = window.setTimeout(
      () => {
        setHistory((rows) => [...rows, current].slice(-3));
        setCurrent(null);
        setTyped("");
        typedIndex.current = 0;
      },
      voice ? 350 : 1400,
    );

    return () => window.clearTimeout(dwell);
  }, [current, live, paused, speechDone, typed, voice]);

  useEffect(() => {
    if (!live || paused || current || pending.current.length) return;

    const timer = window.setInterval(() => {
      if (held || currentRef.current || pending.current.length) return;
      pulse.current += 1;
      enqueue([heartbeatFor(deck, pulse.current)]);
    }, 16000);

    return () => window.clearInterval(timer);
  }, [current, deck, held, live, paused]);

  useEffect(() => () => voiceCtl.current.cancel(), []);

  function toggleHold() {
    setHeld((value) => !value);
  }

  function toggleVoice() {
    const next = !voice;
    setVoice(next);
    writeVoicePref(next);
    if (!next) {
      voiceCtl.current.cancel();
      spokenId.current = null;
      setSpeechDone(true);
    }
  }

  const display = current?.text ? typed : "";
  const complete = Boolean(current && typed === current.text);

  return (
    <section
      aria-label="Watch officer auto brief"
      className="shrink-0 border-t border-aeon-cyan/15 bg-black/40 px-4 py-3 sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
          WATCH OFFICER // {live ? "AUTO BRIEF" : "STANDBY"}
        </p>
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-foreground/45">
          <span
            className={`inline-block size-1.5 rounded-full ${
              paused || !live
                ? "bg-aeon-amber/80"
                : "aeon-pulse bg-aeon-cyan shadow-[0_0_8px_#4ff4e2]"
            }`}
          />
          {!live || !revealed
            ? "CHANNEL OPENING"
            : threatOpen
              ? "PRIORITY HOLD"
              : held
                ? "HELD"
                : "LIVE"}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="border border-white/10 px-2 py-1 font-mono text-[10px] tracking-[0.16em] text-foreground/50 transition hover:border-aeon-cyan/40 hover:text-aeon-cyan disabled:opacity-40"
            disabled={!live}
            onClick={toggleHold}
            type="button"
          >
            {held ? "RESUME" : "HOLD"}
          </button>
          <button
            className={`border px-2 py-1 font-mono text-[10px] tracking-[0.16em] transition disabled:opacity-40 ${
              voice
                ? "border-aeon-cyan/40 bg-aeon-cyan/10 text-aeon-cyan"
                : "border-white/10 text-foreground/50 hover:border-aeon-cyan/40 hover:text-aeon-cyan"
            }`}
            disabled={!live}
            onClick={toggleVoice}
            type="button"
          >
            VOICE {voice ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className="mt-2 min-h-[4.25rem]" role="status" aria-live="polite">
        {!live ? (
          <div className="space-y-2 pt-1">
            <div className="aeon-shimmer h-3 w-4/5" />
            <div className="aeon-shimmer h-3 w-2/3" />
          </div>
        ) : (
          <>
            {history.slice(-1).map((line) => (
              <p
                className="truncate font-mono text-[10px] tracking-[0.08em] text-foreground/35"
                key={line.id}
              >
                {line.text}
              </p>
            ))}
            <p
              className={`mt-1 text-sm leading-6 ${
                current ? toneClass[current.tone] : "text-foreground/45"
              }`}
            >
              {display || (paused ? "Channel held." : "Listening to the grid.")}
              {current && !complete ? (
                <span className="aeon-caret ml-0.5 inline-block h-4 w-[7px] translate-y-[2px] bg-current align-middle" />
              ) : null}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
