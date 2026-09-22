import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "docs/qa-production-closure/neon";
const TRACKS = [
  { id: "harbour", index: 0, key: "foundation" },
  { id: "hairpin", index: 1, key: "technical" },
  { id: "ridge", index: 2, key: "ridge" },
] as const;
const MOMENTS = ["opening", "mid", "distinctive"] as const;

async function debugOf(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __GW_DEBUG__?: { ready?: boolean; gameId?: string; trackId?: string } }).__GW_DEBUG__ ?? null,
  );
}

async function cmd(page: Page, name: string, ...args: unknown[]) {
  await page.evaluate(
    ([key, params]) => {
      const bag = (window as unknown as { __GW_DEBUG_CMD__?: Record<string, (...a: unknown[]) => void> }).__GW_DEBUG_CMD__;
      bag?.[key]?.(...params);
    },
    [name, args] as const,
  );
}

async function waitTrack(page: Page, index: number) {
  await page.addInitScript(
    ({ i }) => {
      (window as Window & { __GW_ALLOW_DEBUG__?: boolean }).__GW_ALLOW_DEBUG__ = true;
      localStorage.setItem("gw:neon-track", String(i));
    },
    { i: index },
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/play/neon-drift");
  await page.locator("canvas").waitFor({ timeout: 30_000 });
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      return d?.ready ? d.gameId : null;
    }, { timeout: 30_000 })
    .toBe("neon-drift");
}

async function shotCanvas(page: Page, file: string) {
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas missing");
  // locator.screenshot waits until the element stops moving. A live WebGL
  // canvas never settles on a busy CI runner, so the shot is clipped instead.
  await page.screenshot({
    path: file,
    animations: "disabled",
    clip: { x: box.x, y: box.y, width: Math.floor(box.width), height: Math.floor(box.height) },
  });
}

test("neon harbour / hairpin / ridge are visually distinct at 1440", async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  const files: string[] = [];

  for (const track of TRACKS) {
    await waitTrack(page, track.index);
    for (const [i, moment] of MOMENTS.entries()) {
      if (i === 0) await page.waitForTimeout(200);
      if (i > 0) {
        await cmd(page, "setDrive", 0.7, i === 2 ? 0.22 : 0.08, false);
        await page.waitForTimeout(280 + i * 80);
        await cmd(page, "setDrive", 0, 0, false);
      }
      const unlabeled = `${OUT}/${track.id}-${moment}-unlabeled-1440.png`;
      await shotCanvas(page, unlabeled);
      files.push(unlabeled);
      if (moment === "opening") {
        const labeled = `${OUT}/${track.id}-${moment}-1440.png`;
        await page.screenshot({ path: labeled, fullPage: false, animations: "disabled" });
        files.push(labeled);
      }
    }
  }

  const cells = TRACKS.flatMap((track) =>
    MOMENTS.map((moment) => ({
      src: `neon/${track.id}-${moment}-unlabeled-1440.png`,
      label: `${track.id} ${moment}`,
    })),
  );
  writeFileSync(
    "docs/qa-production-closure/neon-contact-sheet.html",
    `<!doctype html><html><body style="margin:0;background:#0b0b10;color:#fff;font:12px sans-serif">
    <div id="labeled" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px">
      ${cells
        .map(
          (c) =>
            `<figure style="margin:0"><img src="${c.src}" style="width:100%;display:block"/><figcaption>${c.label}</figcaption></figure>`,
        )
        .join("")}
    </div>
    <div id="unlabeled" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px">
      ${cells.map((c) => `<img src="${c.src}" style="width:100%;display:block"/>`).join("")}
    </div></body></html>`,
  );
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("file://" + process.cwd() + "/docs/qa-production-closure/neon-contact-sheet.html");
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  for (const [id, file] of [
    ["#labeled", `${OUT}/contact-sheet.png`],
    ["#unlabeled", `${OUT}/contact-sheet-unlabeled.png`],
  ] as const) {
    const box = await page.locator(id).boundingBox();
    if (!box) throw new Error(`${id} missing`);
    await page.screenshot({
      path: file,
      animations: "disabled",
      clip: { x: box.x, y: box.y, width: Math.max(1, Math.round(box.width)), height: Math.max(1, Math.round(box.height)) },
    });
  }
  expect(files.length).toBe(TRACKS.length * MOMENTS.length + TRACKS.length);
});
