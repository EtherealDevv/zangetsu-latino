const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try { const r = await fetch(u, { headers: { ...H, ...(extra||{}) }, redirect: "follow", signal: AbortSignal.timeout(18000) }); return { s: r.status, u: r.url, b: await r.text() }; }
  catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};
const g = await get("https://ww3.gnulahd.nu/ver/godzilla-minus-zero/");
const i = g.b.indexOf("function gnrdUnpack");
console.log("=== gnrdUnpack ===");
console.log(g.b.slice(i, i + 900).replace(/\s+/g, " "));
const f = await get("https://fastream.to/embed-75qx4isw4dff.html", { Referer: "https://magistv24.com/" });
console.log("\n=== fastream", f.s, f.b.length, "b ===");
console.log(f.b.replace(/\s+/g, " ").slice(0, 1400));
