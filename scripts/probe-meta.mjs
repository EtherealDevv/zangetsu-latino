const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

console.log("### magistv24 generos");
const m = await get("https://magistv24.com/pelicula/proyecto-almanac/");
const g = [...new Set([...m.b.matchAll(/<a[^>]*href="([^"]*genero[^"]*)"[^>]*>([\s\S]{0,60}?)<\/a>/gi)].map((x) => x[1] + " -> " + x[2].replace(/<[^>]+>/g, "").trim()))];
console.log(g.slice(0, 6).join("\n  ") || "-");
const meta = [...new Set([...m.b.matchAll(/<span class="(?:genres?|[a-z-]*categor[a-z-]*)"[^>]*>([\s\S]{0,120}?)<\/span>/gi)].map((x) => x[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()))];
console.log("span generos:", meta.join(" | ") || "-");

console.log("\n### gnulahd generos/ano en detalle");
const gd = await get("https://ww3.gnulahd.nu/ver/godzilla-minus-zero/");
const ld = (gd.b.match(/<script type="application\/ld\+json">([\s\S]{0,1200}?)<\/script>/gi) || [])[0] || "";
console.log(ld.replace(/\s+/g, " ").slice(0, 900));
const h1 = (gd.b.match(/<h1[^>]*>([\s\S]{0,120}?)<\/h1>/i) || [])[1] || "";
console.log("\nh1:", h1.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
const ogd = (gd.b.match(/property="og:description" content="([^"]*)"/i) || [])[1] || "";
console.log("og:desc:", ogd.slice(0, 200));
