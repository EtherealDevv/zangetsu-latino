// vidara.to / streamwish family: POST /api/stream {filecode} -> streaming_url
const UA = "Mozilla/5.0 (Linux; Android 14; SM-G990B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Mobile Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9", "Content-Type": "application/json", "Origin": "https://vidara.to", "Referer": "https://vidara.to/" };
const embed = process.argv[2] || "https://vidara.to/e/Yf1BfKUc0oMjG";
const u = new URL(embed);
const filecode = u.pathname.split("/").filter(Boolean).pop();
const body = JSON.stringify({ filecode, device: "android", codecs: { av1: "av01.0.09M.10", h265: "hvc1.1.6.L123.B0" } });
const r = await fetch(`${u.origin}/api/stream`, { method: "POST", headers: { ...H, "Origin": u.origin, "Referer": `${u.origin}/e/${filecode}` }, body });
console.log("status", r.status, r.headers.get("content-type"));
const t = await r.text();
console.log("len", t.length);
console.log(t.slice(0, 900));
