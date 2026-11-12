// Tudorama: qué entrega el envoltorio cdn.tudorama.com/stream/... y qué servidores latinos hay.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const BASE = "https://tudorama.com";
const H = { "user-agent": UA, "accept-language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, "accept": "text/html,*/*", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const ajax = async (url, fields) => {
  const r = await fetch(BASE + "/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: { ...H, "content-type": "application/x-www-form-urlencoded", origin: BASE, referer: url, "x-requested-with": "XMLHttpRequest", accept: "application/json, text/javascript, */*; q=0.01" },
    body: new URLSearchParams(fields).toString(), signal: AbortSignal.timeout(20000)
  });
  return await r.text();
};

const epUrl = BASE + "/ver/make-me-tingle-s1x1/";
const p = await get(epUrl);
const nonce = (p.b.match(/nonce["']?\s*[:=]\s*["']([a-z0-9]{6,})["']/i) || [])[1];
const id = (p.b.match(/(?:post_id|data-id)["']?\s*[:=]\s*["']?(\d{3,})/i) || [])[1];
const raw = await ajax(epUrl, { action: "corvus_get_servers", nonce, post_id: id });
let list = [];
try { list = JSON.parse(raw); } catch {}
console.log("servidores del episodio:", list.length);
for (const s of list) console.log("  ", s.lang, s.type, s.name, "->", s.url.slice(0, 90));

console.log("\n### envoltorios");
for (const s of list.slice(0, 3)) {
  const r = await get(s.url, { referer: epUrl });
  console.log(`\n${s.name} ${r.s} ${r.b.length}b -> ${r.u.slice(0, 80)}`);
  const emb = [...new Set([...r.b.matchAll(/(?:src|url|embed|file)\s*[:=]\s*["']([^"']{10,120})["']/gi)].map((m) => m[1]))].slice(0, 5);
  console.log("  refs:", emb.join("\n        ") || "-");
  const dir = r.b.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/gi) || [];
  console.log("  directos:", dir.slice(0, 2).join("  ") || "-");
  if (r.b.length < 3000) console.log("  body:", r.b.replace(/\s+/g, " ").slice(0, 500));
}
