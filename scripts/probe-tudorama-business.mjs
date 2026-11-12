// tudorama: existe "Business Proposal"? sitemap + buscador con variantes.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = "https://tudorama.com";
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9" }, signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text() };
  } catch (e) { return { s: 0, b: "" }; }
};

for (const q of ["business", "proposal", "propuesta", "negocios", "oficina"]) {
  const r = await get(H + "/?s=" + encodeURIComponent(q));
  const n = r.b.split(/<article class="ipst/).length - 1;
  const first = (r.b.split(/<article class="ipst/)[1] || "").split("</article>")[0];
  const t = (first.match(/class="ipst__title"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i) || [])[1] || "";
  const href = (first.match(/href="(https?:\/\/tudorama\.com\/(?:serie|pelicula)\/[^"]+)"/i) || [])[1] || "";
  console.log(`?s=${q} -> ${r.s} ${n} tarjetas | ${t.replace(/<[^>]*>/g, "").trim().slice(0, 60)} | ${href}`);
}

for (const slug of ["business-proposal", "a-business-proposal", "una-propuesta-de-negocios", "propuesta-de-negocios", "business-proposal-kdrama"]) {
  for (const base of ["serie", "pelicula"]) {
    const r = await get(`${H}/${base}/${slug}/`);
    const h1 = (r.b.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "";
    console.log(`${base}/${slug} -> ${r.s} | ${h1.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 60)}`);
  }
}

// sitemap: catalogo completo de slugs
for (const u of ["/sitemap_index.xml", "/wp-sitemap.xml", "/sitemap.xml"]) {
  const r = await get(H + u);
  console.log(`\n${u} -> ${r.s} ${r.b.length}b`);
  if (r.s === 200) {
    const locs = [...r.b.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    console.log("  locs:", locs.slice(0, 8).join("\n        "));
    // si es indice, entrar al de series
    const serie = locs.find((l) => /serie|post|tv/i.test(l)) || locs[0];
    if (serie && /\.xml/.test(serie)) {
      const s2 = await get(serie);
      const l2 = [...s2.b.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      console.log(`  ${serie} -> ${s2.s} ${l2.length} locs`);
      console.log("   ", l2.slice(0, 6).join("\n    "));
      const hit = l2.filter((l) => /business|proposal|propuesta/i.test(l));
      console.log("  match business/proposal:", hit.slice(0, 6).join(" ") || "(ninguno)");
    }
  }
}
