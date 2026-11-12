// tudorama: el slug de la URL es el titulo original; probar lookup directo.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u) => {
  const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9" }, signal: AbortSignal.timeout(20000) });
  return { s: r.status, b: await r.text() };
};
for (const slug of ["in-your-radiant-season", "marry-my-husband", "the-glory", "my-name", "zzz-nope-xyz"]) {
  for (const base of ["serie", "pelicula"]) {
    const r = await get(`https://tudorama.com/${base}/${slug}/`);
    const t = (r.b.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "";
    const h1 = (r.b.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "";
    const clean = (s) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 70);
    console.log(`${base}/${slug} -> ${r.s} | title: ${clean(t)} | h1: ${clean(h1)}`);
  }
}
