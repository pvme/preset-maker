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
