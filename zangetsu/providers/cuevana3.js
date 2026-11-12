// Cuevana3 — fuente Zangetsu (películas + series, audio latino).
// Frontend Next.js: todo el catálogo vive en __NEXT_DATA__ (pageProps).
//   home  -> tabLastMovies / tabTopMovies / tabLastReleasedMovies
//   ficha -> thisMovie | thisSerie (name, poster, overview, genres, seasons)
//   video -> node.videos.{latino,spanish,english,japanese}[].result
//            = player.cuevana3.eu/... con `var url = '<embed>'` -> resolver local.

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
var SITE = 'https://wv3.cuevana3.eu';
var ALT = ['https://wv3.cuevana3.eu', 'https://www.cuevana3.eu', 'https://cuevana3.ai'];
var VERSION = '1.1.0';
var _base = null;

function getInfo() {
  return {
    name: 'Cuevana3', lang: 'es', baseUrl: SITE,
    logo: SITE + '/favicon.ico', type: 'movie', version: VERSION
  };
}

function _get(url, ref) {
  var h = { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' };
  if (ref) h['Referer'] = ref;
  return fetch(url, { headers: h }).then(function (r) { return r.body || ''; }).catch(function () { return ''; });
}

function _baseUrl() {
  if (_base) return Promise.resolve(_base);
  return _get(SITE + '/').then(function (html) {
    if (html && html.indexOf('__NEXT_DATA__') >= 0) { _base = SITE; return _base; }
    var i = 0;
    function next() {
      if (i >= ALT.length) { _base = SITE; return _base; }
      var cand = ALT[i++];
      return _get(cand + '/').then(function (h) {
        return (h && h.indexOf('__NEXT_DATA__') >= 0) ? (_base = cand, cand) : next();
      });
    }
    return next();
  });
}

function _props(html) {
  var m = String(html || '').match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    var d = JSON.parse(m[1]);
    return (d && d.props && d.props.pageProps) ? d.props.pageProps : null;
  } catch (e) { return null; }
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

function _vimeos(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var s = _findStream(_unpack(html));
    return s ? [_stream(s, 'HD', embed, kind)] : [];
  });
}

function _wish(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    if (!html) return [];
    var s = _findStream(_unpack(html));
    if (s) return [_stream(s, 'auto', embed, kind)];
    var js = (html.match(/src="([^"]*main\.js[^"]*)"/) || [])[1];
    if (!js) return [];
    var abs = js.indexOf('//') === 0 ? 'https:' + js : (js.charAt(0) === '/' ? (embed.match(/^https?:\/\/[^/]+/) || [])[0] + js : js);
    return _get(abs, embed).then(function (bundle) {
      var s2 = _findStream(_unpack(bundle));
      return s2 ? [_stream(s2, 'auto', embed, kind)] : [];
    });
  });
}

function _voe(embed, ref, kind) {
  function step(url, hops) {
    return _get(url, ref).then(function (html) {
      if (!html) return [];
      var s = _findStream(_unpack(html));
      if (s) return [_stream(s, 'auto', url, kind)];
      var next = (html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/) || [])[1];
      if (next && hops > 0) return step(next, hops - 1);
      return [];
    });
  }
  return step(embed, 2);
}

function _mp4upload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/player\.src\(\s*\{[^}]*?src\s*:\s*["']([^"']+)["']/i)
      || html.match(/player\.src\(\s*["']([^"']+)["']/i)
      || html.match(/https?:\/\/[a-z0-9.-]*mp4upload\.com[^"'\\\s]*\/video\.mp4/i);
    return m ? [_stream(String(m[1] || m[0]), 'auto', embed, kind)] : [];
  });
}

function _yourupload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/<source[^>]*src="([^"]+\.mp4[^"]*)"/i)
      || html.match(/https?:\/\/[^"'\\\s]*vidcache[^"'\\\s]*\/video\.mp4[^"'\\\s]*/i)
      || html.match(/https?:\/\/[^"'\\\s]+\.mp4(?:[?"'\s]|$)/i);
    return m ? [_stream(String(m[1] || m[0]).replace(/["'\s]+$/, ''), 'auto', embed, kind)] : [];
  });
}

// streamwish / vidara / filelions family: the page runs a client-side
// jwplayer fed by POST /api/stream {filecode}. One hop, plain JSON, no
// packer — and it works where the Cloudflare-facing hosts do not.
function _api(embed, ref, kind) {
  var u = String(embed).replace(/\\\//g, '/');
  var host = (u.match(/^(https?:\/\/[^/]+)/) || [])[1] || '';
  var parts = u.split('?')[0].split('/').filter(function (x) { return !!x; });
  var code = parts[parts.length - 1] || '';
  if (!host || !code) return Promise.resolve([]);
  var body = JSON.stringify({
    filecode: code, device: 'android',
    codecs: { av1: 'av01.0.09M.10', h265: 'hvc1.1.6.L123.B0' }
  });
  return fetch(host + '/api/stream', {
    method: 'POST',
    headers: {
      'User-Agent': UA, 'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': host, 'Referer': host + '/e/' + code
    },
    body: body
  }).then(function (r) {
    var d = null;
    try { d = JSON.parse(r.body || 'null'); } catch (e) { return []; }
    if (!d || !d.streaming_url) return [];
    var out = [_stream(d.streaming_url, 'HD', embed, kind)];
    var subs = d.subtitles || [];
    for (var i = 0; i < subs.length && i < 4; i++) {
      var t = subs[i];
      if (!t || !t.file_path) continue;
      out[0].subtitles.push({ url: t.file_path, lang: String(t.language || 'en').slice(0, 2).toLowerCase(), label: t.language || null });
    }
    return out;
  }).catch(function () { return []; });
}

function _streamtape(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/id=([^&"']+)&token=([^&"']+)&expires=([^&"']+)&ip=([^"'&]+)/);
    if (!m) return [];
    var link = 'https://streamtape.com/get_video?id=' + m[1] + '&token=' + m[2] + '&expires=' + m[3] + '&ip=' + m[4];
    return _get(link, embed).then(function (body) {
      var u = String(body).trim().split(/\s+/)[0] || '';
      if (!u) return [];
      var b = (embed.match(/^(https?:\/\/[^/]+)/) || [])[1] || 'https://streamtape.com';
      if (u.indexOf('//') === 0) u = 'https:' + u;
      else if (u.charAt(0) === '/') u = b + u;
      return /\.mp4/i.test(u) ? [_stream(u, 'auto', embed, kind)] : [];
    });
  });
}

function _dood(embed, ref, kind) {
  var url = String(embed).replace('/d/', '/e/');
  return fetch(url, { headers: { 'User-Agent': UA, 'Referer': ref || SITE + '/' }, browser: true })
    .then(function (r) {
      var m = (r.body || '').match(/\/pass_md5\/[^'"]+/);
      if (!m) return [];
      var base = (String(r.url || url).match(/^(https?:\/\/[^/]+)/) || [])[1] || '';
      var token = m[0].slice(m[0].lastIndexOf('/') + 1);
      return fetch(base + m[0], { headers: { 'User-Agent': UA, 'Referer': String(r.url || url) }, browser: true })
        .then(function (p) {
          var pre = String(p.body || '').replace(/\s+$/, '');
          if (!pre) return [];
          var rand = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', tail = '';
          for (var i = 0; i < 10; i++) tail += rand.charAt(Math.floor(Math.random() * rand.length));
          return [_stream(pre + tail + '?token=' + token + '&expiry=' + Date.now(), 'auto', base + '/', kind)];
        });
    }).catch(function () { return []; });
}

function _okru(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/data-options="([^"]+)"/);
    if (!m) return [];
    var raw = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    var cfg = null;
    try { cfg = JSON.parse(raw); } catch (e) { return []; }
    var videos = (cfg && cfg.flashvars && cfg.flashvars.metadata && cfg.flashvars.metadata.videos) || [];
    var out = [];
    for (var i = 0; i < videos.length && out.length < 3; i++) {
      if (videos[i] && videos[i].url) out.push(_stream(videos[i].url, 'auto', embed, kind));
    }
    return out;
  });
}

// How fast a mirror actually resolves from a phone. dood/playmogo sit behind
// Cloudflare and never answer inside Z Mode's ~20s source budget.
function _rankLocker(name) {
  var s = String(name || '').toLowerCase();
  if (s.indexOf('vimeos') >= 0) return 0;
  if (s.indexOf('vidara') >= 0) return 1;
  if (/wish|vidhide|filelions|hgcloud|awish|callistanise/.test(s)) return 3;
  if (s.indexOf('mp4upload') >= 0) return 2;
  if (s.indexOf('yourupload') >= 0) return 2;
  if (s.indexOf('streamtape') >= 0) return 4;
  if (s.indexOf('okru') >= 0 || s.indexOf('ok.ru') >= 0) return 5;
  if (s.indexOf('voe') >= 0) return 6;
  if (/dood|playmogo|savefiles|dsvplay|ds2play/.test(s)) return 9;
  return 7;
}

function _resolve(embed, ref, kind) {
  var low = String(embed).toLowerCase();
  if (/mega\.nz|mediafire|1fichier/.test(low)) return Promise.resolve([]);
  try {
    if (low.indexOf('vimeos') >= 0) return _vimeos(embed, ref, kind);
    if (/streamwish|hgcloud|awish|vidhide|savefiles|vidara|filelions|callistanise|acek-cdn/.test(low)) {
      return _api(embed, ref, kind).then(function (out) {
        return out.length ? out : _wish(embed, ref, kind);
      });
    }
    if (/voe\./.test(low)) return _voe(embed, ref, kind);
    if (/mp4upload/.test(low)) return _mp4upload(embed, ref, kind);
    if (/yourupload/.test(low)) return _yourupload(embed, ref, kind);
    if (/streamtape/.test(low)) return _streamtape(embed, ref, kind);
    if (/dood|dsvplay|ds2play|playmogo/.test(low)) return _dood(embed, ref, kind);
    if (/ok\.ru|okru/.test(low)) return _okru(embed, ref, kind);
  } catch (e) { console.log('resolver: ' + e); }
  return Promise.resolve([]);
}

// ── catálogo ─────────────────────────────────────────────────────────────────
function _path(node) {
  var u = node && node.url;
  var s = (u && (u.slug || u.path)) || node.slug || '';
  if (!s) return '';
  if (s.indexOf('http') === 0) return s;
  s = String(s).replace(/^\/+/, '');
  var parts = s.split('/');
  var last = parts[parts.length - 1] || '';
  if (/^movie/i.test(parts[0])) return '/ver-pelicula/' + last;
  if (/^(tv|serie|series)/i.test(parts[0])) return '/ver-serie/' + last;
  return '/' + s;
}

function _item(node, base) {
  var t = (node && node.titles && node.titles.name) || node.name || '';
  if (!t) return null;
  var cover = (node.images && (node.images.poster || node.images.backdrop)) || node.image || null;
  var p = _path(node);
  if (!p) return null;
  var url = absUrl(p, base);
  return { id: url, title: t, cover: cover, url: url, type: 'movie', sourceId: __SOURCE_ID };
}

function _items(list, base) {
  var out = [], seen = {};
  for (var i = 0; i < (list || []).length; i++) {
    var it = _item(list[i], base);
    if (!it || seen[it.url]) continue;
    seen[it.url] = 1;
    out.push(it);
  }
  return out;
}

function _htmlCards(html, base) {
  var out = [], seen = {}, m;
  var re = /<a[^>]*href="(\/(?:pelicula|serie|movie|tv)\/[^"]+)"[^>]*>([\s\S]{0,400}?)<\/a>/gi;
  while ((m = re.exec(html)) !== null) {
    var url = absUrl(m[1], base);
    if (seen[url]) continue;
    var chunk = m[2];
    var title = htmlText((chunk.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i) || [])[1] || '');
    if (!title) title = htmlText((chunk.match(/alt="([^"]*)"/i) || [])[1] || '');
    if (!title) continue;
    seen[url] = 1;
    var cover = (chunk.match(/<img[^>]*src="([^"]+)"/i) || [])[1] || null;
    out.push({ id: url, title: title, cover: cover, url: url, type: 'movie', sourceId: __SOURCE_ID });
  }
  return out;
}

function _page(path) {
  return _baseUrl().then(function (base) {
    return _get(base + path, base + '/').then(function (html) {
      var pp = _props(html);
      if (pp) {
        var flat = [];
        var keys = ['tabLastMovies', 'tabTopMovies', 'tabLastReleasedMovies', 'movies', 'series', 'items', 'posts', 'results'];
        for (var k = 0; k < keys.length; k++) {
          if (Array.isArray(pp[keys[k]])) flat = flat.concat(pp[keys[k]]);
        }
        var items = _items(flat, base);
        if (items.length) return items;
      }
      return _htmlCards(html, base);
    });
  }).catch(function () { return []; });
}

function getHome() {
  return _baseUrl().then(function (base) {
    return _get(base + '/', base + '/').then(function (html) {
      var pp = _props(html);
      if (!pp) return [];
      var rows = [];
      var defs = [
        ['Películas recientes', 'tabLastMovies'],
        ['Top películas', 'tabTopMovies'],
        ['Series', 'series'],
        ['Episodios recientes', 'episodes']
      ];
      for (var i = 0; i < defs.length; i++) {
        var items = _items(pp[defs[i][1]] || [], base).slice(0, 24);
        if (items.length) rows.push({ title: defs[i][0], items: items });
      }
      return rows;
    });
  }).catch(function () { return []; });
}

function popular(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  if (page <= 1) return _page('/peliculas');
  return _page('/peliculas/page/' + page).then(function (list) {
    if (list.length) return list;
    return _page('/peliculas?page=' + page);
  });
}

function search(query, page) {
  var p = page > 1 ? '&page=' + page : '';
  return _page('/search?q=' + encodeURIComponent(query) + p);
}

// ── detalle ──────────────────────────────────────────────────────────────────
function _episodes(pp, base) {
  var serie = pp.thisSerie || pp.serie || null;
  var out = [];
  if (!serie) return out;
  var seasons = serie.seasons || [];
  for (var s = 0; s < seasons.length; s++) {
    var eps = seasons[s].episodes || [];
    for (var e = 0; e < eps.length; e++) {
      var ep = eps[e];
      var slug = ep.slug || {};
      var url = '';
      if (slug.name) {
        url = base + '/episodio/' + slug.name + '-temporada-' + slug.season + '-episodio-' + slug.episode;
      } else if (ep.url && ep.url.slug) {
        url = base + '/episodio/' + String(ep.url.slug).replace(/^\/+/, '');
      }
      if (!url) continue;
      var season = (slug.season !== undefined) ? slug.season : seasons[s].number;
      var num = (slug.episode !== undefined) ? slug.episode : ep.number;
      var label = ep.title || ((season ? 'T' + season + 'x' : '') + num);
      out.push({ id: url, title: label, number: num ? parseFloat(num) : null, url: url });
    }
  }
  out.reverse();
  return out;
}

function _detail(url) {
  return _baseUrl().then(function (base) {
    return _get(url, base + '/').then(function (html) {
      var pp = _props(html);
      if (!pp) throw new Error('Cuevana3: sin __NEXT_DATA__');
      var node = pp.thisMovie || pp.thisSerie || pp.serie || pp.movie;
      if (!node) throw new Error('Cuevana3: sin datos del título');

      var title = (node.titles && node.titles.name) || node.name || '';
      if (!title) throw new Error('Cuevana3: título vacío');
      var cover = (node.images && (node.images.poster || node.images.backdrop)) || null;
      var desc = node.overview || '';
      var genres = [];
      var gs = node.genres || [];
      for (var g = 0; g < gs.length; g++) genres.push(gs[g].name || gs[g]);
      var studios = [];
      var ps = node.productionCompanies || node.companies || [];
      for (var c = 0; c < ps.length; c++) studios.push(ps[c].name || ps[c]);

      var isSerie = !!(pp.thisSerie || pp.serie);
      var eps = isSerie ? _episodes(pp, base) : [];
      if (!isSerie) eps = [{ id: url, title: 'Ver película', number: 1, url: url }];
      if (!eps.length) eps = [{ id: url, title: title, number: 1, url: url }];

      var year = String(node.releaseDate || '').slice(0, 4) || null;

      return {
        id: url, title: title, url: url, cover: cover,
        description: desc, genres: genres, studios: studios,
        status: isSerie ? 'ongoing' : 'completed', year: year, type: 'movie',
        sourceId: __SOURCE_ID, episodes: eps, subCount: 0, dubCount: eps.length
      };
    });
  });
}

function getDetail(url) { return _detail(url); }
function getEpisodes(url) { return _detail(url).then(function (d) { return d.episodes; }); }

// ── streams ──────────────────────────────────────────────────────────────────
function getVideoSources(url) {
  return _baseUrl().then(function (base) {
    return _get(url, base + '/').then(function (html) {
      var pp = _props(html);
      if (!pp) throw new Error('Cuevana3: sin datos del reproductor');
      var node = pp.thisMovie || pp.episode || pp.thisSerie || null;
      if (!node || !node.videos) throw new Error('Cuevana3: sin reproductores');

      var langs = ['latino', 'spanish', 'english', 'japanese'];
      var labels = { latino: 'Latino', spanish: 'Español', english: 'Subtitulado', japanese: 'Japonés' };
      // Budget first, language second: Z Mode allows ~20s per source and
      // Promise.all waits for the slowest mirror, so a dood/playmogo embed
      // that always sits behind Cloudflare would sink the whole resolve.
      // Playable-but-subtitled beats nothing at all.
      var cands = [];
      for (var l = 0; l < langs.length; l++) {
        var list = node.videos[langs[l]] || [];
        for (var i = 0; i < list.length; i++) {
          var entry = list[i];
          if (!entry || !entry.result) continue;
          cands.push({
            player: entry.result,
            locker: String(entry.cyberlocker || ''),
            quality: labels[langs[l]] + (entry.quality ? ' ' + entry.quality : ''),
            lang: langs[l]
          });
        }
      }

      var langRank = { latino: 0, spanish: 1, english: 2, japanese: 3 };
      cands.sort(function (a, b) {
        var la = _rankLocker(a.locker), lb = _rankLocker(b.locker);
        if (la !== lb) return la - lb;
        return (langRank[a.lang] || 9) - (langRank[b.lang] || 9);
      });

      var chosen = [], skipped = 0;
      for (var c = 0; c < cands.length && chosen.length < 4; c++) {
        if (_rankLocker(cands[c].locker) >= 9) { skipped++; continue; }
        chosen.push(cands[c]);
      }
      if (!chosen.length) chosen = cands.slice(0, 2);
      if (skipped) console.log('cuevana3: ' + skipped + ' cloudflare-only mirror(s) skipped');

      var jobs = [];
      for (var j = 0; j < chosen.length; j++) {
        jobs.push((function (playerUrl, q, lang) {
          return _get(playerUrl, url).then(function (page) {
            var m = page.match(/var url\s*=\s*['"]([^'"]+)['"]/i);
            if (!m) return [];
            var embed = m[1].replace(/\\\//g, '/');
            return _resolve(embed, url, lang === 'english' ? 'sub' : 'dub').then(function (streams) {
              for (var k = 0; k < streams.length; k++) streams[k].label = 'Cuevana3 · ' + q;
              return streams;
            });
          }).catch(function () { return []; });
        })(chosen[j].player, chosen[j].quality, chosen[j].lang));
      }

      if (!jobs.length) throw new Error('Cuevana3: sin reproductores');

      return Promise.all(jobs).then(function (lists) {
        var out = [], seen = {};
        for (var a = 0; a < lists.length; a++) {
          var arr = lists[a] || [];
          for (var b = 0; b < arr.length; b++) {
            var s = arr[b];
            if (!s || !s.url || seen[s.url]) continue;
            seen[s.url] = 1;
            out.push(s);
          }
        }
        if (!out.length) throw new Error('Cuevana3: mirror sin stream');
        // Latino audio first, then HLS: the player takes the head of the list.
        out.sort(function (a, b) {
          var ka = (a.kind === 'dub' ? 0 : 1), kb = (b.kind === 'dub' ? 0 : 1);
          if (ka !== kb) return ka - kb;
          var ca = (a.container === 'hls' ? 0 : 1), cb = (b.container === 'hls' ? 0 : 1);
          return ca - cb;
        });
        return out;
      });
    });
  });
}
