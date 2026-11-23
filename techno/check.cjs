// Checks the overlay against the structs-webapp checkout:
//
//   stale     a patch's upstream text is gone (upstream changed the code it patches)
//   orphan    a patched file no longer exists upstream
//   branding  SN Corp is still named somewhere a player would see it
//   guild     public/guild.json disagrees with the guild webpack.config.js fixes
//
// node techno/check.cjs prints the report; --strict (npm test) fails on any of them.
const fs = require('node:fs');
const path = require('node:path');
const {UPSTREAM_SRC, loadAllPatches, patch} = require('./overlay.cjs');
const {GUILD_ID} = require('../webpack.config.js');

const strict = process.argv.includes('--strict');
const problems = [];
const report = (kind, message) => problems.push(`${kind.padEnd(8)} ${message}`);

for (const [rel, pairs] of Object.entries(loadAllPatches())) {
  const file = path.join(UPSTREAM_SRC, rel);
  if (!fs.existsSync(file)) {
    report('orphan', `${rel} (${pairs.length} patches)`);
    continue;
  }
  patch(rel, fs.readFileSync(file, 'utf8')).stale
    .forEach(text => report('stale', `${rel}: ${JSON.stringify(text).slice(0, 140)}`));
}

// What the player sees: the client's sources (not its tests or generated chain
// types) and the page templates, as the build patches them.
const BRANDING = /SN\.?\s?CORP|SN\.C\b|\bSNC\b|logo-snc|WE KNOW BETTER/i;
const SKIP = /^js\/(ts|tests)\//;
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, out);
    else if (/\.(js|twig)$/.test(entry.name)) out.push(path.relative(UPSTREAM_SRC, file).split(path.sep).join('/'));
  }
  return out;
}
for (const rel of [...walk(path.join(UPSTREAM_SRC, 'js')), ...walk(path.join(UPSTREAM_SRC, 'templates'))]) {
  if (SKIP.test(rel)) continue;
  const lines = patch(rel, fs.readFileSync(path.join(UPSTREAM_SRC, rel), 'utf8')).code.split('\n');
  lines.forEach((line, i) => {
    // CSS classes and element ids keep webapp's names.
    const shown = line.replace(/\b(class|id)="[^"]*"|getElementById\('[^']*'\)|snc-logo[\w-]*/g, '');
    if (BRANDING.test(shown)) report('branding', `${rel}:${i + 1}: ${line.trim().slice(0, 140)}`);
  });
}

const guildJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/guild.json'), 'utf8'));
if (guildJson.guild?.id !== GUILD_ID) {
  report('guild', `public/guild.json is ${guildJson.guild?.id}, webpack.config.js fixes ${GUILD_ID}`);
}

problems.forEach(line => console.log(line));
const count = kind => problems.filter(line => line.startsWith(kind)).length;
console.log(['stale', 'orphan', 'branding', 'guild'].map(kind => `${count(kind)} ${kind}`).join(', '));
if (strict && problems.length) {
  process.exitCode = 1;
}
