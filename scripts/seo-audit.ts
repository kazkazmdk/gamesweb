import {
  countsByFamily,
  indexableEntries,
  rawSeoAudit,
  seoAudit,
  sitemapRecords,
} from "../apps/web/lib/seo-content/registry.ts";

const indexable = indexableEntries();
const issues = [...rawSeoAudit(), ...seoAudit()];
const unique = new Map(issues.map((i) => [`${i.id}:${i.code}`, i]));

console.log(`indexable\t${indexable.length}`);
console.log("families\t" + JSON.stringify(countsByFamily()));
console.log(`sitemap\t${sitemapRecords().length}`);
console.log(`issues\t${unique.size}`);
for (const issue of unique.values()) {
  console.log(`${issue.code}\t${issue.path}\t${issue.message}`);
}
if ([...unique.values()].some((i) => ["title-dup", "desc-dup", "rel-game", "rel-guide", "orphan"].includes(i.code))) {
  process.exitCode = 1;
}
