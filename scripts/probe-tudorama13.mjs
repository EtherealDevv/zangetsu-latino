// Tudorama: ficha de película (¿/ver/ y AJAX directo?).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const BASE = "https://tudorama.com";
const url = BASE + "/pelicula/colony/";
const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html", "accept-language": "es-419,es;q=0.9" }, signal: AbortSignal.timeout(20000) });
const b = await r.text();
console.log(r.status, b.length + "b");
const ver = [...new Set([...b.matchAll(/href="(https:\/\/tudorama\.com\/ver\/[^"]+)"/g)].map((m) => m[1]))];
console.log("ver:", ver.join(" ") || "-");
const nonce = (b.match(/nonce["']?\s*[:=]\s*["']([a-z0-9]{6,})["']/i) || [])[1];
const id = (b.match(/(?:post_id|data-id)["']?\s*[:=]\s*["']?(\d{3,})/i) || [])[1];
console.log("nonce", nonce, "id", id);
if (nonce && id) {
  const a = await fetch(BASE + "/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded", origin: BASE, referer: url, "x-requested-with": "XMLHttpRequest" },
    body: new URLSearchParams({ action: "corvus_get_servers", nonce, post_id: id }).toString(),
    signal: AbortSignal.timeout(20000)
  });
  console.log("ajax", a.status, (await a.text()).slice(0, 500));
}
const eps = [...new Set([...b.matchAll(/data-episode="(\d+)"/g)].map((m) => m[1]))];
console.log("data-episode:", eps.join(" ") || "-");
const h1 = (b.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "";
console.log("h1:", h1.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80));
const og = (k) => (b.match(new RegExp('property="' + k + '"[^>]*content="([^"]*)"')) || [])[1] || "-";
console.log("og:image:", og("og:image").slice(0, 90));
console.log("og:desc:", og("og:description").slice(0, 120));
