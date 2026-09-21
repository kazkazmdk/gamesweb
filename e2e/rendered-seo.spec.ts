import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { indexablePages } from "../apps/web/content/registry";
import { intentGate, jaccard, tokenize, type RenderedSeoRow } from "../apps/web/content/rendered-seo";

const NOINDEX = ["/play/neon-drift", "/arcade", "/friends", "/inbox", "/daily", "/party", "/crew", "/me", "/settings", "/c/TEST1"];

test("rendered HTML SEO QA writes a DOM report for every indexable URL", async ({ page }) => {
  test.setTimeout(240_000);
  const pages = indexablePages();
  expect(pages.length).toBeGreaterThanOrEqual(50);
  expect(pages.length).toBeLessThanOrEqual(70);

  const rows: RenderedSeoRow[] = [];
  const bags: Array<{ url: string; tokens: Set<string> }> = [];

  for (const seo of pages) {
    const res = await page.goto(seo.path);
    const status = res?.status() ?? 0;
    const title = await page.title();
    const description = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    const canonical = (await page.locator('link[rel="canonical"]').getAttribute("href")) ?? "";
    const robots = (await page.locator('meta[name="robots"]').getAttribute("content")) ?? "";
    const h1 = ((await page.locator("h1").first().textContent()) ?? "").trim();
    const h2s = (await page.locator("h2").allTextContents()).map((t) => t.trim()).filter(Boolean);
    const mainText = ((await page.locator("main").innerText().catch(() => page.locator("body").innerText())) ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const words = mainText.split(/\s+/).filter(Boolean);
    const tokens = tokenize(mainText);
    const hrefs = await page.evaluate(() => {
      const root = document.querySelector("main") ?? document.querySelector("article") ?? document.body;
      return [...root.querySelectorAll("a[href]")]
        .map((el) => el.getAttribute("href") ?? "")
        .filter((h) => h.startsWith("/") && !h.startsWith("/play"));
    });
    const breadcrumbs = await page.locator("nav a, [aria-label='Breadcrumb'] a").allTextContents();
    const jsonld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const playCta = (await page.locator("main a[href*='/play/'], main a[href*='/games/']").count()) > 0;
    const imageAlts = await page.locator("main img").evaluateAll((els) => els.map((el) => (el as HTMLImageElement).alt));

    bags.push({ url: seo.path, tokens });
    rows.push({
      url: seo.path,
      status,
      title,
      description,
      canonical,
      robots,
      h1,
      h2s,
      visibleWords: words.length,
      uniqueTokens: tokens.size,
      internalLinks: [...new Set(hrefs)],
      breadcrumbs,
      jsonld: jsonld.map((raw) => {
        try {
          const parsed = JSON.parse(raw) as { "@type"?: string } | Array<{ "@type"?: string }>;
          const items = Array.isArray(parsed) ? parsed : [parsed];
          return items.map((i) => i["@type"] ?? "unknown").join(",");
        } catch {
          return "invalid";
        }
      }),
      playCta,
      imageAlts,
      nearestURL: null,
      similarity: 0,
      qualityGate: status === 200 ? "pass" : "canonical",
    });

    expect(status, seo.path).toBe(200);
    expect(title.length, seo.path).toBeGreaterThan(8);
    expect(canonical, seo.path).toMatch(/^https?:\/\//);
    expect(robots, seo.path).not.toMatch(/noindex/i);
    expect(h1.length, seo.path).toBeGreaterThan(2);
    expect(hrefs.length, seo.path).toBeGreaterThan(0);
    const hasParent = seo.parents.some((p) => hrefs.includes(p) || hrefs.includes(`${p}/`) || p === "/");
    if (seo.topic !== "home") expect(hasParent || hrefs.some((h) => h === "/" || h.startsWith("/games")), seo.path).toBeTruthy();
  }

  for (let i = 0; i < rows.length; i += 1) {
    let nearest = 0;
    let nearestURL: string | null = null;
    for (let j = 0; j < rows.length; j += 1) {
      if (i === j) continue;
      const sim = jaccard(bags[i].tokens, bags[j].tokens);
      if (sim > nearest) {
        nearest = sim;
        nearestURL = rows[j].url;
      }
    }
    rows[i].nearestURL = nearestURL;
    rows[i].similarity = Number(nearest.toFixed(3));
    const seo = pages[i];
    const intent = intentGate(seo.topic, rows[i]);
    if (intent !== "pass") rows[i].qualityGate = "intent";
    else if (nearest > 0.92 && seo.topic !== "controls") rows[i].qualityGate = "near-duplicate";
    else if (rows[i].internalLinks.length === 0) rows[i].qualityGate = "orphan";
  }

  const failed = rows.filter((r) => r.qualityGate !== "pass");
  mkdirSync("docs/qa-production-closure", { recursive: true });
  writeFileSync("docs/qa-production-closure/rendered-seo.json", JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));
  writeFileSync(
    "docs/RENDERED-SEO-QA.md",
    [
      "# Rendered SEO QA",
      "",
      `Indexable URLs: ${rows.length}`,
      `Pass: ${rows.filter((r) => r.qualityGate === "pass").length}`,
      `Issues: ${failed.length}`,
      "",
      "| URL | words | unique | nearest | similarity | gate |",
      "| --- | ---: | ---: | --- | ---: | --- |",
      ...rows.map((r) => `| ${r.url} | ${r.visibleWords} | ${r.uniqueTokens} | ${r.nearestURL ?? ""} | ${r.similarity} | ${r.qualityGate} |`),
      "",
    ].join("\n"),
  );
  expect(failed, JSON.stringify(failed, null, 2)).toEqual([]);
});

test("noindex surfaces stay out of the sitemap", async ({ page, request }) => {
  for (const path of NOINDEX) {
    await page.goto(path);
    const robots = (await page.locator('meta[name="robots"]').getAttribute("content")) ?? "";
    expect(robots, path).toMatch(/noindex/i);
  }
  const xml = await (await request.get("/sitemap.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const path of locs) {
    expect(path === "/arcade" || path.startsWith("/play/") || path.startsWith("/friends") || path.startsWith("/inbox") || path.startsWith("/party") || path.startsWith("/c/"), path).toBeFalsy();
  }
});
