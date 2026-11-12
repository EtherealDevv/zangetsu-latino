const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

const page = await get("https://magistv24.com/serie/los-simpson/");
const post = (page.b.match(/data-post="(\d+)"/) || [])[1];
console.log("post:", post);

for (const season of ["2", "10"]) {
  const r = await fetch("https://magistv24.com/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: { ...H, "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest", "Origin": "https://magistv24.com", "Referer": "https://magistv24.com/serie/los-simpson/" },
    body: `action=action_select_season&season=${season}&post=${post}`
  });
  const b = await r.text();
  console.log(`\n=== temporada ${season}: ${r.status} ${b.length}b`);
  console.log(b.replace(/\s+/g, " ").slice(0, 600));
  const caps = [...b.matchAll(/href="([^"]*\/capitulo\/[^"]+)"/gi)].map((m) => m[1]);
  console.log("capitulos:", caps.length, caps.slice(0, 2).join(" | "));
}
