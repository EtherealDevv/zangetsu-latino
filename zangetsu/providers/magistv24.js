// MagisTV 24 — fuente Zangetsu (películas y series, audio latino).
// WordPress tema torofilm: temporadas por admin-ajax y reproductor fastream
// (iframe -> Dean Edwards packer -> m3u8 firmado).

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
var SITE = 'https://magistv24.com';
var VERSION = '1.0.0';

function getInfo() {
  return {
    name: 'MagisTV 24', lang: 'es', baseUrl: SITE,
    logo: SITE + '/favicon.ico', type: 'movie', version: VERSION
  };
}

// ── red ──────────────────────────────────────────────────────────────────────
function _get(url, ref, extra) {
  var h = { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' };
  if (ref) h['Referer'] = ref;
  if (extra) { for (var k in extra) h[k] = extra[k]; }
  return fetch(url, { headers: h }).then(function (r) { return r.body || ''; }).catch(function () { return ''; });
}

function _post(url, body, ref) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': SITE, 'Referer': ref || SITE + '/'
    },
    body: body
  }).then(function (r) { return r.body || ''; }).catch(function () { return ''; });
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

// ── Dean Edwards packer (base-N real, no el de 36 fijo) ──────────────────────
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

function _findStream(code) {
  var m = code.match(/["']file["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i);
  if (!m) m = code.match(/https?:\/\/[^"'\\\s]+\.m3u8[^"'\\\s]*/i);
  return m ? String(m[1] || m[0]).replace(/\\\//g, '/') : '';
}

// ── reproductor ──────────────────────────────────────────────────────────────
// fastream: el embed trae un solo <script> empacado; al desenvolverlo aparece
// el master.m3u8 con token de sesión. No hay API JSON, sólo el packer.
function _fastream(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    if (!html) return [];
    var s = _findStream(_unpack(html));
    if (!s) return [];
    return [_stream(s, 'HD', embed, kind)];
  });
}

// El wrapper ?trembed=N no hace más que pintar un iframe al host real.
function _embed(pageUrl, ref, kind) {
  return _get(pageUrl, ref).then(function (html) {
    var m = html.match(/<iframe[^>]*src=["']([^"']+)["']/i) || html.match(/SRC=["']([^"']+)["']/i);
    var src = m ? m[1] : '';
    if (!src) return [];
    var u = src.indexOf('//') === 0 ? 'https:' + src : src;
    u = u.replace(/&amp;/g, '&');
    return _fastream(u, pageUrl, kind);
  });
}

// ── catálogo ─────────────────────────────────────────────────────────────────
function _cards(html) {
  var out = [], seen = {};
  var chunks = String(html || '').split(/<article\b[^>]*>/i);
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i].split(/<\/article>/i)[0];
    var href = (c.match(/<a[^>]*class="lnk-blk"[^>]*href="([^"]+)"/i)
      || c.match(/<a[^>]*href="([^"]+)"[^>]*class="lnk-blk"/i)
      || c.match(/href="(https?:\/\/[^"]*\/(?:pelicula|serie)\/[^"]+)"/i)
      || [])[1] || '';
    if (!href || /\/capitulo\//.test(href)) continue;
    var url = absUrl(href, SITE);
    if (!url || seen[url]) continue;
    var title = htmlText((c.match(/class="entry-title"[^>]*>([\s\S]*?)<\/(?:h2|h3|div)>/i) || [])[1] || '');
    var img = c.match(/<img\b[^>]*>/i);
    if (!title && img) title = htmlText((img[0].match(/alt="([^"]*)"/i) || [])[1] || '');
    if (!title) continue;
    var cover = img ? ((img[0].match(/data-src="([^"]+)"/i) || img[0].match(/src="([^"]+)"/i) || [])[1] || '') : '';
    if (cover && cover.indexOf('//') === 0) cover = 'https:' + cover;
    seen[url] = 1;
    out.push({ id: url, title: title, cover: cover || null, url: url, type: 'movie', sourceId: __SOURCE_ID });
  }
  return out;
}

function _list(path) {
  return _get(SITE + path, SITE + '/').then(_cards);
}

function getHome() {
  return Promise.all([
    _list('/').then(function (items) { return { title: 'Estrenos', items: items }; }),
    _list('/cartelera-series/').then(function (items) { return { title: 'Series', items: items }; })
  ]).catch(function () { return []; });
}

function popular(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  return _list(page > 1 ? '/page/' + page + '/' : '/').catch(function () { return []; });
}

// ── emparejado de títulos ────────────────────────────────────────────────────
// Z Mode pide con el título de TMDB ("The Simpsons") y el sitio indexa el
// español ("Los Simpson"); rechaza la fuente ante cualquier diferencia. Marcar
// `englishTitle` con la consulta en el resultado que la cubre hace que el
// matcher lo acepte, y el orden deja delante la obra real.
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
    // Una sola palabra en común no basta: "Project Hail Mary" encontraría
    // "Proud Mary". Con hasta tres palabras se exigen todas; con más, el 75%.
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

function _searchOnce(q, page) {
  var p = page > 1 ? '&paged=' + page : '';
  return _get(SITE + '/?s=' + encodeURIComponent(q) + p, SITE + '/').then(_cards).catch(function () { return []; });
}

function _searchFallbacks(query) {
  var out = [];
  var low = _zNorm(query);
  var bare = low.replace(/^(the|a|an|el|la|los|las|un|una) /, '');
  if (bare && bare !== low) out.push(bare);
  var stem = bare.split(' ').map(function (t) {
    return (t.length > 4 && /s$/.test(t)) ? t.slice(0, -1) : t;
  }).join(' ');
  if (stem && stem !== bare && out.indexOf(stem) < 0) out.push(stem);
  return out.slice(0, 2);
}

function _hasExact(items, query) {
  var q = _zNorm(query);
  for (var i = 0; i < items.length; i++) if (_zNorm(items[i].title) === q) return true;
  return false;
}

function _merge(lists) {
  var out = [], seen = {};
  for (var l = 0; l < lists.length; l++) {
    var arr = lists[l] || [];
    for (var k = 0; k < arr.length; k++) {
      var it = arr[k];
      if (!it || !it.url || seen[it.url]) continue;
      seen[it.url] = 1; out.push(it);
    }
  }
  return out;
}

// El buscador de WordPress no recorta plurales ni artículos: "The Simpsons"
// devuelve dos especiales, "Simpson" devuelve la serie. Los recortes se piden
// EN PARALELO y se funden con el resultado original en vez de reemplazarlo.
function search(query, page) {
  return _searchOnce(query, page).then(function (first) {
    if (_hasExact(first, query)) return _zAlias(first, query);
    var alts = _searchFallbacks(query);
    if (!alts.length) return _zAlias(first, query);
    var jobs = [Promise.resolve(first)];
    for (var i = 0; i < alts.length; i++) jobs.push(_searchOnce(alts[i], page));
    return Promise.all(jobs).then(function (lists) { return _zAlias(_merge(lists), query); });
  });
}

// ── detalle ──────────────────────────────────────────────────────────────────
function _genres(html) {
  var out = [], seen = {}, m, re = /<a[^>]*href="[^"]*\/genero\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = re.exec(html)) !== null) {
    var g = htmlText(m[1]);
    if (g && !seen[g]) { seen[g] = 1; out.push(g); }
  }
  return out;
}

function _clean(s) {
  return htmlText(s).replace(/^\s*(ver|descargar)\s+/i, '')
    .replace(/\s*[-–|]\s*(magistv\s*24|magistv24).*$/i, '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
}

// Una tarjeta de episodio: <span class="num-epi">2x1</span> + entry-title +
// enlace a /capitulo/...
function _episodes(html, seriesTitle) {
  var out = [], seen = {}, m;
  var re = /<article[^>]*class="[^"]*episodes[^"]*"[\s\S]{0,1400}?<\/article>/gi;
  while ((m = re.exec(html)) !== null) {
    var c = m[0];
    var url = absUrl((c.match(/href="([^"]*\/capitulo\/[^"]+)"/i) || [])[1] || '', SITE);
    if (!url || seen[url]) continue;
    seen[url] = 1;
    var num = htmlText((c.match(/class="num-epi"[^>]*>([^<]+)</i) || [])[1] || '');
    var name = htmlText((c.match(/class="entry-title"[^>]*>([\s\S]*?)<\/(?:h2|h3|div)>/i) || [])[1] || '');
    var label = num;
    if (!label) label = name;
    else if (name) {
      var low = name.toLowerCase();
      var st = String(seriesTitle || '').toLowerCase();
      if (!st || low.indexOf(st) !== 0) label = num + ' · ' + name;
    }
    out.push({ id: url, title: label, number: null, url: url });
  }
  return out;
}

function _num(ep) {
  var m = String(ep.title || '').match(/^(\d+)x(\d+)/);
  if (!m) return [9999, 9999];
  return [parseInt(m[1], 10), parseInt(m[2], 10)];
}

function _sortEps(list) {
  return list.sort(function (a, b) {
    var x = _num(a), y = _num(b);
    if (x[0] !== y[0]) return x[0] - y[0];
    if (x[1] !== y[1]) return x[1] - y[1];
    return 0;
  });
}

function _seasons(html) {
  var out = [], seen = {}, m, re = /data-season="(\d+)"/g, post = '';
  post = (html.match(/data-post="(\d+)"/) || [])[1] || '';
  while ((m = re.exec(html)) !== null) {
    var n = parseInt(m[1], 10);
    if (seen[n]) continue;
    seen[n] = 1; out.push(n);
  }
  out.sort(function (a, b) { return a - b; });
  return { list: out, post: post };
}

function _seasonEps(post, season, title) {
  var body = 'action=action_select_season&season=' + season + '&post=' + post;
  return _post(SITE + '/wp-admin/admin-ajax.php', body, SITE + '/serie/').then(function (html) {
    return _episodes(html, title);
  });
}

function _detail(url) {
  return _get(url, SITE + '/').then(function (html) {
    if (!html) throw new Error('MagisTV24: sin respuesta');

    var title = _clean((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
    if (!title) title = _clean((html.match(/property="og:title" content="([^"]+)"/i) || [])[1] || '');
    if (!title) title = _clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');

    var cover = (html.match(/property="og:image" content="([^"]+)"/i) || [])[1]
      || (html.match(/<img\b[^>]*src="(\/\/image\.tmdb\.org[^"]+)"/i) || [])[1] || '';
    if (cover.indexOf('//') === 0) cover = 'https:' + cover;

    var desc = (html.match(/property="og:description" content="([^"]*)"/i) || [])[1]
      || (html.match(/name="description" content="([^"]*)"/i) || [])[1] || '';
    desc = htmlText(desc);
    if (/^(ver|descargar)\s/i.test(desc)) desc = '';

    var year = ((html.match(/property="article:published_time" content="(\d{4})/i) || [])[1])
      || ((html.match(/<span class="year"[^>]*>(\d{4})</i) || [])[1]) || null;

    var s = _seasons(html);
    var inline = _episodes(html, title);
    var isSerie = /\/serie\//i.test(url) || s.list.length > 1;

    var epsPromise;
    if (isSerie && s.post && s.list.length > 1) {
      var seasons = s.list.slice(0, 40);
      var jobs = [];
      for (var i = 0; i < seasons.length; i++) jobs.push(_seasonEps(s.post, seasons[i], title));
      epsPromise = Promise.all(jobs).then(function (lists) {
        var all = [], seen = {};
        for (var l = 0; l < lists.length; l++) {
          var arr = lists[l] || [];
          for (var k = 0; k < arr.length; k++) {
            if (!arr[k].url || seen[arr[k].url]) continue;
            seen[arr[k].url] = 1; all.push(arr[k]);
          }
        }
        return _sortEps(all.length ? all : inline);
      }).catch(function () { return inline; });
    } else {
      epsPromise = Promise.resolve(inline);
    }

    return epsPromise.then(function (eps) {
      if (!eps.length) eps = [{ id: url, title: 'Ver película', number: 1, url: url }];
      return {
        id: url, title: title, url: url, cover: cover || null,
        description: desc, genres: _genres(html), studios: [],
        status: isSerie ? 'ongoing' : 'completed', year: year,
        type: 'movie', sourceId: __SOURCE_ID,
        episodes: eps, subCount: 0, dubCount: eps.length
      };
    });
  });
}

function getDetail(url) { return _detail(url); }
function getEpisodes(url) { return _detail(url).then(function (d) { return d.episodes; }); }

// ── streams ──────────────────────────────────────────────────────────────────
function getVideoSources(url) {
  return _get(url, SITE + '/').then(function (html) {
    if (!html) throw new Error('MagisTV24: sin respuesta');
    // El tema repite los mismos embeds y los sirve con la entidad &#038;.
    var norm = html.replace(/&#0?38;/g, '&').replace(/&amp;/g, '&');
    var re = /trembed=(\d+)&trid=(\d+)&trtype=(\d+)/g, m, seen = {}, embeds = [];
    while ((m = re.exec(norm)) !== null) {
      var key = m[2] + '/' + m[3] + '/' + m[1];
      if (seen[key]) continue;
      seen[key] = 1;
      embeds.push(SITE + '/?trembed=' + m[1] + '&trid=' + m[2] + '&trtype=' + m[3]);
    }
    if (!embeds.length) throw new Error('MagisTV24: sin reproductores');

    var chosen = embeds.slice(0, 4);
    var jobs = [];
    for (var i = 0; i < chosen.length; i++) jobs.push(_embed(chosen[i], url, 'dub'));
    return Promise.all(jobs).then(function (lists) {
      var out = [], dup = {};
      for (var l = 0; l < lists.length; l++) {
        var arr = lists[l] || [];
        for (var k = 0; k < arr.length; k++) {
          var s = arr[k];
          if (!s || !s.url || dup[s.url]) continue;
          dup[s.url] = 1;
          s.label = 'MagisTV · ' + (s.container === 'hls' ? 'HLS' : 'MP4');
          out.push(s);
        }
      }
      if (!out.length) throw new Error('MagisTV24: mirror sin stream');
      return out;
    });
  });
}
