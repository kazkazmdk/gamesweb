"use client";

import { bootAnalytics } from "@gamesweb/analytics";
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { store, SSR_PLAYER, type PlayerSnapshot, type Toast } from "./player-store";

const Ctx = createContext(store);

export function PlayerProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    bootAnalytics();
    store.hydrate();
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) store.consumeRef(ref);
    const onOnline = () => void store.flush();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  return useContext(Ctx);
}

export function usePlayer(): PlayerSnapshot {
  return useSyncExternalStore(
    store.subscribe.bind(store),
    () => store.snapshot,
    () => SSR_PLAYER,
  );
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    store.subscribe.bind(store),
    () => store.toasts,
    () => EMPTY_TOASTS,
  );
}

const EMPTY_TOASTS: Toast[] = [];
