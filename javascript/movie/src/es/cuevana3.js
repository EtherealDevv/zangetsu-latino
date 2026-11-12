// Cuevana3 — Mangayomi / Zangetsu extension
// lang: es · películas + series · Next.js __NEXT_DATA__ · players nativos

const mangayomiSources = [
  {
    "name": "Cuevana3",
    "id": 884100211,
    "lang": "es",
    "baseUrl": "https://wv3.cuevana3.eu",
    "iconUrl": "https://www.google.com/s2/favicons?sz=256&domain=https://cuevana3.eu",
    "typeSource": "single",
    "itemType": 1,
    "version": "0.1.0",
    "pkgPath": "javascript/movie/src/es/cuevana3.js",
    "isManga": false,
    "isNsfw": false,
    "hasCloudflare": false,
    "isFullData": false,
    "appMinVerReq": "0.5.0",
    "sourceCodeUrl": "",
    "dateFormat": "",
    "dateFormatLocale": "",
    "additionalParams": "",
    "sourceCodeLanguage": 1,
    "notes": "Películas y series en latino/español. Los players se resuelven con los extractores nativos."
  }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

function absUrl(path, base) {
  if (!path) return "";
  if (path.indexOf("http://") === 0 || path.indexOf("https://") === 0) return path;
  if (path.charAt(0) === "/") return base + path;
  return base + "/" + path;
}

function decodeNextImage(src) {
  if (!src) return "";
  var i = src.indexOf("url=");
  if (src.indexOf("/_next/image") < 0 || i < 0) return src;
  var rest = src.substring(i + 4);
  var amp = rest.indexOf("&");
  if (amp >= 0) rest = rest.substring(0, amp);
  try { return decodeURIComponent(rest); } catch (e) { return rest; }
}

function asArray(x) {
  return Array.isArray(x) ? x : [];
}

function toVideoList(raw) {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch (e) { return []; }
  }
  return Array.isArray(raw) ? raw : asArray(raw.list);
}

class DefaultExtension extends MProvider {
  constructor() {
    super();
    this.client = new Client();
    this.h = {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-419,es;q=0.9,en;q=0.8"
    };
  }

  nextData(html) {
    var m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch (e) { return null; }
  }

  pageProps(html) {
    var d = this.nextData(html);
    if (!d || !d.props || !d.props.pageProps) return null;
    return d.props.pageProps;
  }

  parseList(doc) {
    var out = [];
    var els = doc.select(".TPost.C.hentry");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var a = el.selectFirst("a");
      if (!a) continue;
      var href = a.attr("href") || "";
      var titleEl = el.selectFirst(".Title");
      var name = titleEl ? titleEl.text.trim() : "";
      var img = el.selectFirst("img");
      if (!name && img) name = (img.attr("alt") || "").trim();
      var image = img ? decodeNextImage(img.attr("src") || img.attr("data-src") || "") : "";
      if (!href || !name) continue;
      out.push({ name: name, imageUrl: image, link: absUrl(href, this.source.baseUrl) });
    }
    return out;
  }

  async fetchList(path) {
    var res = await this.client.get(absUrl(path, this.source.baseUrl), this.h);
    return this.parseList(new Document(res.body || ""));
  }

  async getPopular(page) {
    var p = page > 0 ? page : 1;
    var list = [];
    var paths = p === 1 ? ["/"] : ["/peliculas/page/" + p, "/series/page/" + p];
    for (var i = 0; i < paths.length; i++) {
      try { list = list.concat(await this.fetchList(paths[i])); } catch (e) { }
    }
    return { list: list, hasNextPage: list.length > 0 && p < 100 };
  }

  async getLatestUpdates(page) {
    var p = page > 0 ? page : 1;
    var list = [];
    var paths = p === 1 ? ["/peliculas/estrenos", "/series/estrenos"] : ["/peliculas/page/" + p, "/series/page/" + p];
    for (var i = 0; i < paths.length; i++) {
      try { list = list.concat(await this.fetchList(paths[i])); } catch (e) { }
    }
    return { list: list, hasNextPage: list.length > 0 && p < 100 };
  }

  async search(query, page, filters) {
    var p = page > 0 ? page : 1;
    var url = this.source.baseUrl + "/?q=" + encodeURIComponent(query);
    if (p > 1) url += "&page=" + p;
    try {
      var res = await this.client.get(url, this.h);
      var list = this.parseList(new Document(res.body || ""));
      return { list: list, hasNextPage: list.length > 0 && p < 50 };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  chaptersFromSerie(serie) {
    var chapters = [];
    var seasons = asArray(serie.seasons);
    for (var s = 0; s < seasons.length; s++) {
      var eps = asArray(seasons[s].episodes);
      for (var e = 0; e < eps.length; e++) {
        var ep = eps[e];
        var sn = ep.slug || {};
        if (!sn.name) continue;
        var epUrl = this.source.baseUrl + "/episodio/" + sn.name + "-temporada-" + sn.season + "-episodio-" + sn.episode;
        var ch = {
          name: ep.title || ("T" + sn.season + "x" + sn.episode),
          url: epUrl
        };
        var ts = Date.parse(ep.releaseDate || "");
        if (!isNaN(ts)) ch.dateUpload = ts;
        chapters.push(ch);
      }
    }
    chapters.reverse();
    return chapters;
  }

  async getDetail(url) {
    var res = await this.client.get(url, this.h);
    var pp = this.pageProps(res.body || "");
    if (!pp) throw new Error("Sin __NEXT_DATA__ en " + url);

    var node = pp.thisSerie || pp.serie || pp.thisMovie || null;
    var episode = pp.episode || null;
    if (!node) throw new Error("Sin datos de título en " + url);

    var name = (node.titles && node.titles.name) ? node.titles.name : "";
    var imageUrl = (node.images && node.images.poster) ? node.images.poster : "";
    var description = node.overview || "";
    var genre = [];
    var genres = asArray(node.genres);
    for (var i = 0; i < genres.length; i++) genre.push(genres[i].name || genres[i]);

    var cast = asArray(node.cast);
    var author = "";
    for (var c = 0; c < cast.length && c < 3; c++) {
      if (cast[c].name) author += (author ? ", " : "") + cast[c].name;
    }

    var year = (node.releaseDate || "").substring(0, 4);
    if (year) name += " (" + year + ")";

    var isSerie = !!(pp.thisSerie || pp.serie);
    var chapters;
    if (isSerie) {
      chapters = this.chaptersFromSerie(pp.serie || pp.thisSerie);
    } else {
      chapters = [{ name: "Ver película", url: url }];
    }

    return {
      name: name,
      imageUrl: imageUrl,
      description: description,
      author: author,
      artist: "",
      genre: genre,
      status: isSerie ? 0 : 1,
      chapters: chapters
    };
  }

  async resolvePlayer(playerUrl, referer) {
    var res = await this.client.get(playerUrl, {
      "User-Agent": UA,
      "Referer": referer,
      "Accept-Language": "es-419,es;q=0.9"
    });
    var html = res.body || "";
    var m = html.match(/var url = '([^']+)'/);
    if (!m) m = html.match(/var url = "([^"]+)"/);
    if (!m) return { embed: "", videos: [] };
    var embed = m[1];
    var videos = await this.resolveEmbed(embed, referer);
    return { embed: embed, videos: videos };
  }

  async resolveEmbed(embed, referer) {
    var low = embed.toLowerCase();
    var out = [];
    try {
      if (low.indexOf("voe.sx") >= 0) {
        out = toVideoList(await voeExtractor(embed, referer));
      } else if (low.indexOf("streamwish") >= 0 || low.indexOf("hgcloud") >= 0 || low.indexOf("awish") >= 0 || low.indexOf("vidhide") >= 0 || low.indexOf("savefiles") >= 0 || low.indexOf("vidara") >= 0) {
        out = toVideoList(await streamWishExtractor(embed, referer));
      } else if (low.indexOf("filemoon") >= 0 || low.indexOf("bysekoze") >= 0) {
        out = toVideoList(await filemoonExtractor(embed, referer));
      } else if (low.indexOf("dood") >= 0 || low.indexOf("dsvplay") >= 0 || low.indexOf("d0o0d") >= 0) {
        out = toVideoList(await doodExtractor(embed, referer));
      } else if (low.indexOf("yourupload") >= 0) {
        out = toVideoList(await yourUploadExtractor(embed, referer));
      } else if (low.indexOf("ok.ru") >= 0 || low.indexOf("okru") >= 0) {
        out = toVideoList(await okruExtractor(embed));
      } else if (low.indexOf("mp4upload") >= 0) {
        out = toVideoList(await mp4UploadExtractor(embed, referer));
      } else if (low.indexOf("streamtape") >= 0) {
        out = toVideoList(await streamTapeExtractor(embed, referer));
      } else if (low.indexOf("vidbom") >= 0) {
        out = toVideoList(await vidBomExtractor(embed, referer));
      }
    } catch (e) {
      console.log("extractor fallo: " + embed + " :: " + e);
    }
    if (out.length === 0) {
      out = [{ url: embed, originalUrl: embed, quality: "", headers: { "Referer": referer, "User-Agent": UA } }];
    }
    return out;
  }

  async getVideoList(url) {
    var res = await this.client.get(url, this.h);
    var pp = this.pageProps(res.body || "");
    if (!pp) return [];
    var node = pp.thisMovie || pp.episode || null;
    if (!node || !node.videos) return [];

    var langs = ["latino", "spanish", "english", "japanese"];
    var labels = { latino: "Latino", spanish: "Español", english: "Subtitulado", japanese: "Japonés" };
    var out = [];

    for (var l = 0; l < langs.length; l++) {
      var entries = asArray(node.videos[langs[l]]);
      for (var i = 0; i < entries.length; i++) {
        if (out.length >= 8) break;
        var entry = entries[i];
        if (!entry || !entry.result) continue;
        try {
          var played = await this.resolvePlayer(entry.result, url);
          for (var v = 0; v < played.videos.length; v++) {
            var video = played.videos[v];
            var stream = video.url || video.link || "";
            if (!stream) continue;
            var q = labels[langs[l]] || langs[l];
            if (entry.quality) q += " " + entry.quality;
            if (video.quality && video.quality !== "HD") q += " " + video.quality;
            out.push({
              url: stream,
              originalUrl: video.originalUrl || stream,
              quality: q,
              headers: video.headers || { "Referer": url, "User-Agent": UA }
            });
          }
        } catch (e) {
          console.log("player fallo: " + entry.result + " :: " + e);
        }
      }
      if (out.length >= 4) break;
    }
    return out;
  }

  getFilterList() { return []; }

  getSourcePreferences() { return []; }
}

