// Doramasflix: GraphQL en sv1.fluxcedene.net con la clave pública de la app.
// Probar cada operación y el resolver fkplayer.
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
const gql = async (payload) => {
  try {
    const r = await fetch(API, { method: "POST", headers: H, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
    const txt = await r.text();
    let j = null; try { j = JSON.parse(txt); } catch {}
    return { s: r.status, b: txt, j };
  } catch (e) { return { s: 0, b: String(e.cause?.code || e.message), j: null }; }
};
const show = (label, r, n) => console.log(`\n=== ${label} ${r.s} ${r.b.length}b\n${r.b.replace(/\s+/g, " ").slice(0, n || 600)}`);

const ITEM = "_id name name_es slug poster_path poster __typename";
const EA = `query listEpisodes($season_number: Float!, $serie_id: MongoID!) { listEpisodes(sort: NUMBER_ASC, filter: {type_serie: "dorama", serie_id: $serie_id, season_number: $season_number}) { _id name slug episode_number season_number still_path __typename } }`;

const s1 = await gql({ operationName: "searchAll", variables: { input: "invierno" }, query: `query searchAll($input: String!) { searchDorama(input: $input, limit: 32) { ${ITEM} } searchMovie(input: $input, limit: 32) { ${ITEM} } }` });
show("searchAll invierno", s1, 700);

const s2 = await gql({ operationName: "listDoramas", variables: { page: 1, sort: "POPULARITY_DESC", perPage: 20, filter: { isTVShow: false } }, query: `query listDoramas($page: Int, $perPage: Int, $sort: SortFindManyDoramaInput, $filter: FilterFindManyDoramaInput) { paginationDorama(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { ${ITEM} } hasNextPage } }` });
show("listDoramas", s2, 500);

const s3 = await gql({ operationName: "listMovies", variables: { perPage: 20, sort: "POPULARITY_DESC", filter: {}, page: 1 }, query: `query listMovies($page: Int, $perPage: Int, $sort: SortFindManyMovieInput, $filter: FilterFindManyMovieInput) { paginationMovie(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { ${ITEM} } } }` });
show("listMovies", s3, 400);

let doramaId = null, doramaSlug = null, movieSlug = null;
try {
  const d = s2.j?.data?.paginationDorama?.items?.[0];
  if (d) { doramaId = d._id; doramaSlug = d.slug; }
  const m = s3.j?.data?.paginationMovie?.items?.[0];
  if (m) movieSlug = m.slug;
} catch {}
console.log("\nprimer dorama:", doramaId, doramaSlug, "| peli:", movieSlug);

if (doramaId) {
  const d4 = await gql({ operationName: "detailDorama", variables: { filter: { _id: doramaId } }, query: `query detailDorama($filter: FilterFindOneDoramaInput) { detailDorama(filter: $filter) { ${ITEM} overview } }` });
  show("detailDorama", d4, 400);
  const d5 = await gql({ operationName: "listSeasons", variables: { serie_id: doramaId }, query: `query listSeasons($serie_id: MongoID!) { listSeasons(sort: NUMBER_ASC, filter: {serie_id: $serie_id}) { slug season_number poster_path __typename } }` });
  show("listSeasons", d5, 400);
  const d6 = await gql({ operationName: "listEpisodes", variables: { serie_id: doramaId, season_number: 1 }, query: EA });
  show("listEpisodes s1", d6, 700);
  const ep = d6.j?.data?.listEpisodes?.[0];
  if (ep?.slug) {
    const d7 = await gql({ operationName: "detailEpisode", variables: { filter: { slug: ep.slug } }, query: `query detailEpisode($filter: FilterFindOneEpisodeInput) { detailEpisode(filter: $filter) { _id links_online { link embed lang } } }` });
    show("detailEpisode links", d7, 900);
    if (ep._id) {
      const d8 = await gql({ operationName: "getEpisodeLinks", variables: { id: ep._id }, query: `query getEpisodeLinks($id: MongoID!) { getEpisodeLinks(id: $id) { _id links_online { link embed lang } } }` });
      show("getEpisodeLinks", d8, 900);
    }
  }
}

if (movieSlug) {
  const m1 = await gql({ operationName: "getMovieLinks", variables: { slug: movieSlug }, query: `query getMovieLinks($slug: String) { getMovieLinks(slug: $slug) { _id links_online { link embed lang } } }` });
  show("getMovieLinks " + movieSlug, m1, 900);
}
