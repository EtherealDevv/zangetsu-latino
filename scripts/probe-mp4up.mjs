const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const u = "https://www.mp4upload.com/embed-ij6mwvocnz4g.html";
const r = await fetch(u, { headers: { "User-Agent": UA, "Referer": "https://monoschinos.st/" } });
const b = await r.text();
console.log("status", r.status, "len", b.length);
const i = b.indexOf("player.src");
console.log("player.src ctx:", b.slice(Math.max(0,i-100), i+320).replace(/\s+/g," "));
console.log("\nmp4 hits:", (b.match(/https?:\/\/[^"'\\\s]+\.mp4[^"'\\\s]*/g) || []).slice(0,4));
