const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const get = async (u) => (await fetch(u, { headers: { "User-Agent": UA } })).text();

const h = await get("https://www.cinecalidad.am/ver-pelicula/madre-siniestra/");
for (const id of ["info", "sinopsis", "argumento"]) {
  const m = h.match(new RegExp(`id="${id}"[\\s\\S]{0,400}`, "i"));
  if (m) console.log(id, "->", m[0].replace(/\s+/g, " ").slice(0, 300));
}
console.log("\nwp-content:", (h.match(/<div[^>]*class="[^"]*wp-content[^"]*"[^>]*>([\s\S]{0,300})/i) || [])[1]?.replace(/\s+/g, " "));
console.log("\n.tab-content/desc:", (h.match(/class="[^"]*(?:desc|synopsis|story)[^"]*"[^>]*>([\s\S]{0,260})/i) || [])[1]?.replace(/\s+/g, " "));

const ep = await get("https://www.cinecalidad.am/ver-el-episodio/naruto-shippuden-12x243/");
console.log("\nep options:", [...ep.matchAll(/data-option="([^"]+)"/g)].map((m) => m[1]));
console.log("ep title h1:", [...ep.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1].replace(/\s+/g, " ").trim()));
