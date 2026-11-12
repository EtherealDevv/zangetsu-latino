// Primeload: cuerpo real de la clase de sesión (socket + challenge + emisión del m3u8).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const b = await (await fetch("https://primeload.co/player-dist/assets/index-d_Oc1EoW.js", { headers: { "user-agent": UA, referer: "https://primeload.co/" }, signal: AbortSignal.timeout(30000) })).text();
let at = b.indexOf("socket=null");
if (at < 0) at = b.indexOf("_sessionId");
console.log("offset", at);
const seg = b.slice(at - 200, at + 6000).replace(/\s+/g, " ");
console.log(seg);
