# preset-maker

A web app for building RS3 presets and inventories, built with Vite.

Production URL: https://pvme.github.io/preset-maker/

## Getting started

Install dependencies:

```sh
yarn install
```

Run a local development front-end server connected to a local back-end server:

```sh
yarn run dev
```

Run a local development front-end server connected to the production back-end server:

```sh
yarn run dev:prod
```

Build & push to repo (branch: gh-pages)

```sh
npm run deploy
```

## Sorting JSON

To sort everything:

```sh
yarn run sort-all
```

To sort new items:

```sh
yarn run sort-items
```

To sort new relics:

```sh
yarn run sort-relics
```

To sort new familiars:

```sh
yarn run sort-familiars
```
