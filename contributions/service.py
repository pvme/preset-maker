import base64
import hashlib
import json
import os
import re
import sqlite3
import time
from contextlib import closing
from urllib.parse import urlsplit

import requests
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

from cleanup import clean_icon

CATALOGUE_PATH = 'emojis/emojis_v2.json'


def validate_item(value):
    if not isinstance(value, dict):
        raise ValueError('Enter the item details.')
    item = {key: value.get(key) for key in ['id', 'name', 'category', 'preset_slot']}
    if not isinstance(item['id'], str) or not re.fullmatch(r'[a-z0-9][a-z0-9_-]{1,63}', item['id']):
        raise ValueError('Use 2–64 lowercase letters, numbers, underscores or hyphens for the item ID.')
    for key in ['name', 'category']:
        text = item[key]
        if not isinstance(text, str) or not 2 <= len(text.strip()) <= 120 or any(ord(c) < 32 for c in text) or any(c in text for c in '<>@`[]'):
            raise ValueError(f'Enter a valid {key}.')
        item[key] = text.strip()
    if type(item['preset_slot']) is not int or not 0 <= item['preset_slot'] <= 13:
        raise ValueError('Choose a valid equipment slot.')
    aliases = value.get('id_aliases', [])
    if not isinstance(aliases, list) or len(aliases) > 10 or any(not isinstance(alias, str) or not re.fullmatch(r'[a-z0-9][a-z0-9_-]{1,63}', alias) for alias in aliases):
        raise ValueError('Use up to 10 lowercase aliases.')
    item['id_aliases'] = sorted(set(aliases) - {item['id']})
    item['preset_type'] = 'item'
    return item


class GitHub:
    def __init__(self, token, fork, upstream):
        self.token, self.fork, self.upstream = token, fork, upstream

    def call(self, method, path, **kwargs):
        response = requests.request(method, 'https://api.github.com/' + path,
            headers={'Authorization': 'Bearer ' + self.token, 'Accept': 'application/vnd.github+json',
                     'X-GitHub-Api-Version': '2022-11-28'}, timeout=25, **kwargs)
        response.raise_for_status()
        return response.json()

    def catalogue(self):
        repo = self.call('GET', f'repos/{self.upstream}')
        branch = repo['default_branch']
        entry = self.call('GET', f'repos/{self.upstream}/contents/{CATALOGUE_PATH}', params={'ref': branch})
        return json.loads(base64.b64decode(entry['content'])), branch

    def propose(self, item, icon, branch):
        name = 'item-contribution/' + item['id']
        owner = self.fork.split('/')[0]
        prior = self.call('GET', f'repos/{self.upstream}/pulls', params={'head': owner + ':' + name, 'state': 'all'})
        if prior:
            return prior[0]['html_url']
        reference = self.call('GET', f'repos/{self.upstream}/git/ref/heads/{branch}')
        parent = reference['object']['sha']
        commit = self.call('GET', f'repos/{self.upstream}/git/commits/{parent}')
        folder = 'emojis/submissions/' + item['id']
        blob = self.call('POST', f'repos/{self.fork}/git/blobs', json={'content': base64.b64encode(icon).decode(), 'encoding': 'base64'})
        tree = self.call('POST', f'repos/{self.fork}/git/trees', json={'base_tree': commit['tree']['sha'], 'tree': [
            {'path': folder + '/icon.png', 'mode': '100644', 'type': 'blob', 'sha': blob['sha']},
            {'path': folder + '/item.json', 'mode': '100644', 'type': 'blob', 'content': json.dumps(item, indent=2, ensure_ascii=False) + '\n'},
        ]})
        created = self.call('POST', f'repos/{self.fork}/git/commits', json={'message': 'Propose item: ' + item['name'], 'tree': tree['sha'], 'parents': [parent]})
        try:
            self.call('POST', f'repos/{self.fork}/git/refs', json={'ref': 'refs/heads/' + name, 'sha': created['sha']})
        except requests.HTTPError as error:
            if error.response.status_code != 422:
                raise
            existing = self.call('GET', f'repos/{self.fork}/contents/{folder}/item.json', params={'ref': name})
            if json.loads(base64.b64decode(existing['content'])) != item:
                raise ValueError('This item ID already has a pending contribution.') from error
        body = ('Missing item submitted from the preset maker.\n\n'
                f"Item: {item['name']}\n\n"
                f'![Proposed icon](https://raw.githubusercontent.com/{self.fork}/{name}/{folder}/icon.png)\n\n'
                'The icon was processed with the PvME icon creation script. Only the cleaned slot and item details are included.\n\n'
                'Maintainer steps before merging:\n\n'
                '1. Verify the item, aliases and slot.\n'
                '2. Upload icon.png through the PvME Image Store bot.\n'
                '3. Add the returned image filename and item fields to emojis/emojis_v2.json in the selected category.\n'
                '4. Remove the submission files and run the catalogue validator.\n\n'
                '[Icon creation guide](https://pvme.io/pvme-guides/editor-resources/editor-references/icon-creation/)')
        result = self.call('POST', f'repos/{self.upstream}/pulls', json={'title': 'Add item: ' + item['name'], 'head': owner + ':' + name,
            'base': branch, 'draft': True, 'maintainer_can_modify': True, 'body': body})
        return result['html_url']


def create_app(settings=None, github=None, verify=None):
    app = Flask(__name__)
    app.config.update(MAX_CONTENT_LENGTH=32768, DB=os.environ.get('CONTRIBUTION_DB', 'contributions.sqlite3'),
        ORIGINS=os.environ.get('CONTRIBUTION_ORIGINS', '').split(','), SITE_KEY=os.environ.get('TURNSTILE_SITE_KEY', ''),
        SECRET=os.environ.get('TURNSTILE_SECRET_KEY', ''), TOKEN=os.environ.get('GITHUB_BOT_TOKEN', ''),
        FORK=os.environ.get('GITHUB_BOT_FORK', ''), UPSTREAM=os.environ.get('GITHUB_UPSTREAM', 'pvme/pvme-settings'),
        MAX_PER_HOUR=10, MAX_PER_DAY=50)
    if settings:
        app.config.update(settings)
    gh = github or GitHub(app.config['TOKEN'], app.config['FORK'], app.config['UPSTREAM'])
    with closing(sqlite3.connect(app.config['DB'])) as db, db:
        db.execute('CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, digest TEXT, url TEXT, started REAL)')
        db.execute('CREATE TABLE IF NOT EXISTS attempts (created REAL)')

    def configured():
        return all(app.config[key] for key in ['SITE_KEY', 'SECRET', 'TOKEN', 'FORK']) and bool(app.config['ORIGINS'][0])

    @app.before_request
    def check_origin():
        if request.headers.get('Origin') not in app.config['ORIGINS']:
            return jsonify(error='This origin is not enabled for item submissions.'), 403
        if request.method == 'OPTIONS':
            return '', 204

    @app.after_request
    def cors(response):
        if request.headers.get('Origin') in app.config['ORIGINS']:
            response.headers['Access-Control-Allow-Origin'] = request.headers['Origin']
            response.headers['Vary'] = 'Origin'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Cache-Control'] = 'no-store'
        return response

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error=error.description), error.code

    @app.get('/config')
    def config():
        if not configured():
            return jsonify(error='Item submissions are not connected yet.'), 503
        try:
            catalogue, _ = gh.catalogue()
            return jsonify(siteKey=app.config['SITE_KEY'], categories=[category['name'] for category in catalogue['categories']])
        except requests.RequestException:
            return jsonify(error='The catalogue is temporarily unavailable.'), 503

    def verified(token):
        if not isinstance(token, str) or not 1 <= len(token) <= 2048:
            return False
        if verify:
            result = verify(token)
        else:
            response = requests.post('https://challenges.cloudflare.com/turnstile/v0/siteverify',
                json={'secret': app.config['SECRET'], 'response': token}, timeout=10)
            response.raise_for_status()
            result = response.json()
        return result.get('success') is True and result.get('action') == 'item-contribution' and result.get('hostname') == urlsplit(request.headers['Origin']).hostname

    @app.post('/submit')
    def submit():
        if not configured():
            return jsonify(error='Item submissions are not connected yet.'), 503
        try:
            data = request.get_json()
            if not isinstance(data, dict):
                raise ValueError('Enter the item details and choose an icon.')
            item = validate_item(data.get('item'))
            if not verified(data.get('token')):
                return jsonify(error='Verification expired or failed. Please try again.'), 403
            original = data.get('original', '')
            if not isinstance(original, str) or not original.startswith('data:image/png;base64,'):
                raise ValueError('Choose an original slot PNG.')
            try:
                icon = clean_icon(base64.b64decode(original.split(',', 1)[1], validate=True))
            except (ValueError, TypeError) as error:
                raise ValueError(str(error)) from error
            digest = hashlib.sha256(json.dumps(item, sort_keys=True).encode() + icon).hexdigest()
            now = time.time()
            with closing(sqlite3.connect(app.config['DB'], timeout=5)) as db, db:
                db.execute('BEGIN IMMEDIATE')
                row = db.execute('SELECT digest, url, started FROM submissions WHERE id=?', (item['id'],)).fetchone()
                if row and row[1]:
                    return jsonify(url=row[1], existing=True)
                if row and (row[0] != digest or now - row[2] < 120):
                    return jsonify(error='This item already has a submission in progress. Please retry later.'), 409
                db.execute('DELETE FROM attempts WHERE created < ?', (now - 86400,))
                counts = db.execute('SELECT COUNT(*), COALESCE(SUM(created > ?), 0) FROM attempts', (now - 3600,)).fetchone()
                if counts[0] >= app.config['MAX_PER_DAY'] or counts[1] >= app.config['MAX_PER_HOUR']:
                    return jsonify(error='The submission queue is full. Please try again later.'), 429
                db.execute('INSERT INTO attempts VALUES (?)', (now,))
                db.execute('INSERT OR REPLACE INTO submissions VALUES (?, ?, NULL, ?)', (item['id'], digest, now))
            catalogue, branch = gh.catalogue()
            if item['category'] not in [category['name'] for category in catalogue['categories']]:
                raise ValueError('Choose a category from the catalogue.')
            aliases = {item['id'], *item['id_aliases']}
            for category in catalogue['categories']:
                for entry in category['emojis']:
                    if aliases.intersection({entry['id'], *entry.get('id_aliases', [])}) or entry['name'].casefold() == item['name'].casefold():
                        raise ValueError('This item name or alias already exists in the catalogue. Search for it before submitting.')
            url = gh.propose(item, icon, branch)
            with closing(sqlite3.connect(app.config['DB'])) as db, db:
                db.execute('UPDATE submissions SET url=? WHERE id=?', (url, item['id']))
            return jsonify(url=url), 201
        except ValueError as error:
            return jsonify(error=str(error)), 400
        except (requests.RequestException, OSError, RuntimeError, sqlite3.Error):
            return jsonify(error='The submission service is unavailable. Your preset has not changed. Please retry later.'), 503

    return app
