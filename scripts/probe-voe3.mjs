const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const r = await fetch("https://susanexpectcare.com/e/lhvwq83jid0h", { headers: { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" } });
const b = await r.text();
console.log(b);
console.log("\n=== COOKIES ===");
console.log(r.headers.getSetCookie ? r.headers.getSetCookie().join("\n") : r.headers.get("set-cookie"));
