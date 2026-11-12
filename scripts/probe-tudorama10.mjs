// abyssplayer (player propio) y reintentos de hgcloud/api.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const BASE = "https://tudorama.com";
const ajax = async (fields, ref) => {
  const r = await fetch(BASE + "/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded", origin: BASE, referer: ref, "x-requested-with": "XMLHttpRequest", accept: "application/json, text/javascript, */*; q=0.01" },
    body: new URLSearchParams(fields).toString(), signal: AbortSignal.timeout(20000)
  });
  return await r.text();
};

const epUrl = BASE + "/ver/in-your-radiant-season-s1x1/";
const ep = await get(epUrl);
const nonce = (ep.b.match(/nonce["']?\s*[:=]\s*["']([a-z0-9]{6,})["']/i) || [])[1];
const id = (ep.b.match(/(?:post_id|data-id)["']?\s*[:=]\s*["']?(\d{3,})/i) || [])[1];
const list = JSON.parse(await ajax({ action: "corvus_get_servers", nonce, post_id: id }, epUrl));
const lat = list.filter((x) => x.lang === "es");
console.log("lat:", lat.map((x) => x.name).join(" | "));
for (const s of lat) {
  const w = await get(s.url, { referer: epUrl });
  const src = (w.b.match(/iframe\.src\s*=\s*"([^"]+)"/) || [])[1] || "";
  console.log(`  ${s.name} -> ${src}`);
  if (!src) continue;
  const r = await get(src, { referer: w.u });
  const inline = [...r.b.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((x) => x.trim().length > 20);
  if (/abyss/.test(src)) {
    console.log("   abyss body:", r.b.replace(/\s+/g, " ").slice(0, 900));
    inline.slice(0, 3).forEach((x, i) => console.log(`   [js${i}] ${x.replace(/\s+/g, " ").slice(0, 700)}`));
  }
}

console.log("\n### hgcloud reintentos");
const fc = "se94hav1950j";
for (let i = 0; i < 4; i++) {
  const r = await fetch("https://hgcloud.to/api/stream", {
    method: "POST",
    headers: { "user-agent": UA, "content-type": "application/json", origin: "https://hgcloud.to", referer: `https://hgcloud.to/e/${fc}`, accept: "*/*" },
    body: JSON.stringify({ filecode: fc, device: "android" }),
    signal: AbortSignal.timeout(15000)
  });
  const t = await r.text();
  console.log(`  #${i} ${r.status} ${t.replace(/\s+/g, " ").slice(0, 120)}`);
}
