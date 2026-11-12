// Doramasflix: los clones streamwish que antes fallaban, ahora con el unpack de links{}.
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
const linksOf = (code) => {
  const obj = (code.match(/links\s*=\s*\{([\s\S]*?)\}\s*;/) || [])[1] || "";
  const out = {};
  for (const k of ["hls4", "hls3", "hls2", "hls", "file"]) {
    const m = obj.match(new RegExp('["\']?' + k + '["\']?\\s*:\\s*["\']([^"\']+)["\']'));
    if (m) out[k] = m[1];
  }
  return out;
};

const API = "https://sv1.fluxcedene.net/api/gql";
const H = {
  "accept": "application/json, text/plain, */*", "content-type": "application/json",
  "origin": "https://doramasflix.in", "referer": "https://doramasflix.in/",
  "platform": "doramasflix", "authorization": "Bear", "x-access-jwt-token": "",
  "x-access-platform": "RxARncfg1S_MdpSrCvreoLu_SikCGMzE1NzQzODc3NjE2MQ==", "user-agent": UA
};
const gql = async (o, v, q) => JSON.parse(await (await fetch(API, { method: "POST", headers: H, body: JSON.stringify({ operationName: o, variables: v, query: q }), signal: AbortSignal.timeout(20000) })).text());
const listD = await gql("listDoramas", { page: 1, sort: "POPULARITY_DESC", perPage: 30, filter: {} },
  `query listDoramas($page: Int, $perPage: Int, $sort: SortFindManyDoramaInput, $filter: FilterFindManyDoramaInput) { paginationDorama(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { _id name } } }`);
const seen = {};
for (const d of listD.data.paginationDorama.items.slice(0, 12)) {
  const eps = await gql("listEpisodes", { serie_id: d._id, season_number: 1 },
    `query listEpisodes($season_number: Float!, $serie_id: MongoID!) { listEpisodes(sort: NUMBER_ASC, filter: {type_serie: "dorama", serie_id: $serie_id, season_number: $season_number}) { _id } }`);
  const ep = (eps.data?.listEpisodes || [])[0];
  if (!ep) continue;
  const a = await gql("detailEpisode", { filter: { _id: ep._id } }, `query detailEpisode($filter: FilterFindOneEpisodeInput) { detailEpisode(filter: $filter) { links_online } }`);
  for (const l of a.data?.detailEpisode?.links_online || []) {
    const u = (l.embed || l.link || "").replace(/\\\//g, "/");
    const host = (() => { try { return new URL(u).host; } catch { return ""; } })();
    if (!host || seen[host] >= 2) continue;
    if (!/wish|vids|flaswish|sfastwish|jodwish|byse|filelions|vidhide|do7go|vide0|playmogo|dood|myvidplay|minochinos|hgcloud|earnvids|uqload|mxdrop|streamtape/i.test(host)) continue;
    seen[host] = (seen[host] || 0) + 1;
    const r = await get(u, { referer: "https://doramasflix.in/" });
    const code = unpack(r.b);
    const lk = linksOf(code);
    /** @type {string[]} */
    const cands = Object.values(lk);
    let ok = "";
    for (const c of cands.slice(0, 3)) {
      const abs = /^https?:/i.test(c) ? c : (/^\/\//.test(c) ? "https:" + c : new URL(c, r.u).href);
      try {
        const pr = await fetch(abs, { headers: { "user-agent": UA, referer: r.u }, signal: AbortSignal.timeout(12000) });
        if (pr.status === 200) { ok = abs.slice(0, 70); break; }
      } catch {}
    }
    const dir = (code.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/i) || [])[0] || "";
    console.log(`${host.padEnd(24)} ${l.language_code} ${r.s} ${r.b.length}b keys=${Object.keys(lk).join(",") || "-"} play=${ok || dir.slice(0, 60) || "-"}`);
  }
}
