#!/usr/bin/env node
/**
 * Apply every SQL migration in supabase/migrations, in filename order, then run
 * security, concurrency, and social-arcade checks. A migration that fails SQL
 * fails the job. Extra migrations are expected.
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
    if (!files.length) throw new Error("no migrations found");
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

    async function partyFixture(code: string, playlist: unknown, roster: string[]) {
      const inserted = await client.query(
        `insert into public.parties (code, state, current_round, playlist, round_roster, submitted, standings, host_actor)
         values ($1, 'playing', 0, $2::jsonb, $3::jsonb, '[]'::jsonb, '[]'::jsonb, $4)
         returning id`,
        [code, JSON.stringify(playlist), JSON.stringify(roster), roster[0]],
      );
      const partyId = inserted.rows[0].id as string;
      for (const actor of roster) {
        await client.query(
          `insert into public.party_members (party_id, actor_id, display_name, ready, points)
           values ($1, $2, $2, true, 0)`,
          [partyId, actor],
        );
      }
      return partyId;
    }

    function pointsOf(standings: Array<{ id: string; points: number }>, id: string) {
      return standings.find((row) => row.id === id)?.points;
    }

    const higherId = await partyFixture("RANKHI", [{ gameId: "sky-stack", mode: "climb" }], ["actor-a", "actor-b"]);
    const firstOnly = await client.query(
      `select public.submit_party_round_attempt('RANKHI','actor-a',$1,100,'unverified','sky-stack','climb') as payload`,
      [crypto.randomUUID()],
    );
    const firstPayload = firstOnly.rows[0].payload as { state?: string; error?: string };
    const mid = await client.query("select state, standings, points from public.parties p join public.party_members m on m.party_id = p.id where p.code = 'RANKHI'");
    checks.push({
      name: "party round stores the first attempt without awarding points",
      ok: firstPayload.state === "playing" && mid.rows.every((row: { points: number; state: string }) => row.points === 0 && row.state === "playing"),
      detail: JSON.stringify({ firstPayload, points: mid.rows.map((row: { points: number }) => row.points) }),
    });
    const higherClose = await client.query(
      `select public.submit_party_round_attempt('RANKHI','actor-b',$1,200,'verified','sky-stack','climb') as payload`,
      [crypto.randomUUID()],
    );
    const higherParty = await client.query("select state, standings from public.parties where id = $1", [higherId]);
    const higherStandings = higherParty.rows[0].standings as Array<{ id: string; points: number }>;
    const higherMembers = await client.query(
      `select m.actor_id, m.points, a.score
       from public.party_members m
       join public.parties p on p.id = m.party_id
       join public.party_round_attempts a on a.party_id = p.id and a.actor_id = m.actor_id
       where p.code = 'RANKHI'`,
    );
    const memberPoints = Object.fromEntries(
      higherMembers.rows.map((row: { actor_id: string; points: number; score: string | number }) => [row.actor_id, { points: row.points, score: Number(row.score) }]),
    );
    checks.push({
      name: "higher-is-better party ranks B 10 and A 7 together",
      ok:
        higherClose.rows[0].payload.state === "results" &&
        higherParty.rows[0].state === "results" &&
        pointsOf(higherStandings, "actor-b") === 10 &&
        pointsOf(higherStandings, "actor-a") === 7,
      detail: JSON.stringify(higherStandings),
    });
    checks.push({
      name: "party member points are cumulative and the raw score stays on the attempt",
      ok: memberPoints["actor-b"]?.points === 10 && memberPoints["actor-b"]?.score === 200 && memberPoints["actor-a"]?.points === 7 && memberPoints["actor-a"]?.score === 100,
      detail: JSON.stringify(higherMembers.rows),
    });

    await partyFixture("RANKLO", [{ gameId: "velocity-run", mode: "course-1" }], ["actor-a", "actor-b"]);
    await client.query(
      `select public.submit_party_round_attempt('RANKLO','actor-a',$1,30,'unverified','velocity-run','course-1')`,
      [crypto.randomUUID()],
    );
    await client.query(
      `select public.submit_party_round_attempt('RANKLO','actor-b',$1,40,'unverified','velocity-run','course-1')`,
      [crypto.randomUUID()],
    );
    const lowerParty = await client.query("select standings from public.parties where code = 'RANKLO'");
    const lowerStandings = lowerParty.rows[0].standings as Array<{ id: string; points: number }>;
    checks.push({
      name: "lower-is-better party ranks A 10 and B 7",
      ok: pointsOf(lowerStandings, "actor-a") === 10 && pointsOf(lowerStandings, "actor-b") === 7,
      detail: JSON.stringify(lowerStandings),
    });

    await partyFixture("MODE01", [{ gameId: "velocity-run", mode: "course-1" }], ["actor-a", "actor-b"]);
    const modeMiss = await client.query(
      `select public.submit_party_round_attempt('MODE01','actor-a',$1,12,'unverified','velocity-run','course-2') as payload`,
      [crypto.randomUUID()],
    );
    checks.push({
      name: "party rejects a run on the wrong mode",
      ok: modeMiss.rows[0].payload.error === "mode_mismatch",
      detail: JSON.stringify(modeMiss.rows[0].payload),
    });

    const flagged = await client.query(
      `select public.submit_party_round_attempt('MODE01','actor-a',$1,1,'flagged','velocity-run','course-1') as payload`,
      [crypto.randomUUID()],
    );
    const flaggedCount = await client.query(
      `select count(*)::int as n from public.party_round_attempts a
       join public.parties p on p.id = a.party_id
       where p.code = 'MODE01'`,
    );
    checks.push({
      name: "rejected party runs leave no attempt",
      ok: flaggedCount.rows[0].n === 0,
      detail: `rows ${flaggedCount.rows[0].n}`,
    });
    checks.push({
      name: "party rejects a flagged run",
      ok: flagged.rows[0].payload.error === "invalid_score",
      detail: JSON.stringify(flagged.rows[0].payload),
    });

    await partyFixture(
      "CUMUL8",
      [
        { gameId: "sky-stack", mode: "climb" },
        { gameId: "velocity-run", mode: "course-1" },
      ],
      ["actor-a", "actor-b"],
    );
    await client.query(`select public.submit_party_round_attempt('CUMUL8','actor-a',$1,200,'unverified','sky-stack','climb')`, [crypto.randomUUID()]);
    await client.query(`select public.submit_party_round_attempt('CUMUL8','actor-b',$1,100,'unverified','sky-stack','climb')`, [crypto.randomUUID()]);
    const advancedRound = await client.query(`select public.advance_party('CUMUL8','actor-a') as payload`);
    checks.push({
      name: "advance leaves results for the next round",
      ok: advancedRound.rows[0].payload.state === "playing",
      detail: JSON.stringify(advancedRound.rows[0].payload),
    });
    await client.query(`select public.submit_party_round_attempt('CUMUL8','actor-a',$1,41,'unverified','velocity-run','course-1')`, [crypto.randomUUID()]);
    await client.query(`select public.submit_party_round_attempt('CUMUL8','actor-b',$1,32,'unverified','velocity-run','course-1')`, [crypto.randomUUID()]);
    const cumul = await client.query("select standings, state from public.parties where code = 'CUMUL8'");
    const cumulStandings = cumul.rows[0].standings as Array<{ id: string; points: number }>;
    checks.push({
      name: "two party rounds accumulate to 17 and 17",
      ok: cumul.rows[0].state === "results" && pointsOf(cumulStandings, "actor-a") === 17 && pointsOf(cumulStandings, "actor-b") === 17,
      detail: JSON.stringify(cumulStandings),
    });

    const raceCode = "RACE88";
    await partyFixture(raceCode, [{ gameId: "sky-stack", mode: "climb" }], ["actor-a", "actor-b"]);
    const raceA = crypto.randomUUID();
    const raceB = crypto.randomUUID();
    const left = new pg.Client({ connectionString: url });
    const right = new pg.Client({ connectionString: url });
    await left.connect();
    await right.connect();
    try {
      const [ra, rb] = await Promise.all([
        left.query(`select public.submit_party_round_attempt($1,'actor-a',$2,100,'unverified','sky-stack','climb') as payload`, [raceCode, raceA]),
        right.query(`select public.submit_party_round_attempt($1,'actor-b',$2,200,'verified','sky-stack','climb') as payload`, [raceCode, raceB]),
      ]);
      const race = await client.query(
        `select p.state, p.standings, p.submitted, count(a.id)::int as attempts
         from public.parties p
         left join public.party_round_attempts a on a.party_id = p.id
         where p.code = $1
         group by p.id`,
        [raceCode],
      );
      const raceStandings = race.rows[0].standings as Array<{ id: string; points: number }>;
      const submitted = race.rows[0].submitted as string[];
      checks.push({
        name: "concurrent party submits keep both attempts and the real ranking",
        ok:
          ra.rows[0].payload.error == null &&
          rb.rows[0].payload.error == null &&
          race.rows[0].state === "results" &&
          race.rows[0].attempts === 2 &&
          submitted.includes("actor-a") &&
          submitted.includes("actor-b") &&
          pointsOf(raceStandings, "actor-b") === 10 &&
          pointsOf(raceStandings, "actor-a") === 7,
        detail: JSON.stringify({ a: ra.rows[0].payload, b: rb.rows[0].payload, race: race.rows[0] }),
      });
    } finally {
      await left.end();
      await right.end();
    }

    await partyFixture("REUSE1", [{ gameId: "sky-stack", mode: "climb" }], ["actor-a", "actor-b"]);
    const reused = await client.query(
      `select public.submit_party_round_attempt('REUSE1','actor-a',$1,50,'unverified','sky-stack','climb') as payload`,
      [raceA],
    );
    checks.push({
      name: "a party run id cannot be reused",
      ok: reused.rows[0].payload.error === "run_reuse",
      detail: JSON.stringify(reused.rows[0].payload),
    });

    const challengeRun = crypto.randomUUID();
    const challenge = await client.query(
      `insert into public.challenges (public_code, game_id, mode, seed, type, challenger_actor, challenger_name, challenger_run_id, challenger_score, trust, expires_at)
       values ('CHAL01','velocity-run','course-1','velocity-run:seed','beat-time','actor-a','A',$1,40,'unverified', now() + interval '1 day')
       returning id`,
      [challengeRun],
    );
    const dupChallenge = await client.query(
      `insert into public.challenges (public_code, game_id, mode, seed, type, challenger_actor, challenger_name, challenger_run_id, challenger_score, trust, expires_at)
       values ('CHAL02','velocity-run','course-1','velocity-run:seed','beat-time','actor-a','A',$1,40,'unverified', now() + interval '1 day')`,
      [challengeRun],
    ).then(
      () => ({ ok: false }),
      (err: unknown) => ({ ok: /23505|duplicate/i.test(err instanceof Error ? err.message : String(err)) }),
    );
    checks.push({ name: "challenger_run_id is unique", ok: dupChallenge.ok, detail: String(dupChallenge.ok) });

    const attemptRun = crypto.randomUUID();
    await client.query(
      `insert into public.challenge_attempts (challenge_id, player_actor, player_name, score, trust, run_id)
       values ($1, 'actor-b', 'B', 30, 'unverified', $2)`,
      [challenge.rows[0].id, attemptRun],
    );
    const dupActor = await client.query(
      `insert into public.challenge_attempts (challenge_id, player_actor, player_name, score, trust, run_id)
       values ($1, 'actor-b', 'B', 29, 'unverified', $2)`,
      [challenge.rows[0].id, crypto.randomUUID()],
    ).then(
      () => false,
      (err: unknown) => /23505|duplicate/i.test(err instanceof Error ? err.message : String(err)),
    );
    const dupRun = await client.query(
      `insert into public.challenge_attempts (challenge_id, player_actor, player_name, score, trust, run_id)
       values ($1, 'actor-c', 'C', 28, 'unverified', $2)`,
      [challenge.rows[0].id, attemptRun],
    ).then(
      () => false,
      (err: unknown) => /23505|duplicate/i.test(err instanceof Error ? err.message : String(err)),
    );
    checks.push({
      name: "challenge attempts are unique per player_actor and per run_id",
      ok: dupActor && dupRun,
      detail: `actor ${dupActor} run ${dupRun}`,
    });

    async function lobbyParty(code: string, playlist: unknown, roster: string[]) {
      const inserted = await client.query(
        `insert into public.parties (code, state, current_round, playlist, round_roster, submitted, standings, host_actor)
         values ($1, 'lobby', 0, $2::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, $3)
         returning id`,
        [code, JSON.stringify(playlist), roster[0]],
      );
      for (const actor of roster) {
        await client.query(
          `insert into public.party_members (party_id, actor_id, display_name, ready, points)
           values ($1, $2, $2, true, 0)`,
          [inserted.rows[0].id, actor],
        );
      }
      return inserted.rows[0].id as string;
    }

    const playlist = [
      { gameId: "sky-stack", mode: "climb" },
      { gameId: "sky-stack", mode: "climb" },
    ];
    await lobbyParty("STATE1", playlist, ["actor-a", "actor-b"]);
    const stateStart = await client.query(`select public.start_party('STATE1','actor-a') as payload`);
    const stateRestart = await client.query(`select public.start_party('STATE1','actor-a') as payload`);
    const stateEarly = await client.query(`select public.advance_party('STATE1','actor-a') as payload`);
    await client.query(
      `update public.party_members set ready = false
       where actor_id = 'actor-b' and party_id = (select id from public.parties where code = 'STATE1')`,
    );
    const frozen = await client.query(`select round_roster from public.parties where code = 'STATE1'`);
    const frozenRoster = frozen.rows[0].round_roster as string[];
    await client.query(`select public.submit_party_round_attempt('STATE1','actor-a',$1,100,'unverified','sky-stack','climb')`, [crypto.randomUUID()]);
    await client.query(`select public.submit_party_round_attempt('STATE1','actor-b',$1,200,'unverified','sky-stack','climb')`, [crypto.randomUUID()]);
    const stateResults = await client.query(`select public.start_party('STATE1','actor-a') as payload`);
    const stillResults = await client.query(`select state, current_round from public.parties where code = 'STATE1'`);
    await client.query(
      `update public.party_members set ready = true
       where actor_id = 'actor-b' and party_id = (select id from public.parties where code = 'STATE1')`,
    );
    const stateAdvance = await client.query(`select public.advance_party('STATE1','actor-a') as payload`);
    const statePlayStart = await client.query(`select public.start_party('STATE1','actor-a') as payload`);
    const statePlayAdvance = await client.query(`select public.advance_party('STATE1','actor-a') as payload`);
    await client.query(`select public.submit_party_round_attempt('STATE1','actor-a',$1,300,'unverified','sky-stack','climb')`, [crypto.randomUUID()]);
    await client.query(`select public.submit_party_round_attempt('STATE1','actor-b',$1,50,'unverified','sky-stack','climb')`, [crypto.randomUUID()]);
    const stateDone = await client.query(`select public.advance_party('STATE1','actor-a') as payload`);
    const stateDoneStart = await client.query(`select public.start_party('STATE1','actor-a') as payload`);
    const stateDoneAdvance = await client.query(`select public.advance_party('STATE1','actor-a') as payload`);
    const finalState = await client.query(`select state from public.parties where code = 'STATE1'`);
    checks.push({
      name: "party start is lobby-only and advance walks results to done",
      ok:
        stateStart.rows[0].payload.state === "playing" &&
        stateRestart.rows[0].payload.error === "bad_state" &&
        stateEarly.rows[0].payload.error === "bad_state" &&
        frozenRoster.includes("actor-b") &&
        stateResults.rows[0].payload.error === "bad_state" &&
        stillResults.rows[0].state === "results" &&
        stillResults.rows[0].current_round === 0 &&
        stateAdvance.rows[0].payload.state === "playing" &&
        statePlayStart.rows[0].payload.error === "bad_state" &&
        statePlayAdvance.rows[0].payload.error === "bad_state" &&
        stateDone.rows[0].payload.state === "done" &&
        stateDoneStart.rows[0].payload.error === "bad_state" &&
        stateDoneAdvance.rows[0].payload.error === "bad_state" &&
        finalState.rows[0].state === "done",
      detail: JSON.stringify({
        start: stateStart.rows[0].payload,
        restart: stateRestart.rows[0].payload,
        results: stateResults.rows[0].payload,
        advance: stateAdvance.rows[0].payload,
        done: stateDone.rows[0].payload,
      }),
    });

    await lobbyParty("JOIN6", [{ gameId: "sky-stack", mode: "climb" }], ["host-j", "m1", "m2", "m3", "m4"]);
    const joinLeft = new pg.Client({ connectionString: url });
    const joinRight = new pg.Client({ connectionString: url });
    await joinLeft.connect();
    await joinRight.connect();
    try {
      const [ja, jb] = await Promise.all([
        joinLeft.query(`select public.join_party('JOIN6','n1','N1', null) as payload`),
        joinRight.query(`select public.join_party('JOIN6','n2','N2', null) as payload`),
      ]);
      const joinCount = await client.query(
        `select count(*)::int as n from public.party_members m
         join public.parties p on p.id = m.party_id where p.code = 'JOIN6'`,
      );
      const payloads = [ja.rows[0].payload, jb.rows[0].payload] as Array<{ ok?: boolean; error?: string }>;
      checks.push({
        name: "concurrent party joins stop at 6",
        ok: joinCount.rows[0].n === 6 && payloads.filter((row) => row.ok).length === 1 && payloads.filter((row) => row.error === "full").length === 1,
        detail: JSON.stringify({ payloads, n: joinCount.rows[0].n }),
      });
    } finally {
      await joinLeft.end();
      await joinRight.end();
    }

    await lobbyParty("JOINDUP", [{ gameId: "sky-stack", mode: "climb" }], ["host-d"]);
    const joinOnce = await client.query(`select public.join_party('JOINDUP','actor-z','Z', null) as payload`);
    const joinTwice = await client.query(`select public.join_party('JOINDUP','actor-z','Z', null) as payload`);
    const dupCount = await client.query(
      `select count(*)::int as n from public.party_members m join public.parties p on p.id = m.party_id where p.code = 'JOINDUP'`,
    );
    checks.push({
      name: "duplicate party join is idempotent",
      ok: joinOnce.rows[0].payload.duplicate === false && joinTwice.rows[0].payload.duplicate === true && dupCount.rows[0].n === 2,
      detail: JSON.stringify({ once: joinOnce.rows[0].payload, twice: joinTwice.rows[0].payload, n: dupCount.rows[0].n }),
    });

    await lobbyParty("JOINCL", [{ gameId: "sky-stack", mode: "climb" }], ["host-c"]);
    await client.query(`select public.start_party('JOINCL','host-c')`);
    const closedJoin = await client.query(`select public.join_party('JOINCL','actor-z','Z', null) as payload`);
    const closedCount = await client.query(
      `select count(*)::int as n, p.state from public.party_members m join public.parties p on p.id = m.party_id where p.code = 'JOINCL' group by p.state`,
    );
    checks.push({
      name: "a playing party refuses a new member",
      ok: closedJoin.rows[0].payload.error === "closed" && closedCount.rows[0].n === 1 && closedCount.rows[0].state === "playing",
      detail: JSON.stringify({ closedJoin: closedJoin.rows[0].payload, row: closedCount.rows[0] }),
    });

    await lobbyParty("JOINRS", [{ gameId: "sky-stack", mode: "climb" }], ["host-r"]);
    const raceJoin = new pg.Client({ connectionString: url });
    const raceStart = new pg.Client({ connectionString: url });
    await raceJoin.connect();
    await raceStart.connect();
    try {
      const [joinedRace, startedRace] = await Promise.all([
        raceJoin.query(`select public.join_party('JOINRS','actor-z','Z', null) as payload`),
        raceStart.query(`select public.start_party('JOINRS','host-r') as payload`),
      ]);
      const raceParty = await client.query(
        `select p.state, p.round_roster, count(m.actor_id)::int as n
         from public.parties p
         join public.party_members m on m.party_id = p.id
         where p.code = 'JOINRS'
         group by p.id`,
      );
      const roster = raceParty.rows[0].round_roster as string[];
      const count = raceParty.rows[0].n as number;
      const joinPayload = joinedRace.rows[0].payload as { ok?: boolean; error?: string };
      checks.push({
        name: "join and start lock the same party",
        ok:
          startedRace.rows[0].payload.state === "playing" &&
          raceParty.rows[0].state === "playing" &&
          !roster.includes("actor-z") &&
          ((count === 1 && joinPayload.error === "closed") || (count === 2 && joinPayload.ok === true)),
        detail: JSON.stringify({ join: joinPayload, start: startedRace.rows[0].payload, count, roster }),
      });
    } finally {
      await raceJoin.end();
      await raceStart.end();
    }

    async function openChallenge(code: string, gameId: string, mode: string, type: string, score: number) {
      const runId = crypto.randomUUID();
      const inserted = await client.query(
        `insert into public.challenges (public_code, game_id, mode, seed, type, challenger_actor, challenger_name, challenger_run_id, challenger_score, trust, expires_at)
         values ($1,$2,$3,$4,$5,'actor-a','A',$6,$7,'unverified', now() + interval '1 day')
         returning id`,
        [code, gameId, mode, `${gameId}:seed`, type, runId, score],
      );
      return { id: inserted.rows[0].id as string, runId };
    }

    await openChallenge("CHHI", "sky-stack", "climb", "beat-score", 100);
    const challengeWin = await client.query(
      `select public.submit_challenge_attempt('CHHI','actor-b','B',$1,200,'unverified','sky-stack','climb') as payload`,
      [crypto.randomUUID()],
    );
    const challengeClosed = await client.query(
      `select public.submit_challenge_attempt('CHHI','actor-c','C',$1,999,'unverified','sky-stack','climb') as payload`,
      [crypto.randomUUID()],
    );
    const challengeRow = await client.query(
      `select c.status, c.winner_id, c.target_actor, c.target_score, count(a.id)::int as attempts
       from public.challenges c
       left join public.challenge_attempts a on a.challenge_id = c.id
       where c.public_code = 'CHHI'
       group by c.id`,
    );
    checks.push({
      name: "the first challenge attempt completes and the next one is closed",
      ok:
        challengeWin.rows[0].payload.outcome === "win" &&
        challengeWin.rows[0].payload.winnerId === "actor-b" &&
        challengeClosed.rows[0].payload.error === "challenge_closed" &&
        challengeRow.rows[0].status === "completed" &&
        challengeRow.rows[0].winner_id === "actor-b" &&
        challengeRow.rows[0].target_actor === "actor-b" &&
        Number(challengeRow.rows[0].target_score) === 200 &&
        challengeRow.rows[0].attempts === 1,
      detail: JSON.stringify({ win: challengeWin.rows[0].payload, closed: challengeClosed.rows[0].payload, row: challengeRow.rows[0] }),
    });

    await openChallenge("CHLO", "velocity-run", "course-1", "beat-time", 40);
    const lowerWin = await client.query(
      `select public.submit_challenge_attempt('CHLO','actor-b','B',$1,30,'unverified','velocity-run','course-1') as payload`,
      [crypto.randomUUID()],
    );
    checks.push({
      name: "challenge lower-is-better lets the faster time win",
      ok: lowerWin.rows[0].payload.outcome === "win" && lowerWin.rows[0].payload.winnerId === "actor-b",
      detail: JSON.stringify(lowerWin.rows[0].payload),
    });

    await openChallenge("CHLOSS", "sky-stack", "climb", "beat-score", 100);
    const higherLoss = await client.query(
      `select public.submit_challenge_attempt('CHLOSS','actor-b','B',$1,40,'unverified','sky-stack','climb') as payload`,
      [crypto.randomUUID()],
    );
    checks.push({
      name: "challenge higher-is-better keeps the challenger ahead",
      ok: higherLoss.rows[0].payload.outcome === "loss" && higherLoss.rows[0].payload.winnerId === "actor-a",
      detail: JSON.stringify(higherLoss.rows[0].payload),
    });

    await openChallenge("CHDRAW", "sky-stack", "climb", "beat-score", 80);
    const drawAttempt = await client.query(
      `select public.submit_challenge_attempt('CHDRAW','actor-b','B',$1,80,'unverified','sky-stack','climb') as payload`,
      [crypto.randomUUID()],
    );
    const drawRow = await client.query(`select status, winner_id, target_actor, target_score from public.challenges where public_code = 'CHDRAW'`);
    checks.push({
      name: "a drawn challenge completes without a winner",
      ok:
        drawAttempt.rows[0].payload.outcome === "draw" &&
        drawAttempt.rows[0].payload.winnerId == null &&
        drawRow.rows[0].status === "completed" &&
        drawRow.rows[0].winner_id == null &&
        drawRow.rows[0].target_actor === "actor-b" &&
        Number(drawRow.rows[0].target_score) === 80,
      detail: JSON.stringify({ payload: drawAttempt.rows[0].payload, row: drawRow.rows[0] }),
    });

    await openChallenge("CHSELF", "sky-stack", "climb", "beat-score", 10);
    const selfAttempt = await client.query(
      `select public.submit_challenge_attempt('CHSELF','actor-a','A',$1,90,'unverified','sky-stack','climb') as payload`,
      [crypto.randomUUID()],
    );
    const selfRow = await client.query(
      `select c.status, count(a.id)::int as attempts
       from public.challenges c
       left join public.challenge_attempts a on a.challenge_id = c.id
       where c.public_code = 'CHSELF'
       group by c.id`,
    );
    checks.push({
      name: "a challenger cannot take their own challenge",
      ok: selfAttempt.rows[0].payload.error === "self_challenge" && selfRow.rows[0].status === "open" && selfRow.rows[0].attempts === 0,
      detail: JSON.stringify({ payload: selfAttempt.rows[0].payload, row: selfRow.rows[0] }),
    });

    await openChallenge("CHRACE", "sky-stack", "climb", "beat-score", 100);
    const challengeLeft = new pg.Client({ connectionString: url });
    const challengeRight = new pg.Client({ connectionString: url });
    await challengeLeft.connect();
    await challengeRight.connect();
    try {
      const [ca, cb] = await Promise.all([
        challengeLeft.query(`select public.submit_challenge_attempt('CHRACE','actor-b','B',$1,250,'unverified','sky-stack','climb') as payload`, [crypto.randomUUID()]),
        challengeRight.query(`select public.submit_challenge_attempt('CHRACE','actor-c','C',$1,10,'unverified','sky-stack','climb') as payload`, [crypto.randomUUID()]),
      ]);
      const raceChallenge = await client.query(
        `select c.status, c.winner_id, c.target_actor, c.target_score, a.player_actor, a.score, count(*) over ()::int as attempts
         from public.challenges c
         join public.challenge_attempts a on a.challenge_id = c.id
         where c.public_code = 'CHRACE'`,
      );
      const accepted = [ca.rows[0].payload, cb.rows[0].payload] as Array<{ ok?: boolean; error?: string; winnerId?: string; outcome?: string }>;
      const row = raceChallenge.rows[0];
      const winnerMatches =
        Number(row?.score) > 100 ? row?.winner_id === row?.player_actor : Number(row?.score) < 100 ? row?.winner_id === "actor-a" : row?.winner_id == null;
      checks.push({
        name: "concurrent challenge attempts accept exactly one opponent",
        ok:
          raceChallenge.rowCount === 1 &&
          row?.attempts === 1 &&
          row?.status === "completed" &&
          row?.target_actor === row?.player_actor &&
          Number(row?.target_score) === Number(row?.score) &&
          winnerMatches &&
          accepted.filter((item) => item.ok).length === 1 &&
          accepted.filter((item) => item.error === "challenge_closed").length === 1,
        detail: JSON.stringify({ accepted, row }),
      });
    } finally {
      await challengeLeft.end();
      await challengeRight.end();
    }

    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot execute submit_party_round_attempt", () =>
          client.query(
            "select public.submit_party_round_attempt('RANKHI','actor-a','run','1','unverified','sky-stack','climb')",
          ),
        ),
      ),
    );
    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot execute start_party", () => client.query("select public.start_party('STATE1','actor-a')")),
      ),
    );
    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot execute advance_party", () => client.query("select public.advance_party('STATE1','actor-a')")),
      ),
    );
    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot execute join_party", () => client.query("select public.join_party('STATE1','actor-z','Z', null)")),
      ),
    );
    checks.push(
      await asRole(client, "anon", null, async () =>
        expectDenied("anon cannot execute submit_challenge_attempt", () =>
          client.query("select public.submit_challenge_attempt('CHHI','actor-c','C','run',1,'unverified','sky-stack','climb')"),
        ),
      ),
    );

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
