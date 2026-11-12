const u = "https://monoschinos.st/ajax/ajax_pagination/6340";
const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135", "X-Requested-With": "XMLHttpRequest", "Referer": "https://monoschinos.st/anime/to-aru-anbu-no-item-sub-espanol" } });
console.log("status", r.status, r.headers.get("content-type"));
const h = await r.text();
console.log("len", h.length);
console.log(h.slice(0, 1600));
