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

Open **Menu → Import Image** in an editable preset. Choose or paste a screenshot, select its layout, and crop until the slot outlines line up with the items. Click **Find items**, review the suggestions, then **Apply items** and save the preset.

Uncertain matches appear first and default to **Keep current**. Use **Search** to correct an item by name or alias, or choose **Empty slot** to clear it. Importing updates inventory and equipment; preset notes, relics, familiar, spells and aspect stay as they are. Cloud presets follow the existing editing permissions.

Matching runs in the browser against bundled 16×16 colour fingerprints from the PvME emoji catalogue. Screenshots are never uploaded. Identical icons, doses and colour variants may need manual correction.

Run the importer checks with `npm test`. Maintainers can regenerate the bundled templates from the current catalogue with `npm run recognition:build`. Downloaded icons are cached in `.cache/recognition/`; the generated PNG and JSON in `src/assets/recognition/` should be committed together. Normal builds use the bundled files and do not download the catalogue icons.
