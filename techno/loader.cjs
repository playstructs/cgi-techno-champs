// Webpack loader: the Techno Champs overlay for structs-webapp's client sources.
const {patch, upstreamPath} = require('./overlay.cjs');

module.exports = function technoLoader(source) {
  const rel = upstreamPath(this.resourcePath);
  const {code, stale, dependencies} = patch(rel, source);
  dependencies.forEach(file => this.addDependency(file));
  for (const text of stale) {
    this.emitWarning(new Error(`techno: ${rel} no longer contains ${JSON.stringify(text)}`));
  }
  return code;
};
