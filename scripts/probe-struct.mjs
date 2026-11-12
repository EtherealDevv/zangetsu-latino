// Estructura exacta de gnulahd y magistv24 para escribir los providers:
// home, búsqueda, detalle, episodios.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try { const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(20000) }); return { s: r.status, u: r.url, b: await r.text() }; }
  catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};
const linksIn = (b, re) => [...new Set([...b.matchAll(re)].map((m) => m[1]))].slice(0, 8);
const titles = (b) => [...b.matchAll(/class="[^"]*title[^"]*"[^>]*>([\s\S]{0,120}?)<\//gi)].map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 5);

for (const [name, base] of [["gnulahd", "https://ww3.gnulahd.nu"], ["magistv24", "https://magistv24.com"]]) {
  console.log(`\n############ ${name}`);
  const home = await get(base + "/");
  console.log("home", home.s, home.b.length + "b");
  console.log("  ver:", linksIn(home.b, /href="([^"]*\/ver\/[^"]+)"/gi).join("  "));
  console.log("  pelicula:", linksIn(home.b, /href="([^"]*\/pelicula\/[^"]+)"/gi).join("  "));
  console.log("  serie:", linksIn(home.b, /href="([^"]*\/serie\/[^"]+)"/gi).join("  "));

  const srch = await get(base + "/?s=naruto");
  console.log("search", srch.s, srch.b.length + "b");
  console.log("  hits:", linksIn(srch.b, /href="([^"]*\/ver\/[^"]+|\/pelicula\/[^"]+|\/serie\/[^"]+)"/gi).join("  "));
  console.log("  titles:", titles(srch.b).join(" | "));

  const serieUrl = name === "gnulahd" ? "https://ww3.gnulahd.nu/ver/los-simpson/" : "https://magistv24.com/serie/los-simpson/";
  const serie = await get(serieUrl);
  console.log("serie", serie.s, serie.b.length + "b", serieUrl);
  if (serie.s === 200) {
    console.log("  temporadas:", linksIn(serie.b, /href="([^"]*(?:temporada|season|capitulo)[^"]*)"/gi).join("  "));
    console.log("  js vars:", (serie.b.match(/(?:tmdb_id|poster|_gnrdPid|trid)\s*[:=]\s*["']?[0-9a-z-]+/gi) || []).slice(0, 5).join("  "));
  }
}
