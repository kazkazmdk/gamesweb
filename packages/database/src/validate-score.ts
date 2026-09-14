import { medalForTime } from "./constants";
import type { VerifiedStatus } from "./types";

export type ScorePayload = {
  sessionId: string;
  gameId: string;
  gameVersion: string;
  mode: string;
  score: number;
  durationMs: number;
  startedAt: number;
  endedAt: number;
  metadata: Record<string, number | string | boolean>;
  offline?: boolean;
};

export type ScoreValidation = {
  status: VerifiedStatus;
  reasons: string[];
};

export function validateScore(payload: ScorePayload): ScoreValidation {
  const reasons: string[] = [];
  const durationSec = payload.durationMs / 1000;
  const clockSkew = Math.abs(payload.endedAt - payload.startedAt - payload.durationMs);

  if (payload.offline) reasons.push("offline_unverified");
  if (payload.durationMs < 800) reasons.push("duration_too_short");
  if (payload.durationMs > 20 * 60 * 1000) reasons.push("duration_too_long");
  if (clockSkew > 8000) reasons.push("timestamp_mismatch");
  if (!Number.isFinite(payload.score)) reasons.push("score_nan");
  if (!payload.sessionId) reasons.push("missing_session");
  if (!payload.gameVersion) reasons.push("missing_version");

  if (payload.gameId === "neon-drift") {
    validateNeonDrift(payload, durationSec, reasons);
  } else if (payload.gameId === "velocity-run") {
    validateVelocity(payload, reasons);
  } else if (payload.gameId === "swarm-protocol") {
    validateSwarm(payload, durationSec, reasons);
  } else {
    reasons.push("unknown_game");
  }

  const hard = [
    "score_nan",
    "score_out_of_range",
    "unknown_game",
    "kill_pace_impossible",
    "score_exceeds_pace",
    "impossible_time",
    "medal_mismatch",
  ];
  if (reasons.some((r) => hard.includes(r))) {
    return { status: "flagged", reasons };
  }
  if (payload.offline) return { status: "unverified", reasons };
  if (reasons.length >= 2) return { status: "flagged", reasons };
  if (reasons.length === 1) return { status: "unverified", reasons };
  return { status: "verified", reasons };
}

function num(metadata: Record<string, number | string | boolean>, key: string): number {
  const v = metadata[key];
  return typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0;
}

function validateNeonDrift(payload: ScorePayload, durationSec: number, reasons: string[]) {
  if (payload.mode !== "circuit" && payload.mode !== "daily") reasons.push("invalid_mode");
  if (payload.score < 0 || payload.score > 5_000_000) reasons.push("score_out_of_range");
  const maxPlausible = Math.max(8000, durationSec * 4200);
  if (payload.score > maxPlausible) reasons.push("score_exceeds_pace");
  if (payload.score > 80_000 && durationSec < 18) reasons.push("high_score_fast_run");
  const laps = num(payload.metadata, "laps");
  const combo = num(payload.metadata, "combo");
  const wallHits = num(payload.metadata, "wallHits");
  if (laps < 0 || laps > 12) reasons.push("laps_implausible");
  if (combo < 0 || combo > 40) reasons.push("combo_implausible");
  if (wallHits < 0 || wallHits > 80) reasons.push("wall_hits_implausible");
  if (laps >= 2 && durationSec < 20) reasons.push("laps_too_fast");
  if (payload.score > 200_000 && combo < 4) reasons.push("score_combo_mismatch");
}

function validateVelocity(payload: ScorePayload, reasons: string[]) {
  if (!["course-1", "course-2", "course-3"].includes(payload.mode)) reasons.push("invalid_mode");
  if (payload.score < 6_000 || payload.score > 180_000) reasons.push("time_out_of_range");
  if (payload.durationMs + 800 < payload.score) reasons.push("timer_desync");
  if (payload.durationMs > payload.score + 15_000) reasons.push("timer_desync");
  const deaths = num(payload.metadata, "deaths");
  if (deaths < 0 || deaths > 400) reasons.push("deaths_implausible");
  const claimed = String(payload.metadata.medal ?? "none");
  const actual = medalForTime(payload.mode, payload.score);
  if (claimed === "platinum" && actual !== "platinum") reasons.push("medal_mismatch");
  if (payload.score < 8_000 && deaths > 0) reasons.push("impossible_time");
}

function validateSwarm(payload: ScorePayload, durationSec: number, reasons: string[]) {
  if (payload.mode !== "survival") reasons.push("invalid_mode");
  if (payload.score < 0 || payload.score > 1_000_000) reasons.push("score_out_of_range");
  const kills = num(payload.metadata, "kills");
  const level = num(payload.metadata, "level");
  const damage = num(payload.metadata, "damage");
  const surviveMs = num(payload.metadata, "surviveMs") || payload.durationMs;
  if (kills > durationSec * 8 + 20) reasons.push("kill_pace_impossible");
  if (payload.score > 200_000 && durationSec < 40) reasons.push("high_score_fast_run");
  if (level < 1 || level > 40) reasons.push("level_implausible");
  if (damage < 0 || damage > 5_000_000) reasons.push("damage_implausible");
  if (surviveMs > payload.durationMs + 5000) reasons.push("survive_desync");
  if (level > 6 && durationSec < 40) reasons.push("wave_too_fast");
}
