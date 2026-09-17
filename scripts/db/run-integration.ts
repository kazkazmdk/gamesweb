#!/usr/bin/env node
/**
 * Apply 0001–0006 to a clean Postgres and run security / concurrency / dedupe tests.
 * Requires DATABASE_URL. Fails if the database is missing or a migration is invalid.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("FAIL: DATABASE_URL is required. CI must start Postgres locally; this job does not skip.");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ANON_A = "guest-aaa-0001";

type Check = { name: string; ok: boolean; detail: string };

function denied(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return /permission denied|42501|must be owner|not allowed/i.test(msg);
}

async function asRole<T>(client: pg.Client, role: "anon" | "authenticated" | "service_role" | "postgres", sub: string | null, fn: () => Promise<T>) {
  if (role !== "postgres") {
    await client.query(`set role ${role}`);
  }
  if (sub) await client.query("select set_config('request.jwt.claim.sub', $1, true)", [sub]);
  else await client.query("select set_config('request.jwt.claim.sub', '', true)");
  await client.query("select set_config('request.jwt.claim.role', $1, true)", [role]);
  try {
    return await fn();
  } finally {
    await client.query("reset role");
    await client.query("select set_config('request.jwt.claim.sub', '', true)");
  }
}

async function expectDenied(name: string, fn: () => Promise<unknown>): Promise<Check> {
  try {
    await fn();
    return { name, ok: false, detail: "mutation succeeded" };
  } catch (err) {
    return { name, ok: denied(err), detail: err instanceof Error ? err.message.slice(0, 160) : "error" };
  }
}

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const checks: Check[] = [];

  try {
    await client.query(readFileSync(join(root, "scripts/db/bootstrap.sql"), "utf8"));
    const files = readdirSync(join(root, "supabase/migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort();
    if (files.join() !== "0001_init.sql,0002_hardening.sql,0003_quality_hardening.sql,0004_authoritative_progression.sql,0005_privacy_rewards_dedupe.sql,0006_social_arcade.sql") {
      throw new Error(`unexpected migrations: ${files.join(", ")}`);
    }
    for (const file of files) {
      const sql = readFileSync(join(root, "supabase/migrations", file), "utf8");
      try {
        await client.query(sql);
        checks.push({ name: `apply ${file}`, ok: true, detail: "ok" });
      } catch (err) {
        checks.push({
          name: `apply ${file}`,
          ok: false,
          detail: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    }

    await client.query(
      `insert into public.profiles (user_id, username, display_name, avatar, is_guest, share_activity, share_presence, share_public_activity)
       values
         ($1, 'player_a', 'Player A', 'orb-0', false, true, true, true),
         ($2, 'player_b', 'Player B', 'orb-1', false, true, true, false)
       on conflict (user_id) do nothing`,
      [USER_A, USER_B],
    );

    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot update profile XP", () => client.query("update public.profiles set xp = 999999")),
      ),
    );
    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot insert scores", () =>
          client.query(
            "insert into public.scores (game_id, mode, score, verified_status) values ('neon-drift', 'circuit', 9, 'verified')",
          ),
        ),
      ),
    );
    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot insert achievements", () =>
          client.query("insert into public.player_achievements (user_id, achievement_id) values ($1, 'platform:first-run')", [USER_A]),
        ),
      ),
    );
    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot write quest progress", () =>
          client.query("insert into public.quest_progress (quest_id, user_id, progress) values ('daily-x', $1, 9)", [USER_A]),
        ),
      ),
    );
    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot create sessions", () =>
          client.query("insert into public.game_sessions (game_id, anonymous_id) values ('neon-drift', 'attack-session')"),
        ),
      ),
    );
    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot read guest_progress", () => client.query("select xp from public.guest_progress")),
      ),
    );
    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot execute finalize_game_run", () =>
          client.query("select public.finalize_game_run($1,null,$2,'circuit',1,1000,'finish','verified','{}'::jsonb,'{}'::jsonb,'{}', '1','x', false, null, null)", [
            "00000000-0000-4000-8000-000000000000",
            "attacker1",
          ]),
        ),
      ),
    );

    checks.push(
      await asRole(client, "authenticated", USER_A, async () =>
        expectDenied("A cannot update own XP", () => client.query("update public.profiles set xp = 999999 where user_id = $1", [USER_A])),
      ),
    );
    checks.push(
      await asRole(client, "authenticated", USER_A, async () =>
        expectDenied("A cannot update B XP", () => client.query("update public.profiles set xp = 1 where user_id = $1", [USER_B])),
      ),
    );
    checks.push(
      await asRole(client, "authenticated", USER_A, async () =>
        expectDenied("A cannot forge own achievements", () =>
          client.query("insert into public.player_achievements (user_id, achievement_id) values ($1, 'platform:first-run')", [USER_A]),
        ),
      ),
    );
    checks.push(
      await asRole(client, "authenticated", USER_A, async () =>
        expectDenied("A cannot insert verified score", () =>
          client.query(
            "insert into public.scores (user_id, game_id, mode, score, verified_status) values ($1, 'neon-drift', 'circuit', 999999, 'verified')",
            [USER_A],
          ),
        ),
      ),
    );
    checks.push(
      await asRole(client, "authenticated", USER_A, async () =>
        expectDenied("A cannot read guest_progress", () => client.query("select xp from public.guest_progress")),
      ),
    );
    checks.push(
      await asRole(client, "authenticated", USER_A, async () =>
        expectDenied("A cannot call finalize_game_run", () =>
          client.query("select public.finalize_game_run($1,$2,$3,'circuit',1,1000,'finish','verified','{}'::jsonb,'{}'::jsonb,'{}','1','x',false,null,null)", [
            "00000000-0000-4000-8000-000000000000",
            USER_A,
            ANON_A,
          ]),
        ),
      ),
    );
    checks.push(
      await asRole(client, "authenticated", USER_B, async () =>
        expectDenied("B cannot forge A achievements", () =>
          client.query("insert into public.player_achievements (user_id, achievement_id) values ($1, 'platform:weekender')", [USER_A]),
        ),
      ),
    );

    const games = await asRole(client, "anon", null, () => client.query("select id from public.games limit 1"));
    checks.push({ name: "anon can read games catalog", ok: games.rowCount === 1, detail: `rows ${games.rowCount}` });

    await asRole(client, "service_role", null, async () => {
      const guest = await client.query("select anonymous_id from public.guest_progress limit 1");
      checks.push({ name: "service role can read guest_progress", ok: true, detail: `status ${guest.rowCount}` });
      const profiles = await client.query("select user_id from public.profiles limit 2");
      checks.push({ name: "service role can read profiles", ok: (profiles.rowCount ?? 0) >= 2, detail: `rows ${profiles.rowCount}` });
    });

    const sessionA = crypto.randomUUID();
    await client.query(
      `insert into public.game_sessions (id, user_id, anonymous_id, game_id, game_version)
       values ($1, $2, $3, 'neon-drift', '1.0.0')`,
      [sessionA, USER_A, ANON_A],
    );
    const finalized = await asRole(client, "service_role", null, () =>
      client.query(
        `select public.finalize_game_run($1,$2,$3,'circuit',25000,40000,'finish','verified',
          '{"laps":2,"combo":5}'::jsonb,
          '{"runXp":30,"firstPlayClaim":true,"newGameClaim":true,"pbClaim":true,"achievementsToUnlock":["platform:first-run","neon-drift:score-25k"],"questsCompleted":[],"questXp":{},"statsDelta":{"gamesPlayed":1,"pbCount":1}}'::jsonb,
          '{}','1.0.0','test', false, now(), now()) as payload`,
        [sessionA, USER_A, ANON_A],
      ),
    );
    const payload = finalized.rows[0].payload as { xpEarned: number; achievementsApplied: string[]; alreadyApplied: boolean };
    checks.push({
      name: "service finalize_game_run writes XP and achievements",
      ok: payload.xpEarned > 0 && payload.achievementsApplied.includes("platform:first-run") && !payload.alreadyApplied,
      detail: JSON.stringify(payload),
    });
    const xpAfterFirst = await client.query("select xp from public.profiles where user_id = $1", [USER_A]);
    checks.push({
      name: "profile XP increased after finalize",
      ok: Number(xpAfterFirst.rows[0].xp) === payload.xpEarned,
      detail: `xp ${xpAfterFirst.rows[0].xp}`,
    });

    const sessionB1 = crypto.randomUUID();
    const sessionB2 = crypto.randomUUID();
    await client.query(
      `insert into public.game_sessions (id, user_id, anonymous_id, game_id, game_version)
       values ($1,$2,$3,'neon-drift','1.0.0'), ($4,$2,$3,'neon-drift','1.0.0')`,
      [sessionB1, USER_B, "guest-bbb-0001", sessionB2],
    );
    const prog = {
      runXp: 18,
      firstPlayClaim: true,
      newGameClaim: true,
      pbClaim: true,
      achievementsToUnlock: ["platform:first-run"],
      questsCompleted: [],
      questXp: {},
      statsDelta: { gamesPlayed: 1, pbCount: 1 },
    };
    const c1 = new pg.Client({ connectionString: url });
    const c2 = new pg.Client({ connectionString: url });
    await c1.connect();
    await c2.connect();
    try {
      const run = (c: pg.Client, sessionId: string) =>
        c.query("set role service_role").then(() =>
          c.query(
            `select public.finalize_game_run($1,$2,$3,'circuit',12000,40000,'finish','verified','{}'::jsonb,$4::jsonb,'{}','1','x',false,now(),now()) as payload`,
            [sessionId, USER_B, "guest-bbb-0001", JSON.stringify(prog)],
          ),
        );
      const [r1, r2] = await Promise.all([run(c1, sessionB1), run(c2, sessionB2)]);
      const xp1 = (r1.rows[0].payload as { xpEarned: number }).xpEarned;
      const xp2 = (r2.rows[0].payload as { xpEarned: number }).xpEarned;
      const bXp = await client.query("select xp from public.profiles where user_id = $1", [USER_B]);
      const firstPlayTwice = xp1 + xp2 >= 18 + 40 + 45 + 20 + 18 + 40 + 45 + 20;
      checks.push({
        name: "concurrent finalize does not double first-play / new-game / achievement XP",
        ok: !firstPlayTwice && Number(bXp.rows[0].xp) === xp1 + xp2,
        detail: `xpEarned ${xp1}+${xp2}=${bXp.rows[0].xp}`,
      });
      const achCount = await client.query(
        "select count(*)::int as n from public.player_achievements where user_id = $1 and achievement_id = 'platform:first-run'",
        [USER_B],
      );
      checks.push({
        name: "concurrent achievement insert stays unique",
        ok: achCount.rows[0].n === 1,
        detail: `rows ${achCount.rows[0].n}`,
      });
    } finally {
      await c1.end();
      await c2.end();
    }

    const guestId = "guest-merge-001";
    const localSession = "local-run-stable-1";
    await asRole(client, "service_role", null, async () => {
      await client.query("insert into public.guest_progress (anonymous_id, xp) values ($1, 10) on conflict do nothing", [guestId]);
      await client.query(
        `insert into public.scores (anonymous_id, game_id, mode, score, verified_status, offline_submission, local_session_id)
         values ($1, 'neon-drift', 'circuit', 1111, 'unverified', true, $2)`,
        [guestId, localSession],
      );
      const userC = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
      await client.query(
        `insert into public.profiles (user_id, username, display_name, avatar, is_guest)
         values ($1, 'player_c', 'Player C', 'orb-2', false)`,
        [userC],
      );
      await client.query(
        `select public.merge_guest_progress($1, $2, $3::jsonb) as payload`,
        [
          userC,
          guestId,
          JSON.stringify([
            {
              gameId: "neon-drift",
              mode: "circuit",
              score: 1111,
              metadata: {},
              startedAt: Date.now(),
              endedAt: Date.now(),
              localSessionId: localSession,
            },
          ]),
        ],
      );
      const scores = await client.query(
        "select count(*)::int as n from public.scores where user_id = $1 and local_session_id = $2",
        [userC, localSession],
      );
      checks.push({
        name: "merge dedupes guest score already persisted with localSessionId",
        ok: scores.rows[0].n === 1,
        detail: `rows ${scores.rows[0].n}`,
      });
    });

    const cols = await client.query(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles'
         and column_name in ('share_presence', 'share_public_activity')`,
    );
    checks.push({
      name: "privacy columns exist",
      ok: cols.rowCount === 2,
      detail: cols.rows.map((r: { column_name: string }) => r.column_name).join(","),
    });
  } finally {
    let failed = 0;
    for (const check of checks) {
      const mark = check.ok ? "PASS" : "FAIL";
      if (!check.ok) failed += 1;
      console.log(`${mark}  ${check.name} (${check.detail})`);
    }
    await client.end();
    if (failed) {
      console.error(`\n${failed} database integration check(s) failed.`);
      process.exit(1);
    }
    console.log(`\n${checks.length} database integration checks passed.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
