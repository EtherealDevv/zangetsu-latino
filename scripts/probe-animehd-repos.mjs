// Repos públicos de Animelatino: buscar rutas de API y endpoints del player.
const h = { "User-Agent": "curl", "Accept": "application/vnd.github+json" };
const getJson = async (u) => {
  try {
    const r = await fetch(u, { headers: h, signal: AbortSignal.timeout(25000) });
    return { s: r.status, j: await r.json().catch(() => null) };
  } catch (e) { return { s: 0, j: null, err: String(e.cause?.code || e.message) }; }
};

const repos = [
  ["animelatinohd", "master"],
  ["animelatinohd2", "main"],
  ["animes", "master"],
  ["node-urlresolver-api", "master"],
  ["dblatinohd", "master"]
];

for (const [repo, branch] of repos) {
  const r = await getJson(`https://api.github.com/repos/Animelatino/${repo}/git/trees/${branch}?recursive=1`);
  if (!r.j || !r.j.tree) { console.log(`\n== ${repo}/${branch}: ${r.s} ${r.err || (r.j && r.j.message) || ""}`); continue; }
  const all = r.j.tree.map((x) => x.path);
  console.log(`\n== ${repo}/${branch} (${all.length} entradas) ===`);
  const api = all.filter((p) => /(^|\/)(api|routes|server)\//.test(p) || /route\.(js|ts)$/.test(p));
  console.log("  api:", api.slice(0, 24).join("\n       ") || "-");
  const pages = all.filter((p) => /^pages\//.test(p)).slice(0, 20);
  if (pages.length) console.log("  pages:", pages.join("  "));
}
