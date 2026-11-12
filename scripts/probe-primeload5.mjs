// Primeload: ¿el m3u8 se abre con las cookies del embed/sesión?
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
let jar = {};
const jarStr = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
const get = async (u, extra) => {
  const h = { "user-agent": UA, "accept-language": "es-419,es;q=0.9" };
  if (Object.keys(jar).length) h.cookie = jarStr();
  for (const k in extra || {}) h[k] = extra[k];
  try {
    const r = await fetch(u, { headers: h, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    for (const c of sc) { const kv = c.split(";")[0]; const i = kv.indexOf("="); if (i > 0) jar[kv.slice(0, i)] = kv.slice(i + 1); }
    return { s: r.status, b: await r.text(), u: r.url, sc };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};

const ID = "R8dCbP0C8cFX";
const e1 = await get(`https://primeload.co/embed/${ID}`, { referer: "https://doramasflix.in/" });
console.log("embed", e1.s, "cookies:", JSON.stringify(e1.sc || []), "jar:", JSON.stringify(jar));
const e2 = await get(`https://primeload.co/player/${ID}?ref=https%3A%2F%2Fdoramasflix.in%2F`, { referer: `https://primeload.co/embed/${ID}` });
console.log("player", e2.s, "cookies:", JSON.stringify(e2.sc || []), "jar:", JSON.stringify(jar));
const api = await get(`https://primeload.co/api/v1/player/${ID}`, { referer: `https://primeload.co/player/${ID}` });
let j = {}; try { j = JSON.parse(api.b); } catch {}
const master = j.master_manifest || (j.sources && j.sources[0] && j.sources[0].src) || "";
console.log("api", api.s, "master:", master);
if (master) {
  const m = await get(master, { referer: `https://primeload.co/player/${ID}` });
  console.log("m3u8", m.s, m.b.length + "b", /#EXTM3U/.test(m.b) ? "EXTM3U OK" : m.b.slice(0, 80));
  // variantes del token
  const tries = [
    `?token=${j.token || ""}`,
    `?st=${j.token || ""}`,
    `?sig=${j.signature || ""}`,
    `?expires=${j.expires || ""}`
  ].filter((q) => !q.endsWith("="));
  for (const q of tries) {
    const t = await get(master + q, { referer: "https://primeload.co/" });
    console.log(`  ${q.slice(0, 24)} -> ${t.s} ${t.b.slice(0, 40)}`);
  }
}
console.log("\nclaves del json:", Object.keys(j).join(" "));
console.log("json:", JSON.stringify(j).slice(0, 400));
