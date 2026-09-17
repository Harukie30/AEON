"use client";

import { createContext, useContext, type ReactNode } from "react";

const DeckRevealContext = createContext(false);

export function DeckRevealProvider({
  children,
  ready,
}: {
  children: ReactNode;
  ready: boolean;
}) {
  return (
    <DeckRevealContext.Provider value={ready}>{children}</DeckRevealContext.Provider>
  );
}

export function useDeckReveal() {
  return useContext(DeckRevealContext);
}
