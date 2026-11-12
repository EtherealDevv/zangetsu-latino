// Primeload: el cuerpo de la clase de sesión (socket/auth) y cómo firma el m3u8.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const r = await fetch("https://primeload.co/player-dist/assets/index-d_Oc1EoW.js", { headers: { "user-agent": UA, referer: "https://primeload.co/" }, signal: AbortSignal.timeout(30000) });
const b = await r.text();
console.log("bundle", r.status, b.length + "b");

const at = b.indexOf("_sessionId=``");
console.log("\n=== clase sesión ===");
console.log(b.slice(Math.max(0, at - 400), at + 5200).replace(/\s+/g, " "));
