const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const h = await (await fetch("https://jkanime.net/", { headers: { "User-Agent": UA } })).text();
console.log("len", h.length);
console.log("anime__item:", (h.match(/anime__item/g)||[]).length, "toplist:", (h.match(/toplist/g)||[]).length, "epitem:", (h.match(/epitem|ep-item|ultimos/gi)||[]).length);
const i = h.indexOf("anime__item");
console.log("ctx:", h.slice(Math.max(0,i-260), i+420).replace(/\s+/g," "));
console.log("\nh2/h4:", [...h.matchAll(/<h[24][^>]*>([\s\S]*?)<\/h[24]>/gi)].map(m=>m[1].replace(/<[^>]*>/g,"").trim()).slice(0,14));
