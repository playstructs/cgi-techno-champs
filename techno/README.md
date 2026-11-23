# The Techno Champs overlay

Everything in this directory is applied to the `structs-webapp` submodule as it
is built. Nothing in the submodule is edited. The client stays in English;
there is no translation layer.

| Path | What it is |
|---|---|
| `patches.cjs` | `[exact upstream text, replacement]` pairs per upstream file: the guild connection, recovery, the telemetry name, players' own pictures, sign-up without a recovery key, Download Player, and Techno Champs in place of SN Corp in sign-up and the tutorial |
| `runtime/` | Loaded before webapp's entry as `__techno`: `guild` (`guild.js`, the services of the guild the page plays through), `recovery` (`recovery.js`, moving a recovered player of another guild into it), `pfp` (`pfp.js`, every portrait showing the player's `pfp` URL over the generated one) and `account` (`account.js`, creating the account at sign-up without a recovery key section, and Download Player in place of Log Out) |
| `public/` | Static files served over webapp's: `guild.json` (the guild's on-chain endpoint), `favicon.ico`, and `techno/` with `techno.css`, the sign-up badge, the guild logo and icons |
| `page.cjs` | Renders webapp's Twig page (`templates/`) to `index.html`, adding Google Tag Manager (`GTM-58HZKHDD`), the icons and `techno.css` |
| `overlay.cjs`, `loader.cjs` | Apply `patches.cjs` to each source file webpack reads |
| `check.cjs` | `npm run check` / `npm test`: stale or orphaned patches, SN Corp left on screen, guild.json against `GUILD_ID` |
| `make_art.py` | Draws the badge, logo and icons |

## Writing a patch

```js
'js/view_models/signup/Orientation7ViewModel.js': [
  ['on behalf of SN.CORPORATION.`', 'on behalf of TECHNO CHAMPS.`'],
],
```

- The first string is copied exactly from the upstream file; every occurrence
  is replaced, in one pass, longest first.
- Include enough around it (quotes, tags) that it only matches what you mean,
  never an id, class, storage key or anything sent to the guild or the chain.
  CSS classes such as `snc-logo` keep webapp's names.
- One key per upstream file: a second entry for the same file replaces the
  first.

## The art

`make_art.py` (needs Pillow) draws Techno Champs' logo: the guild's name in webapp's Extreme Hazard typeface under an equalizer. The badge
is that in white in the top of a 384px square, the shape of webapp's 192px
sign-up logo slot, with "OF THE ALPHA WARS." set under it by webapp's own motto
line. `techno-champs-logo.png` is the same at 512px for `guild.json`, and the
icons are the equalizer alone.
