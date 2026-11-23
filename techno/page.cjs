// Renders structs-webapp's game page (templates/game/index.html.twig on
// templates/base.html.twig) to static HTML, with the Techno Champs overlay applied.
//
// Only what those two templates use is understood: blocks, comments and the
// webpack asset() call. Anything else Twig-shaped stops the build, so a
// template change upstream is noticed rather than shipped half-rendered.
const fs = require('node:fs');
const path = require('node:path');
const {UPSTREAM_SRC, patch} = require('./overlay.cjs');

const BASE = 'templates/base.html.twig';
const GAME = 'templates/game/index.html.twig';
const BLOCK = /{%\s*block\s+(\w+)\s*%}([\s\S]*?){%\s*endblock\s*%}/g;

// Google Tag Manager, high in <head> as Google asks.
const TRACKING = `<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-58HZKHDD"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        </script>
        `;

const HEAD = `<meta name="description" content="Techno Champs of the Alpha Wars: the Techno Champs guild in Structs.">
        <link rel="icon" href="/favicon.ico" sizes="48x48">
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

  let html = read(BASE, stale)
    .replace(BLOCK, (match, name, fallback) => blocks[name] ?? fallback)
    .replace(/{{\s*asset\('js\/index\.js',\s*'webpack'\)\s*}}/g, '/' + indexBundle)
    .replace('<title>', TRACKING + '<title>')
    .replace('</head>', HEAD);

  const leftover = html.match(/{[{%][\s\S]*?[}%]}/);
  if (leftover) {
    throw new Error(`techno: page: unrendered Twig ${JSON.stringify(leftover[0])}`);
  }

  const dependencies = [BASE, GAME].map(rel => path.join(UPSTREAM_SRC, rel));
  return {html, stale, dependencies};
}

module.exports = {renderPage};
