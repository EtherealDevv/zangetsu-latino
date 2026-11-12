// Doramasflix — fuente Zangetsu (doramas, series y películas en español latino).
// La web es Next.js, pero el catálogo sale de un GraphQL propio en
// sv1.fluxcedene.net que autentica con la cabecera x-access-platform que trae
// la app. Los enlaces online llegan como JSON y cada host se resuelve aparte.

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
var SITE = 'https://doramasflix.in';
var API = 'https://sv1.fluxcedene.net/api/gql';
var PLATFORM = 'RxARncfg1S_MdpSrCvreoLu_SikCGMzE1NzQzODc3NjE2MQ==';
var TMDB = 'https://image.tmdb.org/t/p/w500';
var VERSION = '1.0.0';

function getInfo() {
  return {
    name: 'Doramasflix', lang: 'es', baseUrl: SITE,
    logo: 'https://assets.seriesapi.co/brands/doramasflix/websites/6a651fa138cbd16df74343be/logo/logo-1785013866419.png',
    type: 'movie', version: VERSION
  };
}

// ── red ──────────────────────────────────────────────────────────────────────
function _get(url, ref) {
  var h = { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' };
  if (ref) h['Referer'] = ref;
  return fetch(url, { headers: h }).then(function (r) { return r.body || ''; }).catch(function () { return ''; });
}

function _gql(op, vars, query) {
  return fetch(API, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Origin': SITE,
      'Referer': SITE + '/',
      'platform': 'doramasflix',
      'authorization': 'Bear',
      'x-access-jwt-token': '',
      'x-access-platform': PLATFORM
    },
    body: JSON.stringify({ operationName: op, variables: vars, query: query })
  }).then(function (r) {
    var d = null;
    try { d = JSON.parse(r.body || 'null'); } catch (e) { return null; }
    return (d && d.data) || null;
  }).catch(function () { return null; });
}

function _stream(url, quality, ref, kind) {
  var u = String(url).replace(/\\\//g, '/');
  return {
    url: u, quality: quality || 'auto',
    container: /\.m3u8(\?|$)/i.test(u) ? 'hls' : 'mp4',
    headers: { 'User-Agent': UA, 'Referer': ref || SITE + '/' },
    kind: kind || 'dub', audioLang: 'es', subtitles: []
  };
}

// ── piezas comunes ───────────────────────────────────────────────────────────
function _poster(p) {
  if (!p) return null;
  var s = String(p);
  if (/^https?:\/\//i.test(s)) return s;
  return TMDB + (s.charAt(0) === '/' ? '' : '/') + s;
}

// packer (jjencode): mismo desempaquetador que usa CineCalidad.
function _unpack(s) {
  s = String(s);
  var h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  var i = h + 3, payload = '';
  while (i < s.length) {
    var c = s[i];
    if (c === '\\') { payload += s[i + 1]; i += 2; continue; }
    if (c === "'") break;
    payload += c; i++;
  }
  var rest = s.slice(i + 1);
  var m = rest.match(/^,(\d+),(\d+),/);
  if (!m) return s;
  var base = parseInt(m[1], 10), count = parseInt(m[2], 10);
  var j = rest.indexOf("'", m[0].length) + 1, dict = '';
  while (j < rest.length) {
    var d = rest[j];
    if (d === '\\') { dict += rest[j + 1]; j += 2; continue; }
    if (d === "'") break;
    dict += d; j++;
  }
  var words = dict.split('|');
  function enc(n) {
    return (n < base ? '' : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  }
  var out = payload;
  for (var k = count - 1; k >= 0; k--) {
    if (words[k]) out = out.replace(new RegExp('\\b' + enc(k) + '\\b', 'g'), words[k]);
  }
  return out;
}

function _abs(url, base) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  var host = (String(base).match(/^(https?:\/\/[^/]+)/) || [])[1] || SITE;
  return host + (url.charAt(0) === '/' ? '' : '/') + url;
}

// ── resolvers por host ───────────────────────────────────────────────────────
// mxdrop / mixdrop: el reproductor llega empaquetado y la URL final vive en
// MDCore.wurl (mp4 firmado con expiración).
function _mx(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    var code = _unpack(html);
    var m = code.match(/(?:wurl|vfile)\s*=\s*["']([^"']+)["']/i) || code.match(/(?:wurl|file)\s*:\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
    if (!m) return [];
    var u = _abs(m[1], embed);
    if (!u) return [];
    return [_stream(u, 'HD', embed, kind)];
  });
}

// vidhide / vidhidepre / vidhidevip / filelions: jwplayer con `var links={hls2:...}`.
function _vidhide(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    if (!html) return [];
    var out = [], seen = {};
    var re = /["']?hls[2-4]["']?\s*:\s*["']([^"']+)["']/gi, m;
    while ((m = re.exec(html)) !== null) {
      var u = _abs(m[1], embed);
      if (!u || seen[u]) continue;
      seen[u] = 1;
      out.push(_stream(u, m[0].indexOf('hls2') >= 0 ? 'HD' : 'auto', embed, kind));
    }
    if (!out.length) {
      var f = html.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/i);
      if (f) out.push(_stream(_abs(f[1], embed), 'HD', embed, kind));
    }
    return out;
  });
}

// uqload: jwplayer con la lista de sources servida en el propio HTML.
function _uq(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    var m = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (!m) return [];
    return [_stream(_abs(m[1], embed), 'HD', embed, kind)];
  });
}

// streamtape: el enlace real se arma en #norobotlink (a veces concatenado).
function _tape(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    if (!html) return [];
    var m = html.match(/norobotlink[\s\S]{0,600}?(?:href=["']|=\s*["'])((?:https?:)?\/\/[^"']*get_video\?[^"']*)/i)
      || html.match(/((?:https?:)?\/\/(?:[a-z0-9-]+\.)?streamtape\.[a-z]+\/get_video\?[^"'\s]+)/i);
    if (!m) return [];
    var u = _abs(m[1], embed);
    return [_stream(u, 'HD', embed, kind)];
  });
}

// ok.ru: la metadata del reproductor trae las variantes ya firmadas.
function _okru(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    if (!html) return [];
    var opt = html.match(/data-options="([\s\S]*?)"/i);
    if (!opt) return [];
    var raw = opt[1].replace(/&quot;/g, '"').replace(/&#0?38;/g, '&').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    var v = raw.match(/"videos"\s*:\s*\[([\s\S]*?)\]/i);
    if (!v) return [];
    var out = [], seen = {}, re = /"url"\s*:\s*"([^"]+)"/g, m;
    while ((m = re.exec(v[1])) !== null) {
      var u = m[1].replace(/\\\//g, '/');
      if (!/\.(mp4|m3u8)/i.test(u) || seen[u]) continue;
      seen[u] = 1;
      out.push(_stream(u, 'HD', embed, kind));
      if (out.length >= 2) break;
    }
    return out;
  });
}

// Hosts que no se pueden resolver desde el runtime: primeload exige una sesión
// con fingerprint de canvas y un socket para firmar el m3u8; el resto está
// detrás de Cloudflare o es un lander de anuncios.
function _deadHost(u) {
  return /primeload|do7go|playmogo|dood\.|sfastwish|bysefujedu|bysekoze|bysezoxexe|myvidplay|vide0\.net|flaswish|jodwish|wishfast|voe\.|susanexpectcare/i.test(String(u));
}

function _resolve(embed, kind) {
  var u = String(embed || '').replace(/\\\//g, '/').replace(/#.*$/, '');
  if (!u || _deadHost(u)) return Promise.resolve([]);
  if (/mxdrop|mixdrop/i.test(u)) return _mx(u, kind);
  if (/vidhide|filelions|vidhidepre|vidhidevip/i.test(u)) return _vidhide(u, kind);
  if (/uqload/i.test(u)) return _uq(u, kind);
  if (/streamtape|strtape/i.test(u)) return _tape(u, kind);
  if (/ok\.ru/i.test(u)) return _okru(u, kind);
  return _vidhide(u, kind);
}

// ── catálogo ─────────────────────────────────────────────────────────────────
var Q_ITEM = '_id name name_es slug poster_path poster __typename';

function _item(e, isMovie) {
  if (!e || !e.slug) return null;
  var title = e.name || e.name_es || e.slug;
  var alt = (e.name_es && e.name_es !== title) ? e.name_es : null;
  return {
    id: SITE + (isMovie ? '/peliculas-online/' : '/doramas-online/') + e.slug,
    title: title,
    englishTitle: alt,
    cover: _poster(e.poster_path || e.poster),
    url: SITE + (isMovie ? '/peliculas-online/' : '/doramas-online/') + e.slug,
    type: isMovie ? 'movie' : 'tv',
    sourceId: __SOURCE_ID
  };
}

function _listDoramas(page, sort, filter) {
  return _gql('listDoramas', { page: page, perPage: 24, sort: sort || 'POPULARITY_DESC', filter: filter || {} },
    'query listDoramas($page: Int, $perPage: Int, $sort: SortFindManyDoramaInput, $filter: FilterFindManyDoramaInput) { paginationDorama(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { ' + Q_ITEM + ' } } }'
  ).then(function (d) {
    var items = (d && d.paginationDorama && d.paginationDorama.items) || [], out = [];
    for (var i = 0; i < items.length; i++) {
      var it = _item(items[i], false);
      if (it) out.push(it);
    }
    return out;
  });
}

function _listMovies(page, sort) {
  return _gql('listMovies', { page: page, perPage: 24, sort: sort || 'POPULARITY_DESC', filter: {} },
    'query listMovies($page: Int, $perPage: Int, $sort: SortFindManyMovieInput, $filter: FilterFindManyMovieInput) { paginationMovie(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { ' + Q_ITEM + ' } } }'
  ).then(function (d) {
    var items = (d && d.paginationMovie && d.paginationMovie.items) || [], out = [];
    for (var i = 0; i < items.length; i++) {
      var it = _item(items[i], true);
      if (it) out.push(it);
    }
    return out;
  });
}

function getHome() {
  return Promise.all([
    _listDoramas(1, 'POPULARITY_DESC').then(function (i) { return { title: 'Doramas populares', items: i }; }),
    _listDoramas(1, 'CREATEDAT_DESC').then(function (i) { return { title: 'Recién agregados', items: i }; }),
    _listMovies(1, 'POPULARITY_DESC').then(function (i) { return { title: 'Películas', items: i }; })
  ]).catch(function () { return []; });
}

function popular(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  return _listDoramas(page, 'POPULARITY_DESC').catch(function () { return []; });
}

function latest(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  return _listDoramas(page, 'CREATEDAT_DESC').catch(function () { return []; });
}

// ── emparejado de títulos ────────────────────────────────────────────────────
var _zFold = {
  'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ñ': 'n', 'ç': 'c'
};

function _zNorm(s) {
  var t = String(s || '').toLowerCase(), out = '';
  for (var i = 0; i < t.length; i++) {
    var c = t.charAt(i);
    if (_zFold[c]) out += _zFold[c];
    else if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) out += c;
    else out += ' ';
  }
  return out.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
}

// Z Mode se queda con el primer resultado que acepta el título: los que
// coinciden con la consulta se ponen delante y se marcan con englishTitle.
function _zAlias(items, query) {
  var q = _zNorm(query);
  if (!q || !items || !items.length) return items;
  var qt = q.split(' ').filter(function (t) { return t.length >= 4; });
  if (!qt.length) return items;
  var scored = [];
  for (var i = 0; i < items.length; i++) {
    if (!items[i] || !items[i].title) continue;
    var tt = _zNorm(items[i].title).split(' ');
    var score = 0, covered = 0;
    for (var a = 0; a < qt.length; a++) {
      var best = 0;
      for (var b = 0; b < tt.length; b++) {
        var w = tt[b];
        if (w.length < 4) continue;
        if (w === qt[a]) { best = 2; break; }
        if (best < 1 && (w.indexOf(qt[a]) === 0 || qt[a].indexOf(w) === 0)) best = 1;
      }
      if (best) covered++;
      score += best;
    }
    var need = qt.length <= 3 ? qt.length : Math.ceil(qt.length * 0.75);
    if (covered < need) continue;
    items[i].englishTitle = query;
    scored.push({ it: items[i], score: score, words: tt.length, at: i });
  }
  if (!scored.length) return items;
  scored.sort(function (x, y) {
    if (y.score !== x.score) return y.score - x.score;
    if (x.words !== y.words) return x.words - y.words;
    return x.at - y.at;
  });
  var out = [];
  for (var s = 0; s < scored.length; s++) out.push(scored[s].it);
  for (var k = 0; k < items.length; k++) if (!items[k].englishTitle) out.push(items[k]);
  return out;
}

// El buscador del API ya pega por nombre original y en español; se piden los
// dos listados a la vez y se funden, sin repetir.
function search(query, page) {
  var q = String(query || '').replace(/^\s+|\s+$/g, '');
  if (!q) return Promise.resolve([]);
  return _gql('searchAll', { input: q },
    'query searchAll($input: String!) { searchDorama(input: $input, limit: 32) { ' + Q_ITEM + ' } searchMovie(input: $input, limit: 32) { ' + Q_ITEM + ' } }'
  ).then(function (d) {
    if (!d) return _listDoramas(page, 'POPULARITY_DESC').then(function (items) { return _zAlias(items, q); });
    var out = [], seen = {}, i;
    var series = d.searchDorama || [];
    for (i = 0; i < series.length; i++) {
      var a = _item(series[i], false);
      if (a && !seen[a.url]) { seen[a.url] = 1; out.push(a); }
    }
    var movies = d.searchMovie || [];
    for (i = 0; i < movies.length; i++) {
      var b = _item(movies[i], true);
      if (b && !seen[b.url]) { seen[b.url] = 1; out.push(b); }
    }
    return _zAlias(out, q);
  }).catch(function () { return []; });
}

// ── detalle ──────────────────────────────────────────────────────────────────
function _isMovieUrl(url) {
  return /\/peliculas-online\//i.test(String(url));
}

function _slug(url) {
  var s = String(url).replace(/[?#].*$/, '').replace(/\/+$/, '');
  return s.slice(s.lastIndexOf('/') + 1);
}

function _episodes(doramaId, slug, seasons) {
  var jobs = [], nums = [];
  for (var i = 0; i < seasons.length && i < 12; i++) {
    (function (n) {
      nums.push(n);
      jobs.push(_gql('listEpisodes', { serie_id: doramaId, season_number: n },
        'query listEpisodes($season_number: Float!, $serie_id: MongoID!) { listEpisodes(sort: NUMBER_ASC, filter: {type_serie: "dorama", serie_id: $serie_id, season_number: $season_number}) { _id name slug episode_number season_number still_path __typename } }'
      ));
    })(seasons[i]);
  }
  return Promise.all(jobs).then(function (lists) {
    var out = [], seen = {};
    for (var l = 0; l < lists.length; l++) {
      var arr = (lists[l] && lists[l].listEpisodes) || [];
      for (var k = 0; k < arr.length; k++) {
        var e = arr[k];
        if (!e || !e._id) continue;
        var n = e.episode_number || 0;
        var id = SITE + '/ver/' + slug + '/' + nums[l] + '/' + n + '?e=' + e._id;
        if (seen[id]) continue;
        seen[id] = 1;
        out.push({
          id: id, url: id,
          title: 'T' + nums[l] + ' · Cap ' + n + (e.name && e.name.indexOf(String(n)) < 0 ? ' — ' + e.name : ''),
          number: n, season: nums[l],
          cover: _poster(e.still_path), sourceId: __SOURCE_ID
        });
      }
    }
    return out;
  });
}

function _detail(url) {
  var slug = _slug(url);
  if (!slug) return Promise.reject(new Error('Doramasflix: enlace inválido'));
  if (_isMovieUrl(url)) {
    return _gql('detailMovie', { filter: { slug: slug } },
      'query detailMovie($filter: FilterFindOneMovieInput) { detailMovie(filter: $filter) { _id name name_es slug overview poster_path poster release_date runtime genres { name } __typename } }'
    ).then(function (d) {
      var m = (d && d.detailMovie) || null;
      if (!m) throw new Error('Doramasflix: película no encontrada');
      var self = SITE + '/peliculas-online/' + m.slug;
      var genres = [];
      for (var i = 0; i < (m.genres || []).length; i++) genres.push(String(m.genres[i] && m.genres[i].name || ''));
      return {
        id: self, title: m.name || m.name_es, englishTitle: (m.name_es && m.name_es !== m.name) ? m.name_es : null,
        url: self, cover: _poster(m.poster_path || m.poster),
        description: m.overview || '', genres: genres, studios: [],
        status: 'completed', year: (String(m.release_date || '').match(/^(\d{4})/) || [])[1] || null,
        duration: m.runtime || null,
        type: 'movie', sourceId: __SOURCE_ID,
        episodes: [{ id: self, url: self, title: 'Ver película', number: 1, sourceId: __SOURCE_ID }],
        subCount: 0, dubCount: 1
      };
    });
  }
  return _gql('detailDorama', { filter: { slug: slug } },
    'query detailDorama($filter: FilterFindOneDoramaInput) { detailDorama(filter: $filter) { _id name name_es slug overview poster_path poster first_air_date status genres { name } __typename } }'
  ).then(function (d) {
    var s = (d && d.detailDorama) || null;
    if (!s) throw new Error('Doramasflix: dorama no encontrado');
    return _gql('listSeasons', { serie_id: s._id },
      'query listSeasons($serie_id: MongoID!) { listSeasons(sort: NUMBER_ASC, filter: {serie_id: $serie_id}) { slug season_number poster_path __typename } }'
    ).then(function (sd) {
      var seasons = (sd && sd.listSeasons) || [];
      var nums = [];
      for (var i = 0; i < seasons.length; i++) {
        var n = seasons[i].season_number;
        if (n !== null && n !== undefined && nums.indexOf(n) < 0) nums.push(n);
      }
      if (!nums.length) nums = [1];
      var self = SITE + '/doramas-online/' + s.slug;
      var genres = [];
      for (var g = 0; g < (s.genres || []).length; g++) genres.push(String(s.genres[g] && s.genres[g].name || ''));
      return _episodes(s._id, s.slug, nums).then(function (eps) {
        return {
          id: self, title: s.name || s.name_es, englishTitle: (s.name_es && s.name_es !== s.name) ? s.name_es : null,
          url: self, cover: _poster(s.poster_path || s.poster),
          description: s.overview || '', genres: genres, studios: [],
          status: 'completed', year: (String(s.first_air_date || '').match(/^(\d{4})/) || [])[1] || null,
          type: 'tv', sourceId: __SOURCE_ID,
          episodes: eps,
          subCount: 0, dubCount: eps.length
        };
      });
    });
  });
}

function getDetail(url) { return _detail(url); }
function getEpisodes(url) { return _detail(url).then(function (d) { return d.episodes; }); }

// ── streams ──────────────────────────────────────────────────────────────────
var LANG = {
  '38': 'Latino', '37': 'Castellano', '36': 'Inglés', '192': 'Subtitulado',
  '13109': 'Coreano', '13110': 'Japonés', '13111': 'Mandarín', '13112': 'Tailandés',
  '13113': 'Filipino', '13114': 'Indonesio', '1327': 'Portugués', '343422': 'Vietnamita'
};

function _langOf(link) {
  var code = String(link.language_code || '').toLowerCase();
  var lab = LANG[String(link.lang || '')] || '';
  if (code === 'es') return lab === 'Castellano' ? 'Castellano' : 'Latino';
  if (code === 'pt-br' || code === 'pt') return 'Portugués';
  if (code === 'en') return 'Inglés';
  return lab || (code ? code.toUpperCase() : 'Subtitulado');
}

// Junta los servidores de las dos consultas (el oficial y los externos), deja
// los latinos al frente y resuelve cada host en paralelo.
function _servers(list, kind) {
  var out = [], seen = {}, i;
  for (i = 0; i < list.length; i++) {
    var it = list[i];
    if (!it) continue;
    var url = it.embed || it.link;
    if (!url || _deadHost(url) || seen[url]) continue;
    seen[url] = 1;
    out.push({ url: url, lang: it.language_code || '', label: _langOf(it), kind: kind });
  }
  out.sort(function (a, b) {
    var sa = a.label === 'Latino' ? 0 : (a.label === 'Castellano' ? 1 : 2);
    var sb = b.label === 'Latino' ? 0 : (b.label === 'Castellano' ? 1 : 2);
    return sa - sb;
  });
  return out;
}

function getVideoSources(url) {
  var target = String(url || '');
  var isMovie = _isMovieUrl(target);
  var epId = (target.match(/[?&]e=([0-9a-f]{24})/i) || [])[1] || '';
  var slug = _slug(target);

  if (isMovie) {
    return Promise.all([
      _gql('getMovieLinks', { slug: slug }, 'query getMovieLinks($slug: String) { getMovieLinks(slug: $slug) { _id links_online } }'),
      _gql('detailMovie', { filter: { slug: slug } }, 'query detailMovie($filter: FilterFindOneMovieInput) { detailMovie(filter: $filter) { _id links_online } }')
    ]).then(function (res) {
      var list = [];
      for (var i = 0; i < res.length; i++) {
        var node = (res[i] && (res[i].getMovieLinks || res[i].detailMovie)) || null;
        var links = (node && node.links_online) || [];
        for (var k = 0; k < links.length; k++) list.push(links[k]);
      }
      return _collect(list, 'dub');
    });
  }

  if (!epId) return Promise.reject(new Error('Doramasflix: episodio sin identificador'));
  return Promise.all([
    _gql('detailEpisode', { filter: { _id: epId } }, 'query detailEpisode($filter: FilterFindOneEpisodeInput) { detailEpisode(filter: $filter) { _id links_online } }'),
    _gql('getEpisodeLinks', { id: epId }, 'query getEpisodeLinks($id: MongoID!) { getEpisodeLinks(id: $id) { _id links_online } }')
  ]).then(function (res) {
    var list = [];
    for (var i = 0; i < res.length; i++) {
      var node = (res[i] && (res[i].detailEpisode || res[i].getEpisodeLinks)) || null;
      var links = (node && node.links_online) || [];
      for (var k = 0; k < links.length; k++) list.push(links[k]);
    }
    return _collect(list, 'dub');
  });
}

function _collect(list, kind) {
  var servers = _servers(list, kind);
  if (!servers.length) throw new Error('Doramasflix: sin servidores vivos');

  var picks = servers.slice(0, 10), jobs = [];
  for (var i = 0; i < picks.length; i++) jobs.push(_resolve(picks[i].url, picks[i].kind));

  return Promise.all(jobs).then(function (lists) {
    var out = [], dup = {};
    for (var j = 0; j < lists.length; j++) {
      var arr = lists[j] || [];
      for (var k = 0; k < arr.length; k++) {
        var st = arr[k];
        if (!st || !st.url || dup[st.url]) continue;
        dup[st.url] = 1;
        var tag = picks[j].label;
        var sub = tag !== 'Latino' && tag !== 'Castellano';
        st.kind = sub ? 'sub' : 'dub';
        st.audioLang = sub ? null : 'es';
        st.label = 'Doramasflix · ' + tag + ' · ' + (st.container === 'hls' ? 'HLS' : 'MP4');
        out.push(st);
      }
    }
    if (!out.length) throw new Error('Doramasflix: mirrors sin stream');
    return out;
  });
}
