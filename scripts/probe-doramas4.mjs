// Primeload /api/v1/player/<token> SIN challenge, y cómo se distribuyen los hosts en catálogo real.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, referer: "https://doramasflix.in/", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url, ct: r.headers.get("content-type") || "" };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};

const r = await get("https://primeload.co/api/v1/player/R8dCbP0C8cFX");
console.log("player json", r.s, r.b.length + "b", r.ct);
console.log(r.b);

let master = "";
try { const j = JSON.parse(r.b); master = j.master_manifest || (j.sources && j.sources[0] && j.sources[0].file) || ""; } catch {}
console.log("\nmaster:", master);
if (master) {
  const m = await get(master, { referer: "https://primeload.co/" });
  console.log("  m3u8", m.s, m.b.length + "b", m.ct, "EXTM3U:", /#EXTM3U/.test(m.b));
  console.log("  head:", m.b.split("\n").slice(0, 6).join(" | "));
}

// distribución de hosts en el catálogo
const API = "https://sv1.fluxcedene.net/api/gql";
const H = {
  "accept": "application/json, text/plain, */*", "content-type": "application/json",
  "origin": "https://doramasflix.in", "referer": "https://doramasflix.in/",
  "platform": "doramasflix", "authorization": "Bear", "x-access-jwt-token": "",
  "x-access-platform": "RxARncfg1S_MdpSrCvreoLu_SikCGMzE1NzQzODc3NjE2MQ==", "user-agent": UA
};
const gql = async (o, v, q) => {
  const resp = await fetch(API, { method: "POST", headers: H, body: JSON.stringify({ operationName: o, variables: v, query: q }), signal: AbortSignal.timeout(20000) });
  return JSON.parse(await resp.text());
};
const list = await gql("listDoramas", { page: 1, sort: "POPULARITY_DESC", perPage: 12, filter: { isTVShow: false } },
  `query listDoramas($page: Int, $perPage: Int, $sort: SortFindManyDoramaInput, $filter: FilterFindManyDoramaInput) { paginationDorama(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { _id name name_es slug } } }`);
const hosts = {};
const langs = {};
let checked = 0;
for (const d of list.data.paginationDorama.items.slice(0, 6)) {
  const eps = await gql("listEpisodes", { serie_id: d._id, season_number: 1 },
    `query listEpisodes($season_number: Float!, $serie_id: MongoID!) { listEpisodes(sort: NUMBER_ASC, filter: {type_serie: "dorama", serie_id: $serie_id, season_number: $season_number}) { _id episode_number } }`);
  const ep = (eps.data?.listEpisodes || [])[0];
  if (!ep) continue;
  const lk = await gql("getEpisodeLinks", { id: ep._id }, `query getEpisodeLinks($id: MongoID!) { getEpisodeLinks(id: $id) { links_online } }`);
  for (const l of lk.data?.getEpisodeLinks?.links_online || []) {
    let h = "?"; try { h = new URL(l.embed || l.link).host; } catch {}
    hosts[h] = (hosts[h] || 0) + 1;
    langs[l.language_code] = (langs[l.language_code] || 0) + 1;
    checked++;
  }
  console.log(`  ${d.name} (${d.name_es}) ->`, (lk.data?.getEpisodeLinks?.links_online || []).length, "links");
}
console.log("\ntotal", checked, "links | hosts:", JSON.stringify(hosts), "| langs:", JSON.stringify(langs));
