// Distribución real de hosts en Doramasflix (series + películas) y resolvers en vivo.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
function unpack(s) {
  s = String(s);
  const h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  let i = h + 3, payload = "";
  while (i < s.length) { const c = s[i]; if (c === "\\") { payload += s[i + 1]; i += 2; continue; } if (c === "'") break; payload += c; i++; }
  const rest = s.slice(i + 1);
  const m = rest.match(/^,(\d+),(\d+),/);
  if (!m) return s;
  const base = parseInt(m[1], 10), count = parseInt(m[2], 10);
  let j = rest.indexOf("'", m[0].length) + 1, dict = "";
  while (j < rest.length) { const d = rest[j]; if (d === "\\") { dict += rest[j + 1]; j += 2; continue; } if (d === "'") break; dict += d; j++; }
  const words = dict.split("|");
  const enc = (n) => (n < base ? "" : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  let out = payload;
  for (let k = count - 1; k >= 0; k--) if (words[k]) out = out.replace(new RegExp("\\b" + enc(k) + "\\b", "g"), words[k]);
  return out;
}
const findStream = (b) => {
  const m = b.match(/["'](?:file|src|source)["']\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i)
    || b.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/i);
  return m ? String(m[1] || m[0]).replace(/\\\//g, "/") : "";
};

const API = "https://sv1.fluxcedene.net/api/gql";
const H = {
  "accept": "application/json, text/plain, */*", "content-type": "application/json",
  "origin": "https://doramasflix.in", "referer": "https://doramasflix.in/",
  "platform": "doramasflix", "authorization": "Bear", "x-access-jwt-token": "",
  "x-access-platform": "RxARncfg1S_MdpSrCvreoLu_SikCGMzE1NzQzODc3NjE2MQ==", "user-agent": UA
};
const gql = async (o, v, q) => JSON.parse(await (await fetch(API, { method: "POST", headers: H, body: JSON.stringify({ operationName: o, variables: v, query: q }), signal: AbortSignal.timeout(20000) })).text());

const pool = [];
const listD = await gql("listDoramas", { page: 1, sort: "POPULARITY_DESC", perPage: 40, filter: {} },
  `query listDoramas($page: Int, $perPage: Int, $sort: SortFindManyDoramaInput, $filter: FilterFindManyDoramaInput) { paginationDorama(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { _id name } } }`);
for (const d of (listD.data?.paginationDorama?.items || []).slice(0, 14)) {
  const eps = await gql("listEpisodes", { serie_id: d._id, season_number: 1 },
    `query listEpisodes($season_number: Float!, $serie_id: MongoID!) { listEpisodes(sort: NUMBER_ASC, filter: {type_serie: "dorama", serie_id: $serie_id, season_number: $season_number}) { _id } }`);
  const ep = (eps.data?.listEpisodes || [])[0];
  if (!ep) continue;
  const a = await gql("getEpisodeLinks", { id: ep._id }, `query getEpisodeLinks($id: MongoID!) { getEpisodeLinks(id: $id) { links_online } }`);
  for (const l of a.data?.getEpisodeLinks?.links_online || []) pool.push({ ...l, src: "gel" });
  const b = await gql("detailEpisode", { filter: { _id: ep._id } }, `query detailEpisode($filter: FilterFindOneEpisodeInput) { detailEpisode(filter: $filter) { links_online } }`);
  for (const l of b.data?.detailEpisode?.links_online || []) pool.push({ ...l, src: "det" });
}
const listM = await gql("listMovies", { page: 1, perPage: 12, sort: "POPULARITY_DESC", filter: {} },
  `query listMovies($page: Int, $perPage: Int, $sort: SortFindManyMovieInput, $filter: FilterFindManyMovieInput) { paginationMovie(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { _id name slug } } }`);
for (const m of (listM.data?.paginationMovie?.items || []).slice(0, 10)) {
  const a = await gql("getMovieLinks", { slug: m.slug }, `query getMovieLinks($slug: String) { getMovieLinks(slug: $slug) { links_online } }`);
  for (const l of a.data?.getMovieLinks?.links_online || []) pool.push({ ...l, src: "gml" });
}

const stat = {};
for (const l of pool) { const h = new URL(l.embed || l.link).host; stat[h + "|" + l.language_code] = (stat[h + "|" + l.language_code] || 0) + 1; }
console.log("links:", pool.length);
console.log(Object.entries(stat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join("  "));

// resolver por host, primeros de cada uno
const seen = {};
const swish = /do7go|sfastwish|bysefujedu|vide0\.net|streamwish|vidhide|filelions|uqload|flaswish|wishfast/i;
for (const l of pool) {
  const host = new URL(l.embed || l.link).host;
  if (seen[host] >= 2) continue;
  seen[host] = (seen[host] || 0) + 1;
  if (/primeload/.test(host)) continue;
  const u = (l.embed || l.link).replace(/\\\//g, "/");
  let out = "";
  try {
    if (swish.test(host)) {
      const code = u.split("?")[0].split("/").filter(Boolean).pop();
      const origin = u.match(/^(https?:\/\/[^/]+)/)[1];
      const r = await fetch(origin + "/api/stream", {
        method: "POST",
        headers: { "user-agent": UA, "content-type": "application/json", origin, referer: u },
        body: JSON.stringify({ filecode: code, device: "android", codecs: { av1: "av01.0.09M.10", h265: "hvc1.1.6.L123.B0" } }),
        signal: AbortSignal.timeout(15000)
      });
      const t = await r.text();
      let j = {}; try { j = JSON.parse(t); } catch {}
      out = `api/stream ${r.status} ${j.streaming_url ? "OK " + j.streaming_url.slice(0, 60) : t.slice(0, 60)}`;
    } else {
      const r = await get(u, { referer: "https://doramasflix.in/" });
      const code = unpack(r.b);
      out = `page ${r.s} ${r.b.length}b unpack ${code.length}b dir ${(findStream(code) || "-").slice(0, 60)}`;
    }
  } catch (e) { out = "ERR " + String(e.message).slice(0, 50); }
  console.log(`  ${host.padEnd(26)} ${l.language_code} ${out}`);
}
