// Los hosts que "fallan": ver el cuerpo exacto y qué pide cada uno.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};

// cuerpos pequeños: qué son en realidad
for (const [host, path] of [
  ["sfastwish.com", "/e/x8k2m1p4q7w9"],
  ["jodwish.com", "/e/x8k2m1p4q7w9"],
  ["streamwish.com", "/e/x8k2m1p4q7w9"],
  ["bysefujedu.com", "/e/f2rwhq07ydg3"]
]) {
  const r = await get("https://" + host + path, { referer: "https://doramasflix.in/" });
  console.log(`\n#### ${host} ${r.s} ${r.b.length}b -> ${r.u.slice(0, 80)}`);
  console.log(r.b.replace(/\s+/g, " ").slice(0, 700));
}
