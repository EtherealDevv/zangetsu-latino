const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const get = async (u) => {
  const r = await fetch(u, { headers: { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" } });
  return await r.text();
};

const movie = await get("https://www.cinecalidad.am/ver-pelicula/madre-siniestra/");
const li = [...movie.matchAll(/<li[^>]*dooplay_player_option[^>]*>/g)].map((m) => m[0]);
console.log("movie player options:", li.length);
console.log(li.slice(0, 3).join("\n"));
const opt = [...movie.matchAll(/data-option="([^"]+)"/g)].map((m) => m[1]);
console.log("data-option:", opt.slice(0, 4));

const serie = await get("https://www.cinecalidad.am/ver-serie/naruto-shippuden/");
console.log("\nserie len", serie.length);
console.log("episode links:", [...serie.matchAll(/href="([^"]*ver-serie[^"]*)"/g)].map((m) => m[1]).slice(0, 8));
console.log("h1:", (serie.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]);
console.log("cards:", (serie.match(/<article[^>]*class="[^"]*item[^"]*"/g) || []).length);
const eps = [...serie.matchAll(/<div class="numerando">([\s\S]*?)<\/div>/g)].map((m) => m[1].trim()).slice(0, 5);
console.log("numerando:", eps);
