const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const r = await fetch("https://susanexpectcare.com/d6908659f95502e1e7b8f06040e6cfd7", { headers: { "User-Agent": UA } });
console.log("status", r.status, r.headers.get("content-type"));
const t = await r.text();
console.log(t.slice(0, 600));
try { const j = JSON.parse(t); const raw = Buffer.from(j.challenge, "base64").toString("utf8"); console.log("\nDECODED:", raw); } catch (e) { console.log("no b64:", e.message); }
