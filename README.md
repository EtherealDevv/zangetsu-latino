# Latino Pirate Extensions

Extensiones en JavaScript para **Zangetsu / Mangayomi**. Fuentes en español (latino) de películas, series y anime.

## Fuentes incluidas

| Fuente | Tipo | Contenido | Estado |
|---|---|---|---|
| Cuevana3 | Películas / Series | Latino, Español, Subtitulado | ✅ probado |
| PoseidonHD2 | Películas / Series | Latino, Español, Subtitulado | ✅ probado |
| CineCalidad | Películas | Audio latino | ✅ probado |
| TioAnime | Anime | Sub español | ✅ probado |
| MonosChinos | Anime | Sub español | ✅ probado |
| JKAnime | Anime | Sub / Latino | ✅ probado |

Pendientes: **PelisPop** (todos los dominios probados están caídos o parqueados) y **AnimeFLV** (HTTP 522 desde la red actual).

## Agregar el repositorio en la app

1. Abre Zangetsu / Mangayomi.
2. **Extensiones → Repositorios → Agregar repositorio**.
3. Pega la URL del `index.json` de este repo:

```
https://raw.githubusercontent.com/IDRIS/mangayomi-latino-extensions/main/index.json
```

4. Recarga la lista de extensiones e instala las que quieras.

## Prueba local (sin publicar en GitHub)

El repo se puede servir por LAN y agregar desde el teléfono o el PC.

```bash
node scripts/serve.mjs 8777
```

El script imprime las URLs. En la app agrega:

```
http://<IP-DE-TU-PC>:8777/index.json
```

El `index.json` debe apuntar a esa misma base. Se regenera con:

```bash
node scripts/build-index.mjs http://192.168.1.50:8777
```

Si la app rechaza HTTP sin TLS, publica el repo en GitHub y usa la URL `raw.githubusercontent.com`, o levanta un túnel HTTPS (`cloudflared tunnel --url http://localhost:8777`).

## Publicar en GitHub

```bash
git init
git add .
git commit -m "extensiones latinas para mangayomi"
git branch -M main
git remote add origin https://github.com/USUARIO/mangayomi-latino-extensions.git
git push -u origin main
node scripts/build-index.mjs https://raw.githubusercontent.com/USUARIO/mangayomi-latino-extensions/main
git add index.json repo.json
git commit -m "index con URLs de github"
git push
```

## Estructura

```
repo.json                          metadatos del repositorio
index.json                         índice plano que lee la app
javascript/
  movie/src/es/cuevana3.js
  movie/src/es/poseidonhd2.js
  movie/src/es/cinecalidad.js
  anime/src/es/tioanime.js
  anime/src/es/monoschinos.js
  anime/src/es/jkanime.js
scripts/
  build-index.mjs                  genera index.json desde mangayomiSources
  serve.mjs                        servidor estático para probar por LAN
  test-ext.mjs                     smoke test con cheerio y extractores simulados
```

## Pruebas

```bash
npm install
node scripts/test-ext.mjs
node scripts/test-ext.mjs javascript/movie/src/es/cuevana3.js
```

El harness reemplaza `Client`, `Document` y los extractores nativos por stubs. Valida catálogo, búsqueda, detalle y lista de videos de cada fuente. Los extractores reales (`voeExtractor`, `streamWishExtractor`, etc.) solo corren dentro de la app.

## Notas técnicas

- **Cuevana3 / PoseidonHD2**: el detalle y los servidores salen de `__NEXT_DATA__`. El player propio (`player.*/player.php?h=...`) devuelve `var url = '<embed>'`; el embed se entrega al extractor nativo que corresponda.
- **CineCalidad**: Dooplay con opciones `li.dooplay_player_option[data-option]`. Los mirrors `vimeos.net` usan JW Player empaquetado; la extensión lo desempaca en JS puro y saca el `master.m3u8` firmado.
- **TioAnime**: episodios desde `var episodes` y `anime_info`; servidores desde `var videos`.
- **MonosChinos**: lista de capítulos por `section.caplist[data-ajax]`; servidores en `data-player` (base64).
- **JKAnime**: top desde `/top`, búsqueda desde `/buscar/<q>`; servidores desde `var servers` (base64) y `video[]`.
- Los enlaces Mega/Mediafire se descartan: el reproductor interno no los soporta.
