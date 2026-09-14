import { resolveBackend } from "@/lib/env";
import { memoryStore } from "@/lib/backend/memory";
import { supabaseStore } from "@/lib/backend/supabase";
import type { BackendStore } from "@/lib/backend/types";

export function getBackend(): BackendStore | null {
  const kind = resolveBackend();
  if (kind === "none") return null;
  if (kind === "supabase") return supabaseStore();
  return memoryStore();
}

export function backendKind() {
  return resolveBackend();
}
