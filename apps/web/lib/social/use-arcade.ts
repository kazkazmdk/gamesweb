"use client";

import { useSyncExternalStore } from "react";
import { arcadeStore, SSR_ARCADE, type ArcadeSnap } from "./arcade-store";

const subscribe = (fn: () => void) => arcadeStore.subscribe(fn);
const getSnapshot = () => arcadeStore.view();
const getServerSnapshot = () => SSR_ARCADE;

/**
 * Hydration-safe view of the local social store. The server (and the first
 * client paint) see the empty snapshot; the localStorage-backed state lands
 * on the next render, so SSR markup and client markup always agree.
 */
export function useArcade(): ArcadeSnap {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
