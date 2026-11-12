const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text() };
  } catch (e) { return { s: 0, b: "" }; }
};

for (const q of ["the simpsons", "simpsons", "simpson", "los simpson"]) {
  const m = await get("https://magistv24.com/?s=" + encodeURIComponent(q));
  const cards = [...m.b.matchAll(/<article\b[\s\S]{0,900}?class="entry-title"[^>]*>([\s\S]{0,80}?)<\/(?:h2|h3|div)>/gi)].map((x) => x[1].replace(/<[^>]+>/g, "").trim());
  console.log(`magis "${q}" -> ${cards.length}: ${cards.slice(0, 6).join(" | ")}`);
}
for (const q of ["the simpsons", "simpsons", "simpson"]) {
  const g = await get("https://ww3.gnulahd.nu/?s=" + encodeURIComponent(q));
  const cards = [...g.b.matchAll(/<a class="gnrd-card"[^>]*title="([^"]*)"/gi)].map((x) => x[1]);
  console.log(`gnula "${q}" -> ${cards.length}: ${cards.slice(0, 6).join(" | ")}`);
}
