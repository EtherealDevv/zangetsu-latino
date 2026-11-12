// Tudorama: contenedor de episodio + AJAX con cabeceras de navegador.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const BASE = "https://tudorama.com";
const H = { "user-agent": UA, "accept-language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, "accept": "text/html,*/*", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};

const page = await get(BASE + "/serie/make-me-tingle/");
const b = page.b;
const i = b.indexOf('data-episode="1"');
console.log("ctx episodio:\n", b.slice(Math.max(0, i - 700), i + 500).replace(/\s+/g, " ").slice(0, 1200));

// todos los bloques que tengan data-episode
const blocks = [...b.matchAll(/<[a-z]+[^>]*data-episode="(\d+)"[^>]*>/gi)].map((m) => m[0]);
console.log("\nbloques:", blocks.length);
blocks.slice(0, 3).forEach((x) => console.log("  ", x.slice(0, 300)));

// AJAX con varias combinaciones
const post = async (fields, tag) => {
  const body = new URLSearchParams(fields).toString();
  const r = await fetch(BASE + "/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: {
      ...H, "content-type": "application/x-www-form-urlencoded",
      "origin": BASE, "referer": BASE + "/serie/make-me-tingle/",
      "x-requested-with": "XMLHttpRequest", "accept": "application/json, text/javascript, */*; q=0.01"
    },
    body, signal: AbortSignal.timeout(20000)
  });
  const t = await r.text();
  console.log(`\n[${tag}] ${r.status} ${t.length}b: ${t.replace(/\s+/g, " ").slice(0, 600)}`);
};
const nonces = ["3044d89d36", "978fe93806"];
for (const n of nonces) {
  await post({ action: "corvus_get_servers", nonce: n, post_id: "8424" }, `nonce ${n} post 8424`);
}
await post({ action: "corvus_get_servers", nonce: nonces[0], post_id: "8424", season: "1", episode: "1" }, "con season/episode");
await post({ action: "corvus_get_servers", nonce: nonces[1], post_id: "8424", season: "1", episode: "1" }, "con season/episode nonce2");
