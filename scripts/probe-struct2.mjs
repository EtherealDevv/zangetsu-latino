const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => { try { const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(25000) }); return { s: r.status, u: r.url, b: await r.text() }; } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; } };

// 1) magistv24: cómo vienen los enlaces del buscador
const ms = await get("https://magistv24.com/?s=naruto");
const all = [...new Set([...ms.b.matchAll(/href="([^"]+)"/gi)].map(m => m[1]))];
console.log("magistv search links con pelicula/serie:", all.filter(h => /pelicula|serie|capitulo/.test(h)).slice(0, 6).join("\n  "));
const card = ms.b.indexOf("naruto");
console.log("\ncontexto tarjeta:", ms.b.slice(Math.max(0, card - 400), card + 200).replace(/\s+/g, " "));

// 2) magistv24 capítulo: mismo trembed?
const cap = await get("https://magistv24.com/capitulo/los-simpson-temporada-1-capitulo-1/");
console.log("\ncapítulo:", cap.s, cap.b.length + "b");
console.log("  embeds:", [...new Set([...cap.b.matchAll(/trembed=\d+&#0?38;trid=\d+&trtype=\d+/g)].map(m => m[0]))].join(" | ") || "ninguno");

// 3) gnulahd: patrón de episodios en la página de serie
const gs = await get("https://ww3.gnulahd.nu/ver/los-simpson/");
const gl = [...new Set([...gs.b.matchAll(/href="([^"]+)"/gi)].map(m => m[1]))];
console.log("\ngnulahd los-simpson:", gs.s, gs.b.length + "b", "| hrefs:", gl.length);
console.log("  con capitulo/episodio/temporada:", gl.filter(h => /capitulo|episodio|temporada/i.test(h)).slice(0, 6).join("\n    "));
const pidCount = (gs.b.match(/_gnrdPid/g) || []).length;
console.log("  _gnrdPid en la página:", pidCount);
console.log("  sample hrefs:", gl.slice(0, 10).join("  "));
