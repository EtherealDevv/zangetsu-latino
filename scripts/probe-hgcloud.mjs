// hgcloud (streamwish): qué hace main.js con el filecode.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const m = await get("https://hgcloud.to/main.js?v=1.1.9", { referer: "https://hgcloud.to/e/se94hav1950j" });
console.log("main.js", m.s, m.b.length + "b");
console.log(m.b.replace(/\s+/g, " ").slice(0, 2000));
const apis = [...new Set([...m.b.matchAll(/["'`](\/[a-z0-9/_.-]{2,40})["'`]/gi)].map((x) => x[1]))];
console.log("\nrutas:", apis.join("  "));
const urls = [...new Set([...m.b.matchAll(/https?:\/\/[a-z0-9.-]+[a-z0-9/_.-]*/gi)].map((x) => x[0]))];
console.log("urls:", urls.join("  "));
