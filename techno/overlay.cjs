// Applies the Techno Champs overlay (techno/patches.cjs) to one structs-webapp source file.
//
// Nothing upstream is edited. patches.cjs maps an upstream file to
// [exact upstream text, replacement] pairs, applied as webpack reads the file,
// so a newer structs-webapp builds with the same overlay. Any pair whose text
// upstream no longer contains is reported as stale.
const path = require('node:path');

const UPSTREAM_SRC = path.resolve(__dirname, '../structs-webapp/src');
const PATCHES_FILE = path.join(__dirname, 'patches.cjs');

/** @param {string} file absolute path inside structs-webapp/src */
function upstreamPath(file) {
  return path.relative(UPSTREAM_SRC, file).split(path.sep).join('/');
}

/** @return {Object<string, Array<[string, string]>>} every patch, read fresh */
function loadAllPatches() {
  delete require.cache[PATCHES_FILE];
  return require(PATCHES_FILE);
}

/**
 * One pass over the source, longest text first, so a sentence is replaced
 * whole before any word in it, and no replacement is patched again.
 *
 * @param {string} source
 * @param {Array<[string, string]>} pairs
 * @param {string[]} stale collects the upstream text that was not found
 */
function replaceAll(source, pairs, stale) {
  const live = pairs.filter(([from]) => source.includes(from) || !stale.push(from));
  if (live.length === 0) {
    return source;
  }
  const replacements = new Map(live);
  const alternatives = [...replacements.keys()]
    .sort((a, b) => b.length - a.length)
    .map(text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return source.replace(new RegExp(alternatives.join('|'), 'g'), text => replacements.get(text));
}

/**
 * @param {string} rel upstream path, e.g. js/index.js
 * @param {string} source upstream text
 * @return {{code: string, stale: string[], dependencies: string[]}}
 */
function patch(rel, source) {
  const stale = [];
  const code = replaceAll(source, loadAllPatches()[rel] ?? [], stale);
  return {code, stale, dependencies: [PATCHES_FILE]};
}

module.exports = {UPSTREAM_SRC, PATCHES_FILE, upstreamPath, loadAllPatches, patch};
