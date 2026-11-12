const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const get = async (u) => (await fetch(u, { headers: { "User-Agent": UA } })).text();

const top = await get("https://jkanime.net/top");
const tparts = top.split(/class="toplist"/i);
console.log("top toplist blocks:", tparts.length - 1);
console.log(tparts[1]?.replace(/\s+/g, " ").slice(0, 700));

const s = await get("https://jkanime.net/buscar/naruto");
const sparts = s.split(/class="anime__item"/i);
console.log("\nsearch items:", sparts.length - 1);
console.log(sparts[1]?.replace(/\s+/g, " ").slice(0, 700));

const d = await get("https://jkanime.net/one-piece/");
console.log("\n-- info:");
console.log((d.match(/<div class="anime_info"[\s\S]{0,600}/) || [])[0]?.replace(/\s+/g, " ").slice(0, 600));
console.log("\n-- uep:", (d.match(/id="uep"[^>]*>/) || [])[0]);
console.log("-- h3:", (d.match(/<div class="anime_info">\s*<h3>([\s\S]*?)<\/h3>/) || [])[1]);
console.log("-- pic:", (d.match(/class="anime_pic"[\s\S]{0,240}/) || [])[0]?.replace(/\s+/g, " "));
console.log("-- desc:", (d.match(/<p class="scroll">([\s\S]*?)<\/p>/) || [])[1]?.replace(/\s+/g, " ").slice(0, 200));
console.log("-- ep links sample:", [...new Set([...d.matchAll(/href="(https:\/\/jkanime\.net\/[^"\/]+\/\d+\/?)"/g)].map((m) => m[1]))].slice(0, 5));
