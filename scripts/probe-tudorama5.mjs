// Tudorama: repro.js + hosts reales, y qué episodios traen servidores latinos.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const BASE = "https://tudorama.com";
const H = { "user-agent": UA, "accept-language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, "accept": "text/html,*/*", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};

const js = await get("https://cdn.tudorama.com/assets/js/repro.js");
console.log("repro.js", js.s, js.b.length + "b");
console.log(js.b.replace(/\s+/g, " ").slice(0, 1500));

console.log("\n### wrapper server-8");
const w = await get("https://cdn.tudorama.com/stream/sub/server-8.php?id1=71bxcr4ajvhq", { referer: BASE + "/" });
console.log(w.b.replace(/\s+/g, " ").slice(0, 1200));

console.log("\n### host real goofy-banana");
const g = await get("https://goofy-banana.com/e/71bxcr4ajvhq", { referer: "https://cdn.tudorama.com/" });
console.log(g.s, g.b.length + "b ->", g.u);
const scripts = [...g.b.matchAll(/<script[^>]*src="([^"]+)"/gi)].map((m) => m[1]).filter((s) => !/ads|analytics|gtag/i.test(s));
console.log("js:", scripts.slice(0, 4).join("  ") || "-");
const dirs = g.b.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/gi) || [];
console.log("directos:", dirs.slice(0, 2).join("  ") || "-");
console.log("body:", g.b.replace(/\s+/g, " ").slice(0, 700));

console.log("\n### bysesukior");
const s = await get("https://bysesukior.com/e/rpkv9vm16dgy", { referer: "https://cdn.tudorama.com/" });
console.log(s.s, s.b.length + "b ->", s.u);
console.log("body:", s.b.replace(/\s+/g, " ").slice(0, 500));

console.log("\n### abyssplayer");
const a = await get("https://abyssplayer.com/dDriNk-T_", { referer: "https://cdn.tudorama.com/" });
console.log(a.s, a.b.length + "b ->", a.u);
console.log("body:", a.b.replace(/\s+/g, " ").slice(0, 500));
