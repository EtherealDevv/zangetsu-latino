// Clones streamwish/byse: qué endpoint resuelve hoy el video.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const HEAD = { "user-agent": UA, "accept-language": "es-419,es;q=0.9", "accept": "text/html,application/xhtml+xml,*/*", "sec-fetch-mode": "navigate", "sec-fetch-site": "none", "upgrade-insecure-requests": "1" };

for (const [host, path] of [
  ["bysefujedu.com", "/e/f2rwhq07ydg3"],
  ["bysekoze.com", "/e/1"],
  ["flaswish.com", "/e/4osi2qy5l2bv"],
  ["myvidplay.com", "/e/1"],
  ["vide0.net", "/e/1"]
]) {
  const r = await get("https://" + host + path, HEAD);
  console.log(`\n#### ${host} ${r.s} ${r.b.length}b -> ${r.u.slice(0, 70)}`);
  const js = [...new Set([...r.b.matchAll(/<script[^>]*src="([^"]+)"/gi)].map((m) => m[1]))].filter((s) => !/ads|googletag|analytics|jquery/i.test(s)).slice(0, 4);
  console.log("  js:", js.join("  ") || "-");
  for (const j of js.slice(0, 2)) {
    const u = j.startsWith("http") ? j : new URL(j, r.u).href;
    const b = await get(u, { referer: r.u });
    const apis = [...new Set([...b.b.matchAll(/["'`](\/?(?:api|dl|load|stream|embed)[a-z0-9/_.?=&-]*)["'`]/gi)].map((m) => m[1]))].slice(0, 12);
    console.log(`  ${u.split("/").pop()} ${b.s} ${b.b.length}b apis: ${apis.join("  ") || "-"}`);
    for (const k of ["streaming_url", "filecode", "/api/stream", "op=embed", "sources", "m3u8"]) {
      const i = b.b.indexOf(k);
      if (i > 0) console.log(`     "${k}":`, b.b.slice(Math.max(0, i - 120), i + 160).replace(/\s+/g, " "));
    }
  }
  const inline = [...r.b.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((s) => /api|stream|fetch|filecode/i.test(s));
  inline.slice(0, 2).forEach((s) => console.log("  inline:", s.replace(/\s+/g, " ").slice(0, 300)));
}
