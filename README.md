# Telegram Web A

This fork combines the complete Telegram Web A client with Thread project workflows. Telegram remains the primary
interface; Thread adds project selection, source-linked task drafts, and Linear delivery directly to message actions.

## Thread integration

- Open **Projects & Linear** from Telegram's main menu to create/select a project and connect Linear.
- Open a message context menu and choose **Create Linear task** to build an editable draft from that message.
- Every task stores its Telegram source metadata. Public/group sources include a direct `t.me` link in the Linear issue.
- `thread-server/` contains the account, Convex persistence, assistant, encrypted integration, and Linear MCP services
  imported from `telergamThread`.

The Telegram MTProto session stays in the Telegram client. Thread has its own HttpOnly account session for project
membership and Linear access; Linear credentials remain encrypted on the server.

This project won the first prize 🥇 at [Telegram Lightweight Client Contest](https://contest.com/javascript-web-3) and now is an official Telegram client available to anyone at [web.telegram.org/a](https://web.telegram.org/a).

According to the original contest rules, it has nearly zero dependencies and is fully based on its own [Teact](https://github.com/Ajaxy/teact) framework (which re-implements React paradigm). It also uses a custom version of [GramJS](https://github.com/gram-js/gramjs) as an MTProto implementation.

The project incorporates lots of technologically advanced features, modern Web APIs and techniques: WebSockets, Web Workers and WebAssembly, multi-level caching and PWA, voice recording and media streaming, cryptography and raw binary data operations, optimistic and progressive interfaces, complicated CSS/Canvas/SVG animations, reactive data streams, and so much more.

Feel free to explore, provide feedback and contribute.

## Local setup

Use Node.js 24.11+ and npm 11+.

```sh
mv .env.example .env

npm i
```

Obtain API ID and API hash on [my.telegram.org](https://my.telegram.org) and populate the `.env` file.

## Dev mode

```sh
npm run dev
```

For the integrated client, install the server workspace, configure `thread-server/.env.local`, start Convex once, and
run both processes:

```sh
npm --prefix thread-server ci
cd thread-server && npx convex dev --once && cd ..
npm run dev:integrated
```

Vite serves Telegram at `http://127.0.0.1:1234` and proxies `/api` to Thread on `http://127.0.0.1:4317`.

For a production-style local run, build Telegram and let the Thread server serve `dist/` on the same origin:

```sh
npm run build:production
npm run thread:start
```

The build requires real `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` values in the root `.env`.

## Updating from Telegram Web A

The repository keeps upstream code and product changes on separate branches:

- `master` is a clean mirror of `Ajaxy/telegram-tt` and tracks `upstream/master`.
- `product/thread` is the shipped application: upstream plus the Thread UI and `thread-server/`.
- `legacy/master-pre-migration` and `backup/legacy-2026-08-24` preserve the pre-migration repository.

Pull a Telegram update into the product branch with a merge commit so both histories remain visible:

```sh
git fetch upstream --prune
git switch master
git merge --ff-only upstream/master
git switch product/thread
git merge --no-ff master

npm ci
npm --prefix thread-server ci
npm run check:ts
npm run check:css
npm test
npm run build:mocked
npm run thread:check
```

Do not edit generated `dist/` files while resolving a merge. Resolve source conflicts first, then rebuild. When upstream
introduces an equivalent interface feature, prefer its native component and keep only the Thread-specific behavior. For
example, folder placement now uses Telegram's native `foldersPosition`; the migration only maps the older stored setting.

Keep new product work in focused commits on `product/thread`. Small commits let Git reuse prior resolutions and make it
clear whether a conflict belongs to Telegram upstream, the Thread overlay, or generated output.

### Invoking API from console

Start your dev server and locate GramJS worker in the console context.

All constructors and functions available in global `GramJs` variable.

Run `npm run gramjs:tl full` to get access to all available Telegram methods.

Example usage:
``` javascript
await invoke(new GramJs.help.GetAppConfig())
```

### Dependencies
* [GramJS](https://github.com/gram-js/gramjs) ([MIT License](https://github.com/gram-js/gramjs/blob/master/LICENSE))
* [fflate](https://github.com/101arrowz/fflate) ([MIT License](https://github.com/101arrowz/fflate/blob/master/LICENSE))
* [cryptography](https://github.com/spalt08/cryptography) ([Apache License 2.0](https://github.com/spalt08/cryptography/blob/master/LICENSE))
* [emoji-data](https://github.com/iamcal/emoji-data) ([MIT License](https://github.com/iamcal/emoji-data/blob/master/LICENSE))
* [twemoji-parser](https://github.com/jdecked/twemoji-parser) ([MIT License](https://github.com/jdecked/twemoji-parser/blob/master/LICENSE.md))
* [tlottie](https://github.com/dkaraush/tlottie) ([MIT License](https://github.com/dkaraush/tlottie/))
* [opus-recorder](https://github.com/chris-rudmin/opus-recorder) ([Various Licenses](https://github.com/chris-rudmin/opus-recorder/blob/master/LICENSE.md))
* [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) ([MIT License](https://github.com/kozakdenys/qr-code-styling/blob/master/LICENSE))
* [music-metadata](https://github.com/Borewit/music-metadata) ([MIT License](https://github.com/Borewit/music-metadata/blob/master/LICENSE.txt))
* [Tiptap](https://github.com/ueberdosis/tiptap) ([MIT License](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md))
* [marked](https://github.com/markedjs/marked) ([MIT License](https://github.com/markedjs/marked/blob/master/LICENSE.md))
* [lowlight](https://github.com/wooorm/lowlight) ([MIT License](https://github.com/wooorm/lowlight/blob/main/license))
* [idb-keyval](https://github.com/jakearchibald/idb-keyval) ([Apache License 2.0](https://github.com/jakearchibald/idb-keyval/blob/main/LICENCE))
* [fasttextweb](https://github.com/karmdesai/fastTextWeb)
* fastblur

## Bug reports and Suggestions
If you find an issue with this app, let Telegram know using the [Suggestions Platform](https://bugs.telegram.org/c/4002).
