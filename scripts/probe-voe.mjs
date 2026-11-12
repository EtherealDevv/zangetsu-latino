// What does Voe actually return from this network? Print the page verbatim.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const url = "https://voe.sx/e/lhvwq83jid0h";
const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9", "Accept": "text/html,application/xhtml+xml" }, redirect: "follow" });
console.log("status", r.status, "final", r.url);
const b = await r.text();
console.log("len", b.length);
console.log("--- body ---");
console.log(b.slice(0, 3000));
console.log("--- set-cookie ---");
try { console.log(r.headers.getSetCookie ? r.headers.getSetCookie().join("\n") : r.headers.get("set-cookie")); } catch (e) { console.log(String(e)); }
