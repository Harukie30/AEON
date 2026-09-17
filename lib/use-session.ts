"use client";

import { useSyncExternalStore } from "react";
import {
  getSessionBootSnapshot,
  readSession,
  subscribeSession,
  type SessionState,
} from "@/lib/session";

export function useAeonSession() {
  return useSyncExternalStore<SessionState>(
    subscribeSession,
    readSession,
    getSessionBootSnapshot,
  );
}
