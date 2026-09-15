# Missing item submissions

The page previews icons locally and submits a selected slot and item details to this service. Visitors do not need GitHub accounts. The server uses a bot credential to open a draft pull request against `pvme/pvme-settings`.

Drafts contain a cleaned `icon.png` and `item.json` in `emojis/submissions/<id>/`. A maintainer uploads the icon through the existing PvME Image Store bot, completes the catalogue entry in `emojis/emojis_v2.json`, and removes the submission files before merging. This preserves the [catalogue contribution workflow](https://github.com/pvme/pvme-settings/blob/master/emojis/README.md); it does not invent an image-store upload API.

## Run the service

Use Python 3.11 or later, a persistent disk for SQLite, and one service instance. From this directory:

```sh
pip install -r requirements.txt
python setup_cleanup.py
python -m unittest discover -s tests
gunicorn --bind 0.0.0.0:8080 --workers 2 'service:create_app()'
```

Host behind HTTPS. Configure:

| Environment variable | Value |
| --- | --- |
| `GITHUB_BOT_TOKEN` | Server-only credential with contents write permission on the bot fork and permission to open pull requests against the upstream repository. |
| `GITHUB_BOT_FORK` | An existing bot-owned fork of `pvme/pvme-settings`, as `owner/repository`. |
| `GITHUB_UPSTREAM` | Defaults to `pvme/pvme-settings`. Use a test repository for staging. |
| `CONTRIBUTION_ORIGINS` | Comma-separated exact frontend origins, with no spaces or trailing slash. |
| `TURNSTILE_SITE_KEY` | Public key for a Turnstile widget allowing those frontend hostnames. |
| `TURNSTILE_SECRET_KEY` | Corresponding server-only secret. |
| `CONTRIBUTION_DB` | Absolute path to a persistent SQLite database. |

The service validates Turnstile tokens, action and hostname, checks catalogue duplicates, limits submissions to 10/hour and 50/day across the service, and reuses existing proposals for an item ID. Configure request rate limiting at the hosting proxy as well. Failed partial GitHub writes can be retried after two minutes; existing branches are checked before reuse. Do not share the bot's `item-contribution/` branch namespace with other tools.

Set `VITE_ITEM_CONTRIBUTION_URL` to the service's HTTPS base URL when building the PvME frontend. For Vorkath, set `endpoint` in `/src/preset-assets/contributions.json` to that URL. Both clients load `/config`, then send the selected original 38×34 slot, item details and Turnstile token to `/submit`. The full screenshot stays in the browser. The server checks and cleans the original slot again; client-supplied cleaned pixels are never trusted.

Until a service is configured, users can prepare and download the cleaned icon, but the page clearly shows that submission is unavailable. No bot credential belongs in a frontend environment variable.

## Icon cleanup

`setup_cleanup.py` downloads the exact [script linked in the PvME icon guide](https://pvme.io/pvme-guides/editor-resources/editor-references/icon-creation/). Its SHA-256 is pinned in `cleanup.py`. Only its three cleanup function definitions are loaded. Its setup, package installation, directory moves and interactive commands are not executed.

The local preview adapts those same pixel comparisons to JavaScript. The six border/background PNGs in `public/icon-cleanup/` are the templates linked by that script. Cleanup preserves pixels that differ from the matching background and removes the script's exact shadow and yellow quantity colours. It requires an original opaque bank/GE PNG at 100% interface scale, including the 38×34 slot border. Scaled, compressed and worn-equipment crops are rejected rather than producing damaged icons.

Tests exercise cleanup, validation, challenge rejection, duplicate protection and draft PR payloads against mocks. Production activation requires PvME to host the service and connect its bot. No live upstream PR is created by the tests.
