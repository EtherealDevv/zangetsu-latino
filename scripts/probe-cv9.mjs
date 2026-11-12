const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const r = await fetch("https://player.cuevana3.eu/player.php?h=fXuMjvaiA4iZ_F_4aa6TH6oRvbVv3L4stwgYcAyo3yo-", { headers: { "User-Agent": UA, Referer: "https://wv3.cuevana3.eu/ver-pelicula/the-floaters" } });
const b = await r.text();
console.log("vars:", [...b.matchAll(/var\s+(\w+)\s*=\s*([^;]{0,120})/g)].map(m => m[1] + " = " + m[2].trim()).slice(0, 8));
console.log("\niframe:", (b.match(/<iframe[^>]*>/g) || []).slice(0, 3));
console.log("\nsrc=:", [...new Set([...b.matchAll(/src="([^"]{10,140})"/g)].map(m => m[1]))].slice(0, 8));
const i = b.indexOf("<script");
console.log("\nscripts:", [...b.matchAll(/<script[^>]*>([\s\S]{0,200})/g)].map(m => m[1].replace(/\s+/g," ").slice(0,150)).slice(0, 6));
