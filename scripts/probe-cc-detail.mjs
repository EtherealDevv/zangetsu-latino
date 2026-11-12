const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const h = await (await fetch("https://www.cinecalidad.am/ver-pelicula/madre-siniestra/", { headers: { "User-Agent": UA } })).text();
console.log("h1s:", [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1].replace(/\s+/g, " ").trim()));
console.log("og:title:", (h.match(/og:title" content="([^"]+)"/) || [])[1]);
console.log("alignnone:", (h.match(/<img[^>]*alignnone[^>]*>/i) || [])[0]);
console.log("poster:", (h.match(/<div class="poster">[\s\S]{0,300}/i) || [])[0]?.replace(/\s+/g, " ").slice(0, 300));
console.log("desc:", (h.match(/<meta name="description" content="([^"]*)"/) || [])[1]);
console.log("generos:", [...h.matchAll(/href="[^"]*\/genero\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => m[1].trim()).slice(0, 6));
console.log("year/date:", (h.match(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)/i) || [])[1]);
