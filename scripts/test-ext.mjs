// Node smoke test for the JS extensions.
// Stubs Mangayomi runtime pieces (Client, Document, native extractors) with cheerio.
// usage: node scripts/test-ext.mjs [extension.js ...]
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import * as cheerio from "cheerio";

const ROOT = path.resolve(import.meta.dirname, "..");

class Element {
  constructor($, el) {
    this.$ = $;
    this.el = el;
  }
  get text() {
    return this.$(this.el).text();
  }
  attr(name) {
    const v = this.$(this.el).attr(name);
    return v === undefined ? "" : v;
  }
  select(sel) {
    return this.$(this.el).find(sel).toArray().map((e) => new Element(this.$, e));
  }
  selectFirst(sel) {
    const list = this.select(sel);
    return list.length ? list[0] : null;
  }
}

class Document {
  constructor(html) {
    this.$ = cheerio.load(html || "");
  }
  select(sel) {
    return this.$(sel).toArray().map((e) => new Element(this.$, e));
  }
  selectFirst(sel) {
    const list = this.select(sel);
    return list.length ? list[0] : null;
  }
}

class Client {
  async get(url, headers = {}) {
    const res = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(45000) });
    const body = await res.text();
    return { statusCode: res.status, body, headers: Object.fromEntries(res.headers) };
  }
  async post(url, headers = {}, body = "") {
    const res = await fetch(url, { method: "POST", headers, body, redirect: "follow", signal: AbortSignal.timeout(45000) });
    const text = await res.text();
    return { statusCode: res.status, body: text, headers: Object.fromEntries(res.headers) };
  }
}

class MProvider {
  get supportsLatest() { return true; }
}

const stub = (name) => async (url) => {
  let host = "x";
  try { host = new URL(url).hostname; } catch { }
  return JSON.stringify([
    { url: `https://cdn.stub/${name}/${host}/master.m3u8`, originalUrl: url, quality: "HD", headers: {} },
  ]);
};

const globals = {
  MProvider,
  Client,
  Document,
  console,
  SharedPreferences: class { get() { return ""; } set() { } },
  voeExtractor: stub("voe"),
  streamWishExtractor: stub("streamwish"),
  filemoonExtractor: stub("filemoon"),
  doodExtractor: stub("dood"),
  yourUploadExtractor: stub("yourupload"),
  okruExtractor: stub("okru"),
  mp4UploadExtractor: stub("mp4upload"),
  streamTapeExtractor: stub("streamtape"),
  vidBomExtractor: stub("vidbom"),
  sibnetExtractor: stub("sibnet"),
};

function load(file) {
  const code = fs.readFileSync(file, "utf8");
  const ctx = vm.createContext({ ...globals });
  vm.runInContext(
    code + "\n;globalThis.__ext = new DefaultExtension(); globalThis.__ext.source = mangayomiSources[0]; globalThis.__src = mangayomiSources[0];",
    ctx,
    { filename: file }
  );
  return ctx;
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((p) => path.resolve(p))
  : fs
      .readdirSync(path.join(ROOT, "javascript"), { recursive: true })
      .filter((f) => String(f).endsWith(".js"))
      .map((f) => path.join(ROOT, "javascript", String(f)));

let failures = 0;
const only = process.env.ONLY || "";

for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (only && !rel.includes(only)) continue;
  console.log(`\n=== ${rel}`);
  let ctx;
  try {
    ctx = load(file);
  } catch (e) {
    console.log("  LOAD FAIL", e.message);
    failures++;
    continue;
  }
  const ext = ctx.__ext;
  const src = ctx.__src;
  console.log(`  source: ${src.name} ${src.baseUrl}`);

  const call = (label, fn, fmt) => fn().then((v) => {
    console.log(`  ${label}: ${fmt(v)}`);
    return v;
  }).catch((e) => {
    console.log(`  ${label}: FAIL ${e.message}`);
    failures++;
    return null;
  });

  const popular = await call("popular", () => ext.getPopular(1), (r) => {
    const first = r.list[0] || {};
    return `${r.list.length} items, next=${r.hasNextPage} | ${first.name} -> ${first.link}`;
  });

  await call("search", () => ext.search("naruto", 1, []), (r) => {
    const first = r.list[0] || {};
    return `${r.list.length} items | ${first.name} -> ${first.link}`;
  });

  let detail = null;
  const target = (popular && popular.list[0]) ? popular.list[0].link : null;
  if (target) {
    detail = await call("detail", () => ext.getDetail(target), (d) =>
      `${d.name} | ${d.chapters.length} eps | img=${d.imageUrl ? "si" : "no"} | genre=${d.genre.join("/")}`
    );
  }

  if (detail && detail.chapters.length) {
    for (const chapter of detail.chapters.slice(0, 2)) {
      await call(`videos ${chapter.name}`, () => ext.getVideoList(chapter.url), (list) => {
        const urls = list.slice(0, 3).map((v) => `${v.quality}=${v.url}`).join(" | ");
        return `${list.length} | ${urls}`;
      });
    }
  }
}

console.log(`\nfailures: ${failures}`);
process.exit(failures ? 1 : 0);
