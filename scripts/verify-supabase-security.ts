#!/usr/bin/env node
/**
 * Live Supabase grant/RLS checks for Gamesweb.
 *
 * Exit 0 when credentials are missing so CI stays green.
 * When URL + publishable + secret keys are set (env or apps/web/.env.local):
 *   - anon/authenticated must not mutate authoritative tables
 *   - public views remain readable
 *   - guest_progress is not readable with the publishable key
 *   - service role can read/write
 *
 * Usage: pnpm test:supabase
 */
import { existsSync, readFileSync } from "node:fs";

function loadDotEnv() {
  const path = "apps/web/.env.local";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

type Check = { name: string; ok: boolean; detail: string };

async function rest(key: string, method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text };
}

function denied(status: number, text: string) {
  return status === 401 || status === 403 || status === 425 || /permission denied|42501|not allowed|PGRST/i.test(text);
}

async function main() {
  if (!url || !anon || !secret) {
    console.log("SKIP: Supabase live security checks: NOT EXECUTED — no provisioned Gamesweb Supabase credentials");
    process.exit(0);
  }

  const checks: Check[] = [];

  const catalogs = await rest(anon, "GET", "games?select=id&limit=1");
  checks.push({
    name: "anon can read games catalog",
    ok: catalogs.status >= 200 && catalogs.status < 300,
    detail: `status ${catalogs.status}`,
  });

  const publicProfiles = await rest(anon, "GET", "public_profiles?select=username&limit=1");
  checks.push({
    name: "anon can read public_profiles",
    ok: publicProfiles.status >= 200 && publicProfiles.status < 300,
    detail: `status ${publicProfiles.status}`,
  });

  const publicScores = await rest(anon, "GET", "public_scores?select=score&limit=1");
  checks.push({
    name: "anon can read public_scores",
    ok: publicScores.status >= 200 && publicScores.status < 300,
    detail: `status ${publicScores.status}`,
  });

  const xpUpdate = await rest(anon, "PATCH", "profiles?xp=eq.0", { xp: 999999, level: 99 });
  checks.push({
    name: "anon cannot update profile XP",
    ok: denied(xpUpdate.status, xpUpdate.text),
    detail: `status ${xpUpdate.status} ${xpUpdate.text.slice(0, 120)}`,
  });

  const fakeScore = await rest(anon, "POST", "scores", {
    game_id: "neon-drift",
    mode: "circuit",
    score: 999999,
    verified_status: "verified",
  });
  checks.push({
    name: "anon cannot insert scores",
    ok: denied(fakeScore.status, fakeScore.text),
    detail: `status ${fakeScore.status} ${fakeScore.text.slice(0, 120)}`,
  });

  const fakeAch = await rest(anon, "POST", "player_achievements", {
    user_id: "00000000-0000-4000-8000-000000000000",
    achievement_id: "platform:first-run",
  });
  checks.push({
    name: "anon cannot insert achievements",
    ok: denied(fakeAch.status, fakeAch.text),
    detail: `status ${fakeAch.status} ${fakeAch.text.slice(0, 120)}`,
  });

  const fakeQuest = await rest(anon, "POST", "quest_progress", {
    quest_id: "x",
    user_id: "00000000-0000-4000-8000-000000000000",
    progress: 99,
  });
  checks.push({
    name: "anon cannot write quest progress",
    ok: denied(fakeQuest.status, fakeQuest.text),
    detail: `status ${fakeQuest.status} ${fakeQuest.text.slice(0, 120)}`,
  });

  const fakeSession = await rest(anon, "POST", "game_sessions", {
    game_id: "neon-drift",
    anonymous_id: "attack-session",
  });
  checks.push({
    name: "anon cannot create sessions",
    ok: denied(fakeSession.status, fakeSession.text),
    detail: `status ${fakeSession.status} ${fakeSession.text.slice(0, 120)}`,
  });

  const guestRead = await rest(anon, "GET", "guest_progress?select=xp&limit=1");
  checks.push({
    name: "anon cannot read guest_progress",
    ok: denied(guestRead.status, guestRead.text) || (guestRead.status >= 200 && guestRead.status < 300 && guestRead.text === ""),
    detail: `status ${guestRead.status} ${guestRead.text.slice(0, 120)}`,
  });

  const socialRpcs = [
    ["finalize_game_run", {
      p_session_id: "00000000-0000-4000-8000-000000000000",
      p_identity_user_id: null,
      p_identity_anonymous_id: "attacker",
      p_mode: "circuit",
      p_score: 1,
      p_duration_ms: 1000,
      p_result: "finish",
      p_verified: "verified",
      p_metadata: {},
      p_progression: { xpEarned: 2500 },
      p_flag_reasons: [],
      p_game_version: "1",
      p_build_sha: "x",
      p_offline: false,
      p_client_started_at: null,
      p_client_ended_at: null,
    }],
    ["submit_party_round_attempt", { p_code: "XXXXXX", p_actor: "x", p_run_id: "r", p_score: 1, p_trust: "unverified", p_game_id: "sky-stack", p_mode: "climb" }],
    ["join_party", { p_code: "XXXXXX", p_actor: "x", p_name: "X", p_user_id: null }],
    ["start_party", { p_code: "XXXXXX", p_actor: "x" }],
    ["advance_party", { p_code: "XXXXXX", p_actor: "x" }],
    ["submit_challenge_attempt", { p_code: "XXXXXX", p_actor: "x", p_name: "X", p_run_id: "r", p_score: 1, p_trust: "unverified", p_game_id: "sky-stack", p_mode: "climb" }],
    ["delete_player_account", { p_user_id: "00000000-0000-4000-8000-000000000000" }],
  ] as const;

  for (const [name, body] of socialRpcs) {
    const hit = await rest(anon, "POST", `rpc/${name}`, body);
    checks.push({
      name: `anon cannot execute ${name}`,
      ok: denied(hit.status, hit.text),
      detail: `status ${hit.status} ${hit.text.slice(0, 120)}`,
    });
  }

  const serviceGuest = await rest(secret, "GET", "guest_progress?select=anonymous_id&limit=1");
  checks.push({
    name: "service role can read guest_progress",
    ok: serviceGuest.status >= 200 && serviceGuest.status < 300,
    detail: `status ${serviceGuest.status}`,
  });

  const serviceProfiles = await rest(secret, "GET", "profiles?select=user_id&limit=1");
  checks.push({
    name: "service role can read profiles",
    ok: serviceProfiles.status >= 200 && serviceProfiles.status < 300,
    detail: `status ${serviceProfiles.status}`,
  });

  let failed = 0;
  for (const check of checks) {
    const mark = check.ok ? "PASS" : "FAIL";
    if (!check.ok) failed += 1;
    console.log(`${mark}  ${check.name} (${check.detail})`);
  }

  if (failed) {
    console.error(`\n${failed} live Supabase security check(s) failed. Apply 0001–0010 and retry.`);
    process.exit(1);
  }
  console.log("\nLive Supabase security checks passed.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
