// Renders structs-webapp's pages to static HTML, with the Techno Champs overlay
// applied: the game (templates/game/index.html.twig on templates/base.html.twig)
// and the public Sector Blitz leaderboard (templates/sector_blitz/index.html.twig),
// once for /sector-blitz and once per sector, as webapp's routes serve it.
//
// Only what those templates use is understood: blocks, comments, path() of
// their routes, the sector and the webpack asset() call. Anything else
// Twig-shaped stops the build, so a template change upstream is noticed rather
// than shipped half-rendered.
const fs = require('node:fs');
const path = require('node:path');
const {UPSTREAM_SRC, patch} = require('./overlay.cjs');

const BASE = 'templates/base.html.twig';
const GAME = 'templates/game/index.html.twig';
const LEADERBOARD = 'templates/sector_blitz/index.html.twig';
const LEADERBOARD_CONTROLLER = 'src/Controller/SectorBlitzController.php';
const BLOCK = /{%\s*block\s+(\w+)\s*%}([\s\S]*?){%\s*endblock\s*%}/g;

// Symfony's routes, as this site serves them.
const ROUTES = {app_game: '/', app_sector_blitz: '/sector-blitz'};

// Google Tag Manager, high in <head> as Google asks.
const TRACKING = `<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-58HZKHDD"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        </script>
        `;

// The game's; the leaderboard's template has its own.
const DESCRIPTION = `<meta name="description" content="Techno Champs of the Alpha Wars: the Techno Champs guild in Structs.">
        `;

const HEAD = `<link rel="icon" href="/favicon.ico" sizes="48x48">
        <link rel="icon" type="image/png" href="/techno/img/favicon-32x32.png" sizes="32x32">
        <link rel="apple-touch-icon" href="/techno/img/apple-touch-icon.png">
        <link rel="stylesheet" href="/techno/techno.css">
    </head>`;

function read(rel, stale) {
  const result = patch(rel, fs.readFileSync(path.join(UPSTREAM_SRC, rel), 'utf8'));
  result.stale.forEach(text => stale.push(`${rel} no longer contains ${JSON.stringify(text)}`));
  return result.code.replace(/{#[\s\S]*?#}/g, '');
}

/**
 * @param {string} indexBundle the built entry, relative to the site root
 * @return {{html: string, stale: string[], dependencies: string[]}}
 */
function renderPage(indexBundle) {
  const stale = [];
  const child = read(GAME, stale);
  const blocks = {};
  for (const [, name, body] of child.matchAll(BLOCK)) {
    blocks[name] = body;
  }

  const html = finish(read(BASE, stale)
    .replace(BLOCK, (match, name, fallback) => blocks[name] ?? fallback)
    .replace(/{{\s*asset\('js\/index\.js',\s*'webpack'\)\s*}}/g, '/' + indexBundle), DESCRIPTION);

  const dependencies = [BASE, GAME].map(rel => path.join(UPSTREAM_SRC, rel));
  return {html, stale, dependencies};
}

/** @return {string[]} the sectors with a page of their own, from the route's requirement */
function leaderboardSectors() {
  const controller = fs.readFileSync(path.join(UPSTREAM_SRC, LEADERBOARD_CONTROLLER), 'utf8');
  const requirement = controller.match(/'\/sector-blitz\/{sector}'[^\n]*'sector'\s*=>\s*'([\d|]+)'/);
  if (!requirement) {
    throw new Error(`techno: page: no sector requirement in ${LEADERBOARD_CONTROLLER}`);
  }
  return requirement[1].split('|');
}

/**
 * @param {string} bundle the built sectorBlitz entry, relative to the site root
 * @return {{pages: Object<string, string>, stale: string[], dependencies: string[]}} html by output path
 */
function renderLeaderboard(bundle) {
  const stale = [];
  const template = read(LEADERBOARD, stale)
    .replace(/{{\s*path\('(\w+)'\)\s*}}/g, (match, route) => {
      if (!(route in ROUTES)) throw new Error(`techno: page: unknown route ${route}`);
      return ROUTES[route];
    })
    .replace(/{{\s*asset\('js\/sectorBlitz\.js',\s*'webpack'\)\s*}}/g, '/' + bundle);
  const page = sector => finish(template.replace(/{{\s*sector\s*\?\?\s*''\s*}}/g, sector));
  const pages = {'sector-blitz/index.html': page('')};
  for (const sector of leaderboardSectors()) {
    pages[`sector-blitz/${sector}/index.html`] = page(sector);
  }
  const dependencies = [LEADERBOARD, LEADERBOARD_CONTROLLER].map(rel => path.join(UPSTREAM_SRC, rel));
  return {pages, stale, dependencies};
}

/** Adds tracking, the icons and the overlay's styles, and checks that no Twig is left. */
function finish(html, description = '') {
  html = html
    .replace('<title>', TRACKING + '<title>')
    .replace('</head>', description + HEAD);

  const leftover = html.match(/{[{%][\s\S]*?[}%]}/);
  if (leftover) {
    throw new Error(`techno: page: unrendered Twig ${JSON.stringify(leftover[0])}`);
  }
  return html;
}

module.exports = {renderPage, renderLeaderboard};
