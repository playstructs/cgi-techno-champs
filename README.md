# techno.structs.zone — Structs for Techno Champs

The [structs-webapp](https://github.com/playstructs/structs-webapp) game client
for Techno Champs' Structs guild (`TECHNO`, guild `0-14`, "Techno Champs of the Alpha Wars").
structs-webapp is a git submodule (`structs-webapp/`, following its `main`) and
its client is built as it is: its own JavaScript, page, styles and art, in
English, with its webpack configuration as the starting point. What this
repository adds is the overlay in [`techno/`](techno/README.md), applied while
webpack reads webapp's sources. Nothing in the submodule is edited, so a newer
structs-webapp builds with the same overlay.

Only the client side is used. This site hosts no guild API of its own: the page
talks straight to the guild's API, its GRASS feed and its chain node, which
`beta.playstructs.com` runs for Techno Champs.

Onboarding and tutorial telemetry is reported with the interface name
`techno.structs.zone`, so these runs can be told apart from other clients' in
the guild's reports (`?interface_name=techno.structs.zone`).

## Setup

```bash
git clone --recurse-submodules <this repository>
npm install          # also installs structs-webapp/src's own dependencies
npm run dev          # http://localhost:5201
```

## Updating structs-webapp

```bash
npm run update:webapp
```

This moves the submodule to the latest `main`, installs its dependencies and
runs the check, which lists what the update touched:

| Report | Meaning | What to do |
|---|---|---|
| `stale` | upstream changed the text a patch replaces | fix the patch in `techno/patches.cjs` |
| `orphan` | a patched upstream file is gone | move or delete its patches |
| `branding` | SN Corp is named somewhere a player sees | add a patch naming Techno Champs |
| `guild` | `techno/public/guild.json` and `GUILD_ID` disagree | fix whichever is wrong |

`npm test` fails while any remain. The build shows stale patches as warnings.
Commit the submodule pointer together with the overlay.

## Profile pictures

Every portrait (the HUD, profile, guild roster, player search, scans, spectator
and device activation) shows the player's own picture, their `pfp` on chain,
when it is a URL a browser can load: `https` (`http` is upgraded), or `ipfs://`,
`ipns://` and `ar://` through the ipfs.io and arweave.net gateways. webapp's
generated portrait stays underneath, and shows when a player has no such
picture or it fails to load (`techno/runtime/pfp.js`). Sector Blitz's public
raid lists are the exception: the guild API sends them only the generated
portrait's attributes.

There is no picture gallery here, as Techno Champs has no collection to pick
from: new players sign up with webapp's generated portrait.

## Sign-up and the player's key

Sign-up has no recovery key section: once the player has chosen their name,
the page makes their account's key (a mnemonic) and creates the account
straight away, with nothing shown, explained or confirmed, and goes on to
Success. If the guild can't create it, the player sees why and can try again
with the same key (`techno/runtime/account.js`).

The Account page has **Download Player** where webapp has **Log Out**: a text
file, `<name>-<player id>.structs-player.txt`, holding the mnemonic this
browser signs with. After sign-up that is the account's own key; after an
account recovery or a device activation it is this browser's device key, which
can recover the player too, for as long as that device stays registered.

## Which guild

The site is Techno Champs': its guild is `0-14`, fixed in `webpack.config.js`
(`GUILD_ID`), and never looked up. Webapp normally asks its guild API which
guild it is (`/guild/this`), but Techno Champs shares SN Corp's API, so the page
asks for `/guild/0-14` instead.

Before webapp's code starts, the page reads `0-14`'s `guild.json` (the
endpoint the guild set on chain, `https://techno.structs.zone/guild.json`,
which this site serves from [`techno/public/guild.json`](techno/public/guild.json))
for its `guild_api`, `grass_nats_websocket` and `client_websocket`
(`techno/runtime/guild.js`). If it can't be read, it uses what it last read,
then the fallback in `webpack.config.js`. Requests carry a bearer token from the
guild's `/api/auth/token` (the same signed login as `/api/auth/login`), since a
guild's session cookie would be third-party here.

Account recovery asks the chain which guild the key's player is in before it
calls the guild API, since a shared API may log in another guild's player. A
player of another guild is moved here first: the key signs
`MsgGuildMembershipJoin` for this guild (allowed when its join minimum is 0),
and recovery goes on once the chain shows the move and the guild API knows the
player. Recovery stops instead when the player owns their guild, the guild asks
a join minimum, or the chain can't be read (`techno/runtime/recovery.js`).

| Variable (build time) | Default | |
|---|---|---|
| `TECHNO_LCD_URL` | `https://public.testnet.structs.network` | the chain node the guild is read from |
| `TECHNO_GUILD_API` | — | a fixed guild API (a local guild in development), skipping guild.json |
| `TECHNO_GRASS_URL`, `TECHNO_CHAIN_WS` | — | override what the guild publishes |

### On chain

| | |
|---|---|
| Guild | `0-14` Techno Champs, tag `TECHNO`, owned by founder player `1-14683` (`structs1jhy5vvanetnu20u6r6jywek09l3chr0k3mrqq7`) |
| Primary reactor | `3-5` LuckyStar (`structsvaloper1ffrjpzylzseuvh04d246gr38cq3g2xnyz3s3qm`) |
| Entry substation | `4-25`, fed by allocation `6-75` from the guild's own stake |
| Joining | open: join minimum 0, invite bypass permissioned |
| Endpoint | `https://techno.structs.zone/guild.json` |
| Sign-up (TSA) | player `1-14684` (`structs186mmxwl87cyg9m5v0xyrj0nr7xzaj7na4xy9r4`), the host's proxy-join signer: 512 (GuildMembership) on `0-14`, 1024 (SubstationConnection) on `4-25` |
| Bank denom | `bear` / `ubear` (in guild.json) |

## Building and serving

```bash
npm run build        # dist/
```

`dist/` is a static site: `index.html` (webapp's game page), `sector-blitz/`
(webapp's public Sector Blitz leaderboard, and one page per sector), the bundles in
`js/` and webapp's `css/`, `img/`, `lottie/` and fonts, plus `guild.json` and
Techno Champs' art in `techno/`. It uses absolute paths, so serve it from the
root of `techno.structs.zone`; it needs nothing else on that domain, but
`guild.json` must be readable cross-origin (`Access-Control-Allow-Origin: *`),
since other clients read it. GitHub Pages sends that header for every file.
`.github/workflows/pages.yml` publishes it there.

## Licences

structs-webapp is Apache-2.0 (Slow Ninja Inc). The badge, logo and icons in
`techno/public/` are drawn with structs-webapp's own typeface by
`techno/make_art.py`.
