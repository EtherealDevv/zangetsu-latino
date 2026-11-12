// Tudorama latino: envoltorio -> host real -> resolver. Foco en abyss, streamhg, earnvids, pixeldrain.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const BASE = "https://tudorama.com";
const H = { "user-agent": UA, "accept-language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, "accept": "text/html,*/*", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const ajax = async (fields, ref) => {
  const r = await fetch(BASE + "/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: { ...H, "content-type": "application/x-www-form-urlencoded", origin: BASE, referer: ref, "x-requested-with": "XMLHttpRequest", accept: "application/json, text/javascript, */*; q=0.01" },
    body: new URLSearchParams(fields).toString(), signal: AbortSignal.timeout(20000)
  });
  return await r.text();
};

async function servers(epUrl) {
  const ep = await get(epUrl);
  const nonce = (ep.b.match(/nonce["']?\s*[:=]\s*["']([a-z0-9]{6,})["']/i) || [])[1];
  const id = (ep.b.match(/(?:post_id|data-id)["']?\s*[:=]\s*["']?(\d{3,})/i) || [])[1];
  if (!nonce || !id) return { ep, list: [] };
  try { return { ep, list: JSON.parse(await ajax({ action: "corvus_get_servers", nonce, post_id: id }, epUrl)) }; }
  catch { return { ep, list: [] }; }
}

const epUrl = process.argv[2] || BASE + "/ver/mi-adorable-demonio-s1x1/";
console.log("ep:", epUrl);
const { list } = await servers(epUrl);
console.log("servers:", list.map((s) => `${s.lang}/${s.name}`).join("  "));

for (const s of list.filter((x) => x.lang === "es")) {
  const w = await get(s.url, { referer: epUrl });
  const iframe = (w.b.match(/<iframe[^>]*src="([^"]+)"/i) || [])[1] || "";
  console.log(`\n#### ${s.name} -> ${iframe || "(sin iframe)"}  [${w.s} ${w.b.length}b]`);
  if (!iframe) { console.log("   ", w.b.replace(/\s+/g, " ").slice(0, 300)); continue; }
  const host = new URL(iframe).host;
  const r = await get(iframe, { referer: s.url });
  console.log("   page", r.s, r.b.length + "b ->", r.u.slice(0, 90));
  const dirs = r.b.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/gi) || [];
  console.log("   directos:", dirs.slice(0, 3).join("  ") || "-");
  const inline = [...r.b.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((x) => x.trim().length > 20);
  inline.slice(0, 2).forEach((x, i) => console.log(`   [js${i}] ${x.replace(/\s+/g, " ").slice(0, 500)}`));
  const js = [...new Set([...r.b.matchAll(/<script[^>]*src="([^"]+)"/gi)].map((m) => m[1]))].filter((x) => !/ads|analytic|gtag|jquery|polyfill|html5shiv|ima3/i.test(x));
  console.log("   js:", js.slice(0, 3).join("  ") || "-");

  if (/pixeldrain/.test(host)) {
    const id = iframe.split("/").filter(Boolean).pop();
    const api = await get(`https://pixeldrain.com/api/file/${id}?download`, { referer: "https://pixeldrain.com/" });
    console.log("   pixeldrain api", api.s, api.b.length + "b", api.b.slice(0, 80).replace(/\s+/g, " "));
  }
  if (/streamhg|earnvids|filemoon|byse|voe|susanexpectcare|abyss/.test(host)) {
    const code = iframe.split("?")[0].split("/").filter(Boolean).pop();
    const origin = iframe.match(/^(https?:\/\/[^/]+)/)[1];
    for (const body of [{ filecode: code, device: "android" }, { file_code: code }]) {
      const r2 = await fetch(origin + "/api/stream", {
        method: "POST", headers: { "user-agent": UA, "content-type": "application/json", origin, referer: iframe },
        body: JSON.stringify(body), signal: AbortSignal.timeout(15000)
      });
      const t = await r2.text();
      console.log(`   api/stream ${JSON.stringify(body).slice(0, 24)} -> ${r2.status} ${t.replace(/\s+/g, " ").slice(0, 160)}`);
    }
  }
}
