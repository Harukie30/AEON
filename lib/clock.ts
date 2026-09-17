"use client";

import { useSyncExternalStore } from "react";

const CLOCK_PLACEHOLDER = "0000-00-00 00:00:00 UTC";

function formatUtc(date: Date) {
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function subscribeUtcClock(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(id);
}

function getUtcSeconds() {
  return Math.floor(Date.now() / 1000);
}

export function useUtcLabel() {
  const seconds = useSyncExternalStore(subscribeUtcClock, getUtcSeconds, () => 0);
  return seconds === 0 ? CLOCK_PLACEHOLDER : formatUtc(new Date(seconds * 1000));
}
