// tudorama: que lleva una tarjeta (title vs alt) y como responde el buscador.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u) => {
  const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9" }, signal: AbortSignal.timeout(20000) });
  return { s: r.status, b: await r.text(), u: r.url };
};

for (const q of ["en tu mejor momento", "in your radiant season", "the squid game", "squid game", "goblin"]) {
  const r = await get("https://tudorama.com/?s=" + encodeURIComponent(q));
  const cards = r.b.split(/<article class="ipst/).length - 1;
  const first = (r.b.split(/<article class="ipst/)[1] || "").split("</article>")[0];
  const t = (first.match(/class="ipst__title"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i) || [])[1] || "";
  const alt = (first.match(/alt="([^"]*)"/i) || [])[1] || "";
  console.log(`\n"${q}" -> ${r.s} ${cards} tarjetas`);
  console.log(`   title: ${t.replace(/<[^>]*>/g, "").trim().slice(0, 70)} | alt: ${alt.slice(0, 70)}`);
}

const tr = async (q, tl) => {
  const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(q)}`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15000) });
  const j = JSON.parse(await r.text());
  return (j[0] || []).map((s) => s[0]).join("");
};
for (const [q, tl] of [["El juego del calamar", "en"], ["In Your Radiant Season", "es"], ["Cásate con mi esposo", "en"]]) {
  try { console.log(`\ntr(${q})->${tl}:`, await tr(q, tl)); } catch (e) { console.log("\ntr ERR", String(e.message).slice(0, 50)); }
}
