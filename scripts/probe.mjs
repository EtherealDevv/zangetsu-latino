// Scratch tool: fetch a page and dump the shapes that matter (selectors, links, iframes).
// Usage: node scripts/probe.mjs <url> [css selector ...]
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

const url = process.argv[2];
const selectors = process.argv.slice(3);
if (!url) {
  console.error("usage: node scripts/probe.mjs <url> [selector ...]");
  process.exit(1);
}

const res = await fetch(url, {
  headers: {
    "User-Agent": UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-419,es;q=0.9,en;q=0.8",
  },
  redirect: "follow",
});
const html = await res.text();
const $ = cheerio.load(html);

const short = (s, n = 400) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

console.log(`status ${res.status}  bytes ${html.length}  final ${res.url}`);
console.log(`title  ${short($("title").text(), 120)}`);
console.log(`generator ${$('meta[name="generator"]').attr("content") || "-"}`);

if (selectors.length) {
  for (const sel of selectors) {
    const els = $(sel);
    console.log(`\n== ${sel}  (${els.length})`);
    els.slice(0, 3).each((_, el) => {
      console.log("   ", short($(el).prop("outerHTML") || $.html(el), 700));
    });
  }
  process.exit(0);
}

const classCount = new Map();
$("article, li, div.item, div").each((_, el) => {
  const cls = ($(el).attr("class") || "").trim();
  if (!cls) return;
  for (const c of cls.split(/\s+/)) classCount.set(c, (classCount.get(c) || 0) + 1);
});
const top = [...classCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
console.log("\n== top classes");
for (const [c, n] of top) console.log(`   ${String(n).padStart(4)}  ${c}`);

console.log("\n== first 25 unique link shapes");
const seen = new Set();
$("a[href]").each((_, el) => {
  if (seen.size >= 25) return;
  const href = $(el).attr("href");
  if (!href || href.startsWith("#") || href.startsWith("javascript")) return;
  const cls = ($(el).attr("class") || "").trim();
  const key = `${href.split("?")[0]}|${cls}`;
  if (seen.has(key)) return;
  seen.add(key);
  console.log(`   ${short(href, 110)}  [${cls}]  ${short($(el).text(), 60)}`);
});

console.log("\n== iframes");
$("iframe").each((_, el) => {
  console.log(`   src=${short($(el).attr("src"), 160)}  data-src=${short($(el).attr("data-src"), 120)}`);
});
