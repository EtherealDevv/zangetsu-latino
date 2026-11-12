// Tudorama: bloque de tarjeta en listados y en el home.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u) => {
  const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", accept: "text/html" }, signal: AbortSignal.timeout(20000) });
  return { s: r.status, b: await r.text() };
};
for (const [tag, u] of [["listado", "https://tudorama.com/genero/series/"], ["home", "https://tudorama.com/"], ["busqueda", "https://tudorama.com/?s=goblin"], ["peliculas", "https://tudorama.com/genero/peliculas/"]]) {
  const r = await get(u);
  const i = r.b.indexOf("/serie/") > 0 && tag !== "peliculas" ? r.b.indexOf("/serie/") : r.b.indexOf("/pelicula/");
  console.log(`\n===== ${tag} (${r.s} ${r.b.length}b) @${i}`);
  console.log(r.b.slice(Math.max(0, i - 700), i + 700).replace(/\s+/g, " "));
}
