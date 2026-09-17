"use client";

import { Suspense } from "react";
import { AlertsBoard } from "@/components/command/alerts-board";

export default function AlertsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 items-center justify-center font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70">
          OPENING QUEUE
        </div>
      }
    >
      <AlertsBoard />
    </Suspense>
  );
}
