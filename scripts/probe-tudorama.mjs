// Tudorama: el contenedor del reproductor y el AJAX corvus_get_servers bien armado.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = { "user-agent": UA, "accept-language": "es-419,es;q=0.9", "accept": "text/html,application/xhtml+xml,*/*" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};

const url = "https://tudorama.com/serie/make-me-tingle/";
const page = await get(url);
console.log("serie", page.s, page.b.length + "b", page.u);

// atributos data-* sospechosos de montar el reproductor
const datas = [...new Set([...page.b.matchAll(/data-[a-z0-9_-]+="[^"]{1,60}"/gi)].map((m) => m[0]))];
console.log("\ndata-* únicos:", datas.length);
const interesting = datas.filter((d) => /corv|player|video|epis|season|post|nonce|token|server|embed/i.test(d));
console.log(interesting.slice(0, 25).join("\n  ") || "-");

// el bloque de opciones JS (corvutils / corvus)
const i = page.b.search(/corvutils|corvus/i);
console.log("\nprimer corvus en el HTML @", i);
if (i > 0) console.log(page.b.slice(Math.max(0, i - 500), i + 1500).replace(/\s+/g, " ").slice(0, 1800));

const nonces = [...new Set([...page.b.matchAll(/nonce["']?\s*[:=]\s*["']([a-z0-9]{6,})["']/gi)].map((m) => m[1]))];
console.log("\nnonces:", nonces.join(" ") || "-");
const posts = [...new Set([...page.b.matchAll(/(?:post_id|data-post|data-id)["']?\s*[:=]\s*["']?(\d{2,})/gi)].map((m) => m[1]))];
console.log("ids:", posts.slice(0, 10).join(" ") || "-");
