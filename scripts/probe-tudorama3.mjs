// Tudorama: la página /ver/ de un episodio trae su propio post_id y nonce.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const BASE = "https://tudorama.com";
const H = { "user-agent": UA, "accept-language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, "accept": "text/html,*/*", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};

const url = BASE + "/ver/make-me-tingle-s1x1/";
const p = await get(url);
console.log("ver", p.s, p.b.length + "b", p.u);
const nonces = [...new Set([...p.b.matchAll(/nonce["']?\s*[:=]\s*["']([a-z0-9]{6,})["']/gi)].map((m) => m[1]))];
const ids = [...new Set([...p.b.matchAll(/(?:post_id|data-id|data-post)["']?\s*[:=]\s*["']?(\d{3,})/gi)].map((m) => m[1]))];
console.log("nonces:", nonces.join(" "), "| ids:", ids.join(" "));
const i = p.b.search(/corvus|data-player|video-player|embed/i);
console.log("\nctx:", i > 0 ? p.b.slice(Math.max(0, i - 400), i + 1200).replace(/\s+/g, " ").slice(0, 1500) : "-");

const post = async (fields, tag) => {
  const r = await fetch(BASE + "/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: { ...H, "content-type": "application/x-www-form-urlencoded", origin: BASE, referer: url, "x-requested-with": "XMLHttpRequest", accept: "application/json, text/javascript, */*; q=0.01" },
    body: new URLSearchParams(fields).toString(), signal: AbortSignal.timeout(20000)
  });
  const t = await r.text();
  console.log(`\n[${tag}] ${r.status} ${t.length}b: ${t.replace(/\s+/g, " ").slice(0, 700)}`);
};
for (const n of nonces.slice(0, 2)) for (const id of ids.slice(0, 3)) {
  await post({ action: "corvus_get_servers", nonce: n, post_id: id }, `nonce ${n.slice(0, 6)} id ${id}`);
}
