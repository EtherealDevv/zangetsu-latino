// abyssplayer: el script que carga y el config (videoId/servers).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const r = await get("https://abyssplayer.com/OGPX8GIZQ", { referer: "https://cdn.tudorama.com/" });
const inline = [...r.b.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
const j = inline.find((x) => /loadScript/.test(x)) || "";
console.log("js len", j.length);
console.log(j.replace(/\s+/g, " ").slice(1200, 5000).replace(/;/g, ";\n"));
const srcs = [...new Set([...r.b.matchAll(/["'](https?:\/\/[^"']+\.js[^"']*)["']/gi)].map((m) => m[1]))];
console.log("\njs externos:", srcs.join("  ") || "-");
for (const s of srcs.slice(0, 2)) {
  const b = await get(s, { referer: r.u });
  console.log(`\n${s} ${b.s} ${b.b.length}b`);
  const dirs = b.b.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/gi) || [];
  console.log("  directos:", dirs.slice(0, 3).join("  ") || "-");
  for (const k of ["m3u8", "videoId", "/api/", "getVideo", "source"]) {
    const i = b.b.indexOf(k);
    if (i > 0) console.log(`  [${k}]`, b.b.slice(Math.max(0, i - 150), i + 200).replace(/\s+/g, " "));
  }
}
