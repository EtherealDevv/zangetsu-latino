// Doramasflix pase 2: links_online es [JSON] (sin subcampos), sin hasNextPage.
const API = "https://sv1.fluxcedene.net/api/gql";
const H = {
  "accept": "application/json, text/plain, */*",
  "content-type": "application/json",
  "origin": "https://doramasflix.in",
  "referer": "https://doramasflix.in/",
  "platform": "doramasflix",
  "authorization": "Bear",
  "x-access-jwt-token": "",
  "x-access-platform": "RxARncfg1S_MdpSrCvreoLu_SikCGMzE1NzQzODc3NjE2MQ==",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
};
const gql = async (o, v, q) => {
  try {
    const r = await fetch(API, { method: "POST", headers: H, body: JSON.stringify({ operationName: o, variables: v, query: q }), signal: AbortSignal.timeout(20000) });
    const b = await r.text();
    let j = null; try { j = JSON.parse(b); } catch {}
    return { s: r.status, b, j };
  } catch (e) { return { s: 0, b: String(e.cause?.code || e.message), j: null }; }
};
const show = (l, r, n) => console.log(`\n=== ${l} ${r.s} ${r.b.length}b\n${r.b.replace(/\s+/g, " ").slice(0, n || 500)}`);

const ITEM = "_id name name_es slug poster_path poster __typename";

const d1 = await gql("listDoramas", { page: 1, sort: "POPULARITY_DESC", perPage: 20, filter: { isTVShow: false } },
  `query listDoramas($page: Int, $perPage: Int, $sort: SortFindManyDoramaInput, $filter: FilterFindManyDoramaInput) { paginationDorama(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { ${ITEM} } } }`);
show("listDoramas", d1, 420);
const first = d1.j?.data?.paginationDorama?.items?.[0];
console.log("\nfirst:", JSON.stringify(first));

if (first) {
  const d2 = await gql("listSeasons", { serie_id: first._id }, `query listSeasons($serie_id: MongoID!) { listSeasons(sort: NUMBER_ASC, filter: {serie_id: $serie_id}) { slug season_number poster_path __typename } }`);
  show("listSeasons", d2, 700);
  const d3 = await gql("listEpisodes", { serie_id: first._id, season_number: 1 },
    `query listEpisodes($season_number: Float!, $serie_id: MongoID!) { listEpisodes(sort: NUMBER_ASC, filter: {type_serie: "dorama", serie_id: $serie_id, season_number: $season_number}) { _id name slug episode_number season_number still_path __typename } }`);
  show("listEpisodes s1", d3, 800);
  const ep = d3.j?.data?.listEpisodes?.[0];
  if (ep?._id) {
    const d4 = await gql("getEpisodeLinks", { id: ep._id }, `query getEpisodeLinks($id: MongoID!) { getEpisodeLinks(id: $id) { _id links_online } }`);
    show("getEpisodeLinks", d4, 1400);
    const d5 = await gql("detailEpisode", { filter: { _id: ep._id } }, `query detailEpisode($filter: FilterFindOneEpisodeInput) { detailEpisode(filter: $filter) { _id links_online } }`);
    show("detailEpisode", d5, 1200);
  } else {
    console.log("sin episodio en s1; season_number quizá 0");
    const d3b = await gql("listEpisodes", { serie_id: first._id, season_number: 0 },
      `query listEpisodes($season_number: Float!, $serie_id: MongoID!) { listEpisodes(sort: NUMBER_ASC, filter: {type_serie: "dorama", serie_id: $serie_id, season_number: $season_number}) { _id name slug episode_number season_number __typename } }`);
    show("listEpisodes s0", d3b, 500);
  }
}

const m1 = await gql("getMovieLinks", { slug: "colony" }, `query getMovieLinks($slug: String) { getMovieLinks(slug: $slug) { _id links_online } }`);
show("getMovieLinks colony", m1, 1600);
const m2 = await gql("detailMovie", { filter: { slug: "colony" } }, `query detailMovie($filter: FilterFindOneMovieInput) { detailMovie(filter: $filter) { _id name links_online } }`);
show("detailMovie colony", m2, 1200);
