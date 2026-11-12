const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const cands = [
  "/pelicula/the-floaters", "/movie/the-floaters", "/movies/the-floaters",
  "/pelicula/1238735/the-floaters", "/titulo/the-floaters", "/ver-pelicula/the-floaters",
  "/movies/1238735", "/pelicula/1238735",
];
for (const c of cands) {
  const r = await fetch("https://wv3.cuevana3.eu" + c, { headers: H, redirect: "manual" });
  console.log(c.padEnd(34), r.status);
}
const s = await fetch("https://wv3.cuevana3.eu/peliculas", { headers: H });
const b = await s.text();
const hrefs = [...new Set([...b.matchAll(/href="(\/[^"#?]{2,90})"/g)].map(m => m[1]))].filter(u => !/^\/_next|\.(png|ico|webmanifest|svg|css|js)/.test(u));
console.log("\n/peliculas hrefs:", hrefs.slice(0, 20));
