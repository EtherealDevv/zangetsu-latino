// JKAnime — fuente Zangetsu (anime sub español).
// Listados en HTML (toplist / dir1 / anime__item); detalle con #uep = último episodio.
// Streams: el player propio de JK (jkplayer/um) entrega m3u8 firmado de playmudos;
// los mirrors del array `servers` se abren con unpacker propio (streamwish/vidhide) o
// con los extractores nativos (mp4upload, streamtape).

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
var SITE = 'https://jkanime.net';
var VERSION = '1.0.0';

function getInfo() {
  return {
    name: 'JKAnime', lang: 'es', baseUrl: SITE,
    logo: SITE + '/favicon.ico', type: 'anime', version: VERSION
  };
}

// ── red ──────────────────────────────────────────────────────────────────────
function _get(url, ref) {
  var h = { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' };
  if (ref) h['Referer'] = ref;
  return fetch(url, { headers: h }).then(function (r) { return r.body || ''; }).catch(function () { return ''; });
}

function _stream(url, quality, ref, kind) {
  var u = String(url).replace(/\\\//g, '/');
  return {
    url: u, quality: quality || 'auto',
    container: /\.m3u8(\?|$)/i.test(u) ? 'hls' : 'mp4',
    headers: { 'User-Agent': UA, 'Referer': ref || SITE + '/' },
    kind: kind || 'sub', audioLang: 'ja', subtitles: []
  };
}

// ── Dean Edwards packer (base-N real) ────────────────────────────────────────
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

function _b64(str) {
  var s = String(str || '').replace(/[^A-Za-z0-9+/=]/g, '');
  var out = '', i = 0;
  var AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  while (i < s.length) {
    var c1 = AL.indexOf(s.charAt(i++)), c2 = AL.indexOf(s.charAt(i++));
    var c3 = AL.indexOf(s.charAt(i++)), c4 = AL.indexOf(s.charAt(i++));
    if (c1 < 0 || c2 < 0) break;
    out += String.fromCharCode((c1 << 2) | (c2 >> 4));
    if (c3 >= 0) out += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
    if (c4 >= 0) out += String.fromCharCode(((c3 & 3) << 6) | c4);
  }
  return out;
}

// ── resolvers ────────────────────────────────────────────────────────────────
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

function _streamtape(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/id=([^&"']+)&token=([^&"']+)&expires=([^&"']+)&ip=([^"'&]+)/);
    if (!m) return [];
    var link = 'https://streamtape.com/get_video?id=' + m[1] + '&token=' + m[2] + '&expires=' + m[3] + '&ip=' + m[4];
    return _get(link, embed).then(function (body) {
      var u = String(body).trim().split(/\s+/)[0] || '';
      if (!u) return [];
      var base = (embed.match(/^(https?:\/\/[^/]+)/) || [])[1] || 'https://streamtape.com';
      if (u.indexOf('//') === 0) u = 'https:' + u;
      else if (u.charAt(0) === '/') u = base + u;
      return /\.mp4/i.test(u) ? [_stream(u, 'auto', embed, kind)] : [];
    });
  });
}

function _dood(embed, ref, kind) {
  var url = String(embed).replace('/d/', '/e/');
  return fetch(url, { headers: { 'User-Agent': UA, 'Referer': ref || SITE + '/' }, browser: true })
    .then(function (r) {
      var body = r.body || '';
      var m = body.match(/\/pass_md5\/[^'"]+/);
      if (!m) return [];
      var base = (String(r.url || url).match(/^(https?:\/\/[^/]+)/) || [])[1] || '';
      var token = m[0].slice(m[0].lastIndexOf('/') + 1);
      return fetch(base + m[0], { headers: { 'User-Agent': UA, 'Referer': String(r.url || url) }, browser: true })
        .then(function (p) {
          var pre = String(p.body || '').replace(/\s+$/, '');
          if (!pre) return [];
          var rand = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          var tail = '';
          for (var i = 0; i < 10; i++) tail += rand.charAt(Math.floor(Math.random() * rand.length));
          return [_stream(pre + tail + '?token=' + token + '&expiry=' + Date.now(), 'auto', base + '/', kind)];
        });
    }).catch(function () { return []; });
}

function _yourupload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/<source[^>]*src="([^"]+\.mp4[^"]*)"/i)
      || html.match(/https?:\/\/[^"'\\\s]*vidcache[^"'\\\s]*\/video\.mp4[^"'\\\s]*/i)
      || html.match(/https?:\/\/[^"'\\\s]+\.mp4(?:[?"'\s]|$)/i);
    return m ? [_stream(String(m[1] || m[0]).replace(/["'\s]+$/, ''), 'auto', embed, kind)] : [];
  });
}

function _resolve(embed, ref, kind) {
  var low = String(embed).toLowerCase();
  if (/mediafire|mega\.nz|1fichier|mega\.co/.test(low)) return Promise.resolve([]);
  try {
    if (/streamwish|hgcloud|awish|vidhide|savefiles|vidara|filelions|callistanise|acek-cdn/.test(low)) return _wish(embed, ref, kind);
    if (/voe\./.test(low)) return _voe(embed, ref, kind);
    if (/mp4upload/.test(low)) return _mp4upload(embed, ref, kind);
    if (/streamtape/.test(low)) return _streamtape(embed, ref, kind);
    if (/yourupload/.test(low)) return _yourupload(embed, ref, kind);
    if (/dood|dsvplay|ds2play|playmogo/.test(low)) return _dood(embed, ref, kind);
  } catch (e) { console.log('resolver: ' + e); }
  return Promise.resolve([]);
}

// ── catálogo ─────────────────────────────────────────────────────────────────
function _cards(html) {
  var out = [], seen = {};
  var chunks = String(html || '').split(/<div\s+class="(?:[^"]*toplist[^"]*|[^"]*dir1[^"]*|[^"]*anime__item[^"]*)"/i);
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i];
    var href = (c.match(/<a[^>]*href="([^"]+)"/i) || [])[1] || '';
    if (!href || href.charAt(0) === '#' || href.indexOf('jkanime.net') < 0) continue;
    var title = htmlText((c.match(/class="[^"]*card-title[^"]*"[^>]*>([\s\S]*?)<\/(?:h5|div)>/i) || [])[1] || '');
    if (!title) title = htmlText((c.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i) || [])[1] || '');
    if (!title) title = htmlText((c.match(/alt="([^"]*)"/i) || [])[1] || '');
    title = title.replace(/\s+-\s+\d+$/, '');
    if (!title) continue;
    var cover = (c.match(/class="[^"]*card-img-top[^"]*"[^>]*src="([^"]+)"/i) || [])[1]
      || (c.match(/src="(https:\/\/cdn\.[^"]+)"/i) || [])[1] || '';
    if (!cover) cover = (c.match(/data-setbg="([^"]+)"/i) || [])[1] || '';
    // la home enlaza al último episodio; el item apunta a la ficha de la serie
    var url = href.replace(/\/\d+\/?$/, '/');
    url = absUrl(url, SITE);
    if (seen[url]) continue;
    seen[url] = 1;
    out.push({ id: url, title: title, cover: cover || null, url: url, type: 'anime', sourceId: __SOURCE_ID });
  }
  return out;
}

function _top() {
  return _get(SITE + '/top', SITE + '/').then(_cards);
}

function getHome() {
  return Promise.all([
    _top().then(function (items) { return { title: 'Top animes', items: items.slice(0, 24) }; }),
    _get(SITE + '/', SITE + '/').then(function (html) {
      return { title: 'Animes recientes', items: _cards(html).slice(0, 24) };
    })
  ]).catch(function () { return []; });
}

function popular(opts) {
  return _top().catch(function () { return []; });
}

function search(query, page) {
  return _get(SITE + '/buscar/' + encodeURIComponent(query), SITE + '/').then(function (html) {
    var items = _cards(html);
    if (items.length) return items;
    // fallback: el buscador nuevo devuelve tarjetas con otro contenedor
    var out = [], seen = {};
    var re = /<a href="(https:\/\/jkanime\.net\/[^"\/]+\/)"><div class="g-0 anime__item__pic[^"]*" data-setbg="([^"]+)"/gi, m;
    while ((m = re.exec(html)) !== null) {
      var url = m[1];
      if (seen[url]) continue;
      seen[url] = 1;
      var tail = html.slice(m.index, m.index + 900);
      var title = htmlText((tail.match(/<h5[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i) || [])[1] || '');
      if (!title) continue;
      out.push({ id: url, title: title, cover: m[2] || null, url: url, type: 'anime', sourceId: __SOURCE_ID });
    }
    return out;
  }).catch(function () { return []; });
}

// ── detalle ──────────────────────────────────────────────────────────────────
function _lastEpisode(html) {
  var uep = (html.match(/id="uep"[^>]*href="([^"]+)"/i) || html.match(/href="([^"]+)"[^>]*id="uep"/i) || [])[1];
  if (uep) {
    var n = uep.match(/\/(\d+)\/?$/);
    if (n) return parseInt(n[1], 10);
  }
  var best = 0, m, re = /href="https:\/\/jkanime\.net\/[^"\/]+\/(\d+)\/?"/gi;
  while ((m = re.exec(html)) !== null) {
    var v = parseInt(m[1], 10);
    if (v > best) best = v;
  }
  return best;
}

function _detail(url) {
  return _get(url, SITE + '/').then(function (html) {
    if (!html) throw new Error('JKAnime: sin respuesta');
    var title = '';
    var infoStart = html.search(/<div\s+class="[^"]*anime_info[^"]*"/i);
    if (infoStart >= 0) {
      title = htmlText((html.slice(infoStart).match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || [])[1] || '');
    }
    if (!title) title = htmlText((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
    title = title.replace(/\s*[-|]\s*(?:JKANIME|JkAnime).*$/i, '').trim();
    if (!title) throw new Error('JKAnime: título no encontrado');

    var cover = (html.match(/class="[^"]*movpic[^"]*"[\s\S]{0,200}?<img[^>]*src="([^"]+)"/i) || [])[1]
      || (html.match(/og:image"\s+content="([^"]+)"/i) || [])[1] || null;
    var desc = htmlText((html.match(/<p class="scroll">([\s\S]*?)<\/p>/i) || [])[1] || '')
      || htmlText((html.match(/meta name="description" content="([^"]*)"/i) || [])[1] || '');

    var genres = [], seenG = {}, g, reG = /<a[^>]*href="[^"]*\/(?:genero|genre)\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((g = reG.exec(html)) !== null) {
      var name = htmlText(g[1]);
      if (name && !seenG[name]) { seenG[name] = 1; genres.push(name); }
    }

    var infoBlock = (html.match(/<div\s+class="[^"]*anime_info[^"]*"([\s\S]{0,3000})/i) || [])[1] || '';
    var status = 'unknown';
    if (/en emisi[oó]n|en emision/i.test(infoBlock)) status = 'ongoing';
    else if (/finalizado|concluido/i.test(infoBlock)) status = 'completed';

    var year = ((html.match(/(19|20)\d{2}/) || [])[0]) || null;

    var last = _lastEpisode(html);
    var eps = [];
    for (var n = 1; n <= last; n++) {
      var epUrl = url.replace(/\/+$/, '') + '/' + n + '/';
      eps.push({ id: epUrl, title: 'Episodio ' + n, number: n, url: epUrl });
    }
    if (!eps.length) eps = [{ id: url, title: title, number: 1, url: url }];

    return {
      id: url, title: title, url: url, cover: cover,
      description: desc, genres: genres, studios: [],
      status: status, year: year, type: 'anime', sourceId: __SOURCE_ID,
      episodes: eps, subCount: eps.length, dubCount: 0
    };
  });
}

function getDetail(url) { return _detail(url); }
function getEpisodes(url) { return _detail(url).then(function (d) { return d.episodes; }); }

// ── streams ──────────────────────────────────────────────────────────────────
function getVideoSources(url) {
  return _get(url, SITE + '/').then(function (html) {
    if (!html) throw new Error('JKAnime: episodio no disponible');

    var jobs = [];

    // 1) player propio de JK — entrega m3u8 firmado
    var m, re = /<iframe[^>]*src="(https:\/\/jkanime\.net\/jkplayer\/[^"]+)"/gi;
    var players = [];
    while ((m = re.exec(html)) !== null) if (players.indexOf(m[1]) < 0) players.push(m[1]);
    for (var p = 0; p < players.length && p < 2; p++) {
      jobs.push((function (pl) {
        var u = pl.replace(/&amp;/g, '&');
        return _get(u, url).then(function (page) {
          var s = _findStream(_unpack(page));
          return s ? [_stream(s, 'auto', SITE + '/', 'sub')] : [];
        }).catch(function () { return []; });
      })(players[p]));
    }

    // 2) mirrors del array `servers` (base64 en `remote`)
    var sm = html.match(/var servers\s*=\s*(\[[\s\S]*?\]);/);
    if (sm) {
      try {
        var arr = JSON.parse(sm[1]);
        for (var i = 0; i < arr.length; i++) {
          var remote = String(arr[i].remote || '').trim();
          var embed = /^https?:\/\//.test(remote) ? remote : _b64(remote).replace(/\s+/g, '');
          if (!embed || !/^https?:\/\//.test(embed)) continue;
          if (/mediafire|mega\.nz|1fichier/i.test(embed)) continue;
          jobs.push(_resolve(embed, url, 'sub'));
        }
      } catch (e) { console.log('servers: ' + e); }
    }

    if (!jobs.length) throw new Error('JKAnime: sin reproductores');

    return Promise.all(jobs).then(function (lists) {
      var out = [], seen = {};
      for (var l = 0; l < lists.length; l++) {
        var arr2 = lists[l] || [];
        for (var k = 0; k < arr2.length; k++) {
          var s = arr2[k];
          if (!s || !s.url || seen[s.url]) continue;
          seen[s.url] = 1;
          s.label = 'JKAnime · ' + (s.container === 'hls' ? 'HLS' : 'MP4');
          out.push(s);
        }
      }
      if (!out.length) throw new Error('JKAnime: mirror sin stream');
      return out;
    });
  });
}
