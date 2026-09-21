#!/usr/bin/env node
const branch = process.env.VERCEL_GIT_COMMIT_REF || "";
const message = process.env.VERCEL_GIT_COMMIT_MESSAGE || "";
const force = process.env.FORCE_VERCEL_BUILD === "1";
const skipPrefixes = ["cursor/", "claude/", "codex/", "agent/", "qa/", "design/", "fix/"];

if (force) {
  console.log("vercel-should-build: forced");
  process.exit(1);
}

if (message.includes("[skip vercel]")) {
  console.log("vercel-should-build: skip vercel in commit message");
  process.exit(0);
}

if (skipPrefixes.some((prefix) => branch.startsWith(prefix))) {
  console.log(`vercel-should-build: skip agent branch ${branch}`);
  process.exit(0);
}

if (process.argv.includes("--branch")) {
  const idx = process.argv.indexOf("--branch");
  const fake = process.argv[idx + 1] || "";
  if (skipPrefixes.some((prefix) => fake.startsWith(prefix))) process.exit(0);
}

process.exit(1);
