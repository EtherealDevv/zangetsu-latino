// voe.sx: el host real de hoy y su payload.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const a = await get("https://voe.sx/e/mwbpei0wt18t", { referer: "https://doramasflix.in/" });
const next = (a.b.match(/window\.location\.href\s*=\s*'([^']+)'/) || [])[1] || "";
console.log("voe -> ", next);
const b = await get(next || "https://susanexpectcare.com/e/mwbpei0wt18t", { referer: a.u });
console.log("real page", b.s, b.b.length + "b", b.u);
const scripts = [...b.b.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((s) => s.trim().length > 30);
console.log("scripts:", scripts.length);
scripts.forEach((s, i) => console.log(`--[${i}] len=${s.length}--`, s.replace(/\s+/g, " ").slice(0, 700)));
const dirs = b.b.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/gi) || [];
console.log("dirs:", dirs.slice(0, 3).join("\n  ") || "-");
