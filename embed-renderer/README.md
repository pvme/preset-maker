# Embed previews

This puts the portrait and landscape previews on GitHub Pages with the site.
There's no separate server to run. The workflow checks the preset repo every
10 minutes and only renders things that have changed.

## Getting it running

Once this is merged into `master`:

1. Go to **Settings > Pages** and change the source to **GitHub Actions**.
2. Under **Actions**, open **Build site and refresh preset previews** and click
   **Run workflow**.
3. Let that finish. The timer takes over from there.

If the `github-pages` environment has a required reviewer, remove that requirement
for the scheduled job. It needs to be allowed to deploy from `master` on its own.

Keep the existing Firebase key and API URL settings for the editor. Rendering
doesn't use them, but saving and login still do. `VITE_PRESET_EMBED_URL` is no
longer needed; the workflow gets the site's address from Pages.

Copy embed link will then produce links like:

```
https://OWNER.github.io/preset-maker/embeds/PRESET_ID/4x7/
https://OWNER.github.io/preset-maker/embeds/PRESET_ID/7x4/
```

Discord gets a page with the right image already in its metadata. Opening the
link in a browser takes you to the editor with the same layout selected.
Old links to the Google endpoint won't change, so copy a new link to test this.

The first batch can take a few runs. Each normal run spends up to five minutes
rendering, publishes what it has, and picks up the rest next time. Until a new
preset's image is ready, its link still opens the editor.

## Trying it locally

With Node 22 or newer installed:

```sh
npm ci
npm run preview:embeds
```

Open http://127.0.0.1:3001, load a preset JSON backup, and compare the two layouts.
You can download either one as a PNG.

To test the actual Pages files, clone the presets once:

```sh
git clone --depth 1 https://github.com/pvme/preset-maker-storage.git .cache/preset-source
```

Then in PowerShell:

```powershell
$env:EMBED_SITE_URL = 'https://OWNER.github.io/preset-maker/'
npm run generate:embeds
```

Use the real site address, including the final `/`. The output goes into
`.cache/static-embeds`.

For a smaller test, set `PRESET_SOURCE_DIR` to a folder with a few preset files
and `EMBED_OUTPUT_DIR` to a separate empty folder. Missing presets are treated
as deletions, so don't point a small test at the full output folder.

`EMBED_FORCE=true` downloads the icons again and rerenders everything. It also
removes the five-minute render limit, so it can take a while. The manual workflow
has the same option. `EMBED_RENDER_BUDGET_MS` changes that limit for normal runs.

## A few things to know

- The schedule runs at 7, 17, 27, 37, 47 and 57 minutes past each hour. GitHub can
  run jobs late; it's not an exact ten-minute deadline. Scheduled jobs also need
  the workflow on the default branch, and GitHub can disable them after 60 days
  without repo activity.
- The source is the public `pvme/preset-maker-storage` repo. Changes to presets,
  the renderer, artwork or item catalogue invalidate the relevant cached results.
- The app and previews are published together. An unchanged scheduled run skips
  the app build and deployment. If a deployment fails, the next run retries it.
- Images render at twice the display resolution so text stays clear, and are saved
  as WebP to keep the whole site below Pages' 1 GB limit. The
  job stops before publishing if previews exceed 900 MB or the site exceeds 950 MB.
- A failed render keeps the previous image where possible and retries next run.
  Deleted presets and unused images are removed. Errors are printed in the job log.
- Discord can keep an old preview on an existing message even after the site has
  updated. Use a newly copied link when checking it.

Checks:

```sh
npm run test:embeds
npm test -- tests/embed-link.test.tsx --maxWorkers=1
npx tsc --noEmit
```
