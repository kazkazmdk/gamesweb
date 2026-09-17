import { describe, expect, it } from "vitest";
import {
  APPS,
  EXIT_BUILD,
  EXIT_SKIP,
  FIXTURE_APPS,
  decide,
  isAgentBranch,
  pathAffectsApp,
  resolveApp,
} from "../scripts/vercel-should-build.mjs";

const web = APPS.web;
const a = FIXTURE_APPS["app-a"];
const b = FIXTURE_APPS["app-b"];
const c = FIXTURE_APPS["app-c"];

describe("vercel-should-build isolation", () => {
  it("1. only app A changes → A BUILD, B SKIP, C SKIP", () => {
    const files = ["apps/app-a/src/page.tsx"];
    expect(decide({ files, app: a, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("build");
    expect(decide({ files, app: b, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("skip");
    expect(decide({ files, app: c, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("skip");
  });

  it("2. only app B changes → A SKIP, B BUILD, C SKIP", () => {
    const files = ["apps/app-b/src/page.tsx"];
    expect(decide({ files, app: a, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("skip");
    expect(decide({ files, app: b, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("build");
    expect(decide({ files, app: c, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("skip");
  });

  it("3. only documentation changes → all apps SKIP", () => {
    const files = ["docs/VERCEL_DEPLOY_POLICY.md", "README.md", "AGENTS.md"];
    for (const app of [a, b, c, web]) {
      expect(decide({ files, app, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("skip");
    }
  });

  it("4. relevant shared dependency → only dependents BUILD", () => {
    const files = ["packages/shared-a/src/index.ts"];
    expect(decide({ files, app: a, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("build");
    expect(decide({ files, app: b, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("skip");
    expect(decide({ files, app: c, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("build");
  });

  it("5. unrelated tooling → apps SKIP", () => {
    const files = ["e2e/smoke.spec.ts", ".github/workflows/ci.yml", "vitest.config.ts"];
    expect(decide({ files, app: web, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("skip");
    expect(decide({ files, app: a, branch: "main", previousSha: "p", commitSha: "c" }).action).toBe("skip");
  });

  it("6. production branch with affected app → BUILD", () => {
    const files = ["apps/web/app/page.tsx"];
    const decision = decide({
      files,
      app: web,
      branch: "main",
      vercelEnv: "production",
      previousSha: "p",
      commitSha: "c",
    });
    expect(decision.action).toBe("build");
    expect(decision.exitCode).toBe(EXIT_BUILD);
  });

  it("7. routine Cursor branch → SKIP even if the app is affected", () => {
    const files = ["apps/web/app/page.tsx"];
    const decision = decide({
      files,
      app: web,
      branch: "cursor/vercel-deploy-policy-c08e",
      vercelEnv: "preview",
      previousSha: "p",
      commitSha: "c",
    });
    expect(decision.action).toBe("skip");
    expect(decision.exitCode).toBe(EXIT_SKIP);
  });
});

describe("vercel-should-build safety", () => {
  it("fails safe when previous SHA is missing on production", () => {
    const decision = decide({
      app: web,
      branch: "main",
      vercelEnv: "production",
      previousSha: "",
      commitSha: "abc",
      files: ["docs/only.md"],
    });
    expect(decision.action).toBe("build");
  });

  it("never skips an unknown project", () => {
    const decision = decide({
      app: null,
      knownProject: false,
      branch: "main",
      previousSha: "p",
      commitSha: "c",
      files: ["docs/only.md"],
    });
    expect(decision.action).toBe("build");
  });

  it("VERCEL_FORCE_BUILD overrides agent-branch skip", () => {
    const decision = decide({
      app: web,
      branch: "cursor/preview-please-c08e",
      vercelEnv: "preview",
      forceBuild: true,
      previousSha: "p",
      commitSha: "c",
      files: ["apps/web/app/page.tsx"],
    });
    expect(decision.action).toBe("build");
  });

  it("maps the live Vercel project id to web", () => {
    expect(resolveApp({ VERCEL_PROJECT_ID: "prj_6myfSW55ydOMzlVGnsicj2jCAgVk" })?.id).toBe("web");
    expect(resolveApp({ VERCEL_PROJECT_NAME: "gamesweb" })?.id).toBe("web");
  });

  it("does not treat a lockfile as a reason for every fixture app to ignore isolation of app sources", () => {
    expect(pathAffectsApp("apps/app-b/src/x.ts", a)).toBe(false);
    expect(pathAffectsApp("packages/shared-b/index.ts", a)).toBe(false);
    expect(pathAffectsApp("packages/game-sdk/src/index.ts", web)).toBe(true);
    expect(pathAffectsApp("docs/VERCEL_DEPLOY_POLICY.md", web)).toBe(false);
  });

  it("recognizes agent branch prefixes", () => {
    expect(isAgentBranch("cursor/foo-c08e")).toBe(true);
    expect(isAgentBranch("refs/heads/claude/bar")).toBe(true);
    expect(isAgentBranch("codex/x")).toBe(true);
    expect(isAgentBranch("main")).toBe(false);
    expect(isAgentBranch("release/1.2.0")).toBe(false);
  });

  it("release branches are not agent-skipped", () => {
    const decision = decide({
      app: web,
      branch: "release/1.4.0",
      vercelEnv: "preview",
      previousSha: "p",
      commitSha: "c",
      files: ["apps/web/app/page.tsx"],
    });
    expect(decision.action).toBe("build");
  });
});
