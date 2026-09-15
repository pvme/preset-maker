# Preset Maker

A PvME web app for building, editing, and sharing RuneScape 3 presets.

🌐 https://pvme.github.io/preset-maker/

This app is the front-end part of a trio, alongside https://github.com/pvme/preset-maker-storage and https://github.com/pvme/preset-maker-api

Emojis are pulled from https://github.com/pvme/pvme-settings/blob/master/emojis/emojis_v2.json

---

## Overview

* Build full presets (inventory, equipment, relics, familiar, etc.)
* Drag & drop items between slots
* Add notes (per-slot and overall)
* Search items via emoji + fuzzy search
* Export as image or JSON
* Share via cloud links

---

## Storage Modes

**Local**

* Stored in browser
* Fully editable

**Cloud**

* Stored remotely
* Read-only for most users
* Duplicate to edit or ask PvME Editing Staff

---

## Tech Stack

React • TypeScript • Vite • MUI • Redux Toolkit
React DnD • Firebase • react-contenteditable

---

## Getting Started

Install:
`npm install`

Run locally:
`npm run dev`

Run against production backend:
`npm run dev:prod`

Build:
`npm run build`

Deploy:
`npm run deploy`

## Import Image

Open **Menu → Import Image** in an editable preset. Choose or paste a screenshot. The importer locates inventory and equipment slots automatically and draws their outlines. It supports 4-column and 7-column inventories, worn-equipment layouts and compact equipment grids. Choose **Manual** to place the inventory first, change its columns, rows and gap, then place the equipment independently. Equipment supports worn positions or a configurable grid; drag the labelled slot boxes to rearrange individual slots. Uncheck either **Include** box to skip that panel. Click **Find items**, review the suggestions, then **Apply items** and save the preset.

Clearly empty slots are recognised automatically. Uncertain matches appear first and default to **Keep current**. Use **Search** to correct an item by name or alias, or choose **Empty slot** to clear it. Importing updates inventory and equipment; preset notes, relics, familiar, spells and aspect stay as they are. Cloud presets follow the existing editing permissions.

Matching runs in the browser against bundled 24×24 colour fingerprints from the PvME emoji catalogue. Icon proportions are preserved and stack numbers are excluded when comparing stack variants of the same item. Matching does not upload screenshots. Identical icons, doses and colour variants may need manual correction. Known duplicate artwork is consolidated using `utility/recognition-aliases.json` when building the templates.

Run the importer checks with `npm test`. Maintainers can regenerate the bundled templates from the current catalogue with `npm run recognition:build`. Downloaded icons are cached in `.cache/recognition/`; the generated PNG and JSON in `src/assets/recognition/` should be committed together. Normal builds use the bundled files and do not download the catalogue icons.

### Missing items

Choose **Suggest Missing Icon** to prepare an icon locally. Compatible bank or GE slots are cleaned automatically; choose the item you want, then download the cleaned PNG. No screenshot or item details are uploaded.
