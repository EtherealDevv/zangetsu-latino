const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) {
    return { s: 0, u, b: "", err: String(e.cause?.code || e.message) };
  }
};

console.log("### magistv24 serie — temporadas");
const s = await get("https://magistv24.com/serie/los-simpson/");
const t = [...s.b.matchAll(/<a[^>]*href="([^"]*(?:temporada|season|\?t=|-t\d)[^"]*)"[^>]*>/gi)].map((m) => m[1]);
console.log("links temporada:", [...new Set(t)].slice(0, 8).join("\n  ") || "-");
const nums = [...s.b.matchAll(/data-(?:season|post|temp)="([^"]*)"/gi)].map((m) => m[0]);
console.log("data attrs:", [...new Set(nums)].slice(0, 8).join("  ") || "-");
const allEps = [...s.b.matchAll(/href="(https:\/\/magistv24\.com\/capitulo\/[^"]+)"/gi)].map((m) => m[1]);
console.log("total capitulo links:", new Set(allEps).size, "| ultimo:", allEps[allEps.length - 1] || "-");

console.log("\n\n### gnulahd serie — episodios");
const g = await get("https://ww3.gnulahd.nu/ver/los-simpson/");
const wj = [...new Set([...g.b.matchAll(/(?:https?:)?[^"'\s]{0,40}wp-json[^"'\s]{0,80}/gi)].map((m) => m[0]))];
console.log("wp-json:", wj.slice(0, 8).join("\n  ") || "-");
const li = [...g.b.matchAll(/<li[^>]*class="[^"]*(?:ep|season|chapter)[^"]*"[^>]*>[\s\S]{0,300}?<\/li>/gi)].slice(0, 3);
for (const l of li) console.log("\n--- li ---\n" + l[0].replace(/\s+/g, " ").slice(0, 400));
const a1 = [...g.b.matchAll(/<a[^>]*href="([^"]+)"[^>]*>\s*(?:Temporada|Episodio|Cap[ií]tulo)[^<]*</gi)].map((m) => m[1]);
console.log("\ntemporada/ep links:", [...new Set(a1)].slice(0, 8).join("\n  ") || "-");
const k = g.b.indexOf("epl-num");
console.log("\nepl-num ctx:", k > 0 ? g.b.slice(Math.max(0, k - 300), k + 700).replace(/\s+/g, " ") : "-");
