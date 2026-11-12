// Los Simpson 0x79 on Cuevana3: raw embed URLs, streamwish's new main.js
// bootstrap, and whether vidhide answers on another of its rotating domains.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow" });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause && e.cause.code || e.message) }; }
};
const pp = (b) => {
  const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  try { return JSON.parse(m[1]).props.pageProps; } catch { return null; }
};

const page = await get("https://wv3.cuevana3.eu/episodio/los-simpson-temporada-0-episodio-79");
const en = pp(page.b).episode || pp(page.b).thisSerie;
console.log("=== embeds crudos ===");
const embeds = [];
for (const lang of Object.keys(en.videos)) {
  for (const e of en.videos[lang] || []) {
    if (!e || !e.result) continue;
    const pl = await get(e.result, { Referer: page.u });
    const m = pl.b.match(/var url\s*=\s*['"]([^'"]+)['"]/i);
    const emb = m ? m[1].replace(/\\\//g, "/") : "";
    embeds.push({ lang, locker: e.cyberlocker, result: e.result, embed: emb });
    console.log(`${lang.padEnd(8)} ${String(e.cyberlocker).padEnd(12)} ${e.result}\n         -> ${emb}`);
  }
}

console.log("\n=== streamwish main.js ===");
const js = await get("https://streamwish.to/main.js?v=1.1.9");
console.log("status", js.s, "len", js.b.length);
const keys = ["location", "cookie", "fetch(", "/api", "token", "reload", "eval(", "atob", "challenge", "pow", "sha"];
for (const k of keys) {
  let i = js.b.indexOf(k);
  if (i >= 0) console.log(`[${k}] ${js.b.slice(Math.max(0, i - 90), i + 200).replace(/\s+/g, " ")}`);
}

console.log("\n=== vidhide en otros dominios ===");
const sw = embeds.find((e) => /streamwish/.test(e.embed || ""));
const vh = embeds.find((e) => /vidhide/.test(e.embed || ""));
const code = vh ? vh.embed.split("?")[0].split("/").filter(Boolean).pop() : "";
console.log("code:", code);
for (const d of ["vidhidepro.com", "vidhide.lol", "vidhide.com", "vidhide.su", "vidhide.xyz", "vidhide.fi", "vidhide.icu", "vidhide.top", "vidhide.biz", "vidhide.cam", "vidhide.vip", "vidhide.cc"]) {
  const r = await get(`https://${d}/v/${code}`);
  console.log(d.padEnd(18), String(r.s).padEnd(4), r.b.length, r.b ? r.b.replace(/\s+/g, " ").slice(0, 70) : (r.err || ""));
}
