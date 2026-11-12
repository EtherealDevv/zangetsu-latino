// Tudorama: cuerpo completo de los envoltorios latinos (cómo montan el iframe).
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
const epUrl = BASE + "/ver/mi-adorable-demonio-s1x1/";
const ep = await get(epUrl);
const nonce = (ep.b.match(/nonce["']?\s*[:=]\s*["']([a-z0-9]{6,})["']/i) || [])[1];
const id = (ep.b.match(/(?:post_id|data-id)["']?\s*[:=]\s*["']?(\d{3,})/i) || [])[1];
const list = JSON.parse(await ajax({ action: "corvus_get_servers", nonce, post_id: id }, epUrl));
for (const s of list.filter((x) => x.lang === "es")) {
  const w = await get(s.url, { referer: epUrl });
  console.log(`\n================ ${s.name} ${w.s} -> ${w.u}`);
  console.log(w.b.slice(w.b.indexOf("<body")).replace(/\s+/g, " ").slice(0, 1400));
}
