const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const pg = await (await fetch("https://jkanime.net/one-piece/1180/", { headers: { "User-Agent": UA } })).text();
const src = (pg.match(/<iframe[^>]*src="(https:\/\/jkanime\.net\/jkplayer\/[^"]+)"/) || [])[1];
console.log("player:", src && src.slice(0, 90));
for (const u of [src, "https://jkanime.net/jkplayer/c1?u=https://hgcloud.to/e/pwy57408jvhj&s=streamwish"]) {
  if (!u) continue;
  const r = await fetch(u, { headers: { "User-Agent": UA, Referer: "https://jkanime.net/one-piece/1180/", "Accept-Language": "es-419,es;q=0.9" } });
  const b = await r.text();
  console.log("\n==", u.slice(0, 80), r.status, r.url.slice(0, 90), b.length);
  console.log(" m3u8:", (b.match(/https?:[^"'\\ ]+\.m3u8[^"'\\ ]*/g) || []).slice(0, 2));
  console.log(" mp4:", (b.match(/https?:[^"'\\ ]+\.mp4[^"'\\ ]*/g) || []).slice(0, 2));
  console.log(" iframe:", (b.match(/<iframe[^>]*src="([^"]+)"/) || [])[1]);
  console.log(" head:", b.replace(/\s+/g, " ").slice(0, 300));
}
