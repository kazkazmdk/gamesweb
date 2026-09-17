#!/usr/bin/env node
/**
 * Vercel Ignored Build Step.
 *
 * Exit 0 → SKIP the Vercel build
 * Exit 1 → CONTINUE the Vercel build
 *
 * Never use HEAD^ / HEAD~1 as the only comparison. Prefer
 * VERCEL_GIT_PREVIOUS_SHA + VERCEL_GIT_COMMIT_SHA. If no reliable
 * previous SHA exists, fail safe and CONTINUE (do not skip production).
 */

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const EXIT_SKIP = 0;
export const EXIT_BUILD = 1;

export const AGENT_BRANCH_PREFIXES = [
  "cursor/",
  "claude/",
  "codex/",
  "agent/",
  "qa/",
  "design/",
  "fix/",
];

export const PRODUCTION_BRANCHES = ["main", "master"];
export const RELEASE_PREFIXES = ["release/"];

/** Live Vercel project for this repository. */
export const APPS = {
  web: {
    id: "web",
    vercelProjectIds: ["prj_6myfSW55ydOMzlVGnsicj2jCAgVk"],
    vercelNames: ["gamesweb"],
    roots: ["apps/web"],
    deps: [
      "packages/analytics",
      "packages/config",
      "packages/database",
      "packages/game-core",
      "packages/game-sdk",
      "packages/ui",
      "games/crowd-control",
      "games/knockout-circuit",
      "games/neon-drift",
      "games/pocket-striker",
      "games/sky-stack",
      "games/swarm-protocol",
      "games/territory-rush",
      "games/velocity-run",
    ],
    config: [
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "vercel.json",
      "apps/web/vercel.json",
      ".npmrc",
      "scripts/vercel-should-build.mjs",
    ],
  },
};

/**
 * Synthetic graph used only by tests to prove isolation.
 * Not a real Vercel project in this repository.
 */
export const FIXTURE_APPS = {
  "app-a": {
    id: "app-a",
    vercelProjectIds: ["prj_fixture_a"],
    vercelNames: ["app-a"],
    roots: ["apps/app-a"],
    deps: ["packages/shared-a"],
    config: ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"],
  },
  "app-b": {
    id: "app-b",
    vercelProjectIds: ["prj_fixture_b"],
    vercelNames: ["app-b"],
    roots: ["apps/app-b"],
    deps: ["packages/shared-b"],
    config: ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"],
  },
  "app-c": {
    id: "app-c",
    vercelProjectIds: ["prj_fixture_c"],
    vercelNames: ["app-c"],
    roots: ["apps/app-c"],
    deps: ["packages/shared-c", "packages/shared-a"],
    config: ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"],
  },
};

const DOC_AND_TOOLING = [
  "docs/",
  "e2e/",
  "tests/",
  ".github/",
  "supabase/",
  "apps/tmp/",
  "playwright-report/",
  "test-results/",
  "AGENTS.md",
  "README.md",
  "playwright.config.ts",
  "playwright.remote.config.ts",
  "vitest.config.ts",
];

export function isAgentBranch(ref) {
  const branch = normalizeRef(ref);
  if (!branch) return false;
  return AGENT_BRANCH_PREFIXES.some((prefix) => branch.startsWith(prefix));
}

export function isProductionBranch(ref) {
  const branch = normalizeRef(ref);
  return Boolean(branch && PRODUCTION_BRANCHES.includes(branch));
}

export function isReleaseBranch(ref) {
  const branch = normalizeRef(ref);
  return Boolean(branch && RELEASE_PREFIXES.some((prefix) => branch.startsWith(prefix)));
}

export function normalizeRef(ref) {
  if (!ref) return "";
  return String(ref).replace(/^refs\/heads\//, "").trim();
}

export function resolveApp(env, catalog = APPS) {
  const forced = env.VERCEL_APP_ID || env.APP_ID;
  if (forced && catalog[forced]) return catalog[forced];
  const projectId = env.VERCEL_PROJECT_ID;
  if (projectId) {
    const hit = Object.values(catalog).find((app) => app.vercelProjectIds.includes(projectId));
    if (hit) return hit;
  }
  const name = (env.VERCEL_PROJECT_NAME || "").toLowerCase();
  if (name) {
    const hit = Object.values(catalog).find((app) => app.vercelNames.some((n) => n.toLowerCase() === name));
    if (hit) return hit;
  }
  if (Object.keys(catalog).length === 1) return Object.values(catalog)[0];
  return null;
}

export function pathAffectsApp(file, app) {
  const clean = file.replace(/^\.\//, "");
  const prefixes = [...app.roots, ...app.deps];
  if (prefixes.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`))) return true;
  if (app.config.some((item) => clean === item || clean.startsWith(`${item}/`))) return true;
  return false;
}

export function isDocOrToolingOnly(files) {
  if (!files.length) return false;
  return files.every((file) => {
    const clean = file.replace(/^\.\//, "");
    if (clean.endsWith(".md")) return true;
    return DOC_AND_TOOLING.some((item) => clean === item || clean.startsWith(item));
  });
}

export function decide({
  branch,
  vercelEnv,
  forceBuild,
  previousSha,
  commitSha,
  files,
  app,
  knownProject = true,
}) {
  if (forceBuild) return result("build", "VERCEL_FORCE_BUILD is set");
  if (!knownProject || !app) {
    return result("build", "unknown Vercel project — fail safe, do not skip");
  }

  const production = vercelEnv === "production" || isProductionBranch(branch);
  if (!production && isAgentBranch(branch)) {
    return result("skip", `agent branch ${branch} is local-validation only`);
  }

  if (!previousSha || !commitSha || previousSha === commitSha) {
    if (production) return result("build", "no reliable previous SHA on a production branch — fail safe");
    if (isReleaseBranch(branch)) return result("build", "no reliable previous SHA on a release branch — fail safe");
    if (files && files.length) {
      if (isDocOrToolingOnly(files) && !files.some((file) => pathAffectsApp(file, app))) {
        return result("skip", "documentation/tooling only");
      }
      if (files.some((file) => pathAffectsApp(file, app))) return result("build", `${app.id} is affected`);
      return result("skip", `${app.id} is not affected`);
    }
    return result("build", "no reliable previous SHA — fail safe");
  }

  if (!files) return result("build", "could not list changed files — fail safe");
  if (files.some((file) => pathAffectsApp(file, app))) return result("build", `${app.id} is affected`);
  if (isDocOrToolingOnly(files)) return result("skip", "documentation/tooling only");
  return result("skip", `${app.id} is not affected`);
}

function result(action, reason) {
  return { action, reason, exitCode: action === "skip" ? EXIT_SKIP : EXIT_BUILD };
}

export function listChangedFiles(previousSha, commitSha) {
  try {
    const out = execFileSync("git", ["diff", "--name-only", previousSha, commitSha], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out.split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

export function shaExists(sha) {
  if (!sha) return false;
  try {
    execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function resolveShas(env) {
  const commitSha = env.VERCEL_GIT_COMMIT_SHA || env.GITHUB_SHA || "";
  const previousSha = env.VERCEL_GIT_PREVIOUS_SHA || "";
  return {
    commitSha: shaExists(commitSha) ? commitSha : commitSha || "",
    previousSha: shaExists(previousSha) ? previousSha : "",
    previousReliable: Boolean(previousSha && shaExists(previousSha)),
  };
}

function readForce(env) {
  const raw = String(env.VERCEL_FORCE_BUILD || "").toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function decideFromEnv(env = process.env, catalog = APPS, filesOverride) {
  const app = resolveApp(env, catalog);
  const knownProject = Boolean(app) && (!env.VERCEL_PROJECT_ID || app.vercelProjectIds.includes(env.VERCEL_PROJECT_ID) || catalog !== APPS);
  const { commitSha, previousSha, previousReliable } = resolveShas(env);
  const files =
    filesOverride ??
    (previousReliable && commitSha ? listChangedFiles(previousSha, commitSha) : filesOverride);
  return decide({
    branch: env.VERCEL_GIT_COMMIT_REF || env.GITHUB_REF_NAME || "",
    vercelEnv: env.VERCEL_ENV || "",
    forceBuild: readForce(env),
    previousSha: previousReliable ? previousSha : "",
    commitSha,
    files,
    app,
    knownProject,
  });
}

function isEntrypoint() {
  const self = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? fileURLToPath(new URL(process.argv[1], "file://")) : "";
  return self === invoked;
}

if (isEntrypoint()) {
  const appFlag = process.argv.find((arg) => arg.startsWith("--app="))?.slice(6);
  const graphFlag = process.argv.find((arg) => arg.startsWith("--graph="))?.slice(8);
  const catalog = graphFlag === "fixture" ? FIXTURE_APPS : APPS;
  const env = { ...process.env };
  if (appFlag) env.VERCEL_APP_ID = appFlag;
  const decision = decideFromEnv(env, catalog);
  const appId = resolveApp(env, catalog)?.id ?? "unknown";
  console.log(
    `[vercel-should-build] app=${appId} branch=${normalizeRef(env.VERCEL_GIT_COMMIT_REF || "")} env=${env.VERCEL_ENV || "local"} → ${decision.action.toUpperCase()} (${decision.reason})`,
  );
  process.exit(decision.exitCode);
}
