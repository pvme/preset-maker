import base64
import json
import sys
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from cleanup import ASSETS, clean_icon
from service import GitHub, create_app


def slot_png(empty=False):
    image = Image.open(ASSETS / 'inventory-background.png').convert('RGBA')
    if not empty:
        for x in range(12, 24):
            for y in range(10, 22):
                image.putpixel((x, y), (180, 55, 90, 255))
        image.putpixel((12, 10), (0, 0, 1, 255))
        image.putpixel((13, 10), (255, 255, 0, 255))
    output = BytesIO()
    image.save(output, format='PNG')
    return output.getvalue()


class FakeGitHub:
    def __init__(self):
        self.proposals = []

    def catalogue(self):
        return {'categories': [{'name': 'Other Gear', 'emojis': [{'id': 'olditem', 'name': 'Old item', 'id_aliases': ['oldalias']}]}]}, 'master'

    def propose(self, item, icon, branch):
        self.proposals.append((item, icon, branch))
        return 'https://github.com/pvme/pvme-settings/pull/123'


class SubmissionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.github = FakeGitHub()
        self.challenge = {'success': True, 'hostname': 'pvme.test', 'action': 'item-contribution'}
        self.app = create_app({'TESTING': True, 'DB': self.temp.name + '/test.sqlite3', 'ORIGINS': ['https://pvme.test'],
            'SITE_KEY': 'public-key', 'SECRET': 'secret', 'TOKEN': 'bot-token', 'FORK': 'bot/fork'},
            github=self.github, verify=lambda token: self.challenge)
        self.client = self.app.test_client()
        self.headers = {'Origin': 'https://pvme.test'}
        self.body = {'item': {'id': 'newitem', 'name': 'New item', 'category': 'Other Gear', 'preset_slot': 1, 'id_aliases': ['newalias']},
            'original': 'data:image/png;base64,' + base64.b64encode(slot_png()).decode(), 'token': 'verified'}

    def post(self):
        return self.client.post('/submit', json=self.body, headers=self.headers)

    def test_exact_script_removes_background_numbers_and_shadows(self):
        image = Image.open(BytesIO(clean_icon(slot_png())))
        self.assertEqual(image.getpixel((0, 0)), (0, 0, 0, 0))
        self.assertEqual(image.getpixel((12, 10)), (0, 0, 0, 0))
        self.assertEqual(image.getpixel((13, 10)), (0, 0, 0, 0))
        self.assertEqual(image.getpixel((14, 10)), (180, 55, 90, 255))
        with self.assertRaises(ValueError):
            clean_icon(slot_png(empty=True))

    def test_wrong_dimensions_and_compressed_images_are_rejected(self):
        for size, format in [((32, 32), 'PNG'), ((38, 34), 'JPEG')]:
            image = Image.new('RGB', size)
            output = BytesIO()
            image.save(output, format=format)
            with self.assertRaises(ValueError):
                clean_icon(output.getvalue())

    def test_only_selected_cleaned_icon_reaches_github_and_retries_reuse_pr(self):
        response = self.post()
        self.assertEqual(response.status_code, 201, response.json)
        self.assertEqual(response.json['url'], 'https://github.com/pvme/pvme-settings/pull/123')
        self.assertEqual(self.post().status_code, 200)
        self.assertEqual(len(self.github.proposals), 1)
        self.assertEqual(self.github.proposals[0][1], clean_icon(slot_png()))
        self.assertNotIn('token', self.github.proposals[0][0])

    def test_origin_and_challenge_are_required(self):
        self.assertEqual(self.client.post('/submit', json=self.body).status_code, 403)
        for result in [{'success': False}, {'success': True, 'hostname': 'evil.test', 'action': 'item-contribution'},
                       {'success': True, 'hostname': 'pvme.test', 'action': 'other'}]:
            self.challenge = result
            self.assertEqual(self.post().status_code, 403)
        self.assertEqual(self.github.proposals, [])

    def test_bad_metadata_and_duplicate_aliases_do_not_open_prs(self):
        for key, value in [('id', '../bad'), ('name', '@everyone'), ('preset_slot', True), ('id_aliases', ['oldalias'])]:
            with self.subTest(key=key):
                before = self.body['item'][key]
                self.body['item'][key] = value
                self.assertEqual(self.post().status_code, 400)
                self.body['item'][key] = before
        self.assertEqual(self.github.proposals, [])

    def test_queue_limit_and_unconfigured_service_fail_closed(self):
        self.app.config['MAX_PER_HOUR'] = 0
        self.assertEqual(self.post().status_code, 429)
        self.app.config['TOKEN'] = ''
        self.assertEqual(self.post().status_code, 503)
        self.assertEqual(self.github.proposals, [])

    def test_configuration_contains_no_secrets_and_cors_preflight_works(self):
        response = self.client.get('/config', headers=self.headers)
        self.assertEqual(response.json, {'siteKey': 'public-key', 'categories': ['Other Gear']})
        response = self.client.options('/submit', headers=self.headers)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.headers['Access-Control-Allow-Origin'], 'https://pvme.test')

    def test_forged_cleaned_icon_does_not_replace_server_cleanup(self):
        self.body['icon'] = 'forged'
        self.assertEqual(self.post().status_code, 201)
        self.assertEqual(self.github.proposals[0][1], clean_icon(slot_png()))

    def test_github_draft_contains_proposal_files_and_no_original_screenshot(self):
        github = GitHub('secret', 'bot/pvme-settings', 'pvme/pvme-settings')
        calls = []
        def call(method, path, **kwargs):
            calls.append((method, path, kwargs))
            if method == 'GET' and path.endswith('/pulls'):
                return []
            if '/git/ref/' in path:
                return {'object': {'sha': 'parent'}}
            if path.endswith('/git/commits/parent'):
                return {'tree': {'sha': 'base-tree'}}
            if path.endswith('/pulls'):
                return {'html_url': 'https://github.com/pvme/pvme-settings/pull/123'}
            return {'sha': 'created'}
        with patch.object(github, 'call', side_effect=call):
            github.propose(self.body['item'], b'cleaned PNG', 'master')
        tree = next(kwargs['json'] for _, path, kwargs in calls if path.endswith('/git/trees'))
        self.assertEqual([entry['path'] for entry in tree['tree']], ['emojis/submissions/newitem/icon.png', 'emojis/submissions/newitem/item.json'])
        self.assertNotIn('original', json.dumps(tree))
        pr = calls[-1][2]['json']
        self.assertTrue(pr['draft'])
        self.assertEqual(pr['base'], 'master')
        self.assertEqual(pr['head'], 'bot:item-contribution/newitem')
        self.assertIn('Image Store bot', pr['body'])


if __name__ == '__main__':
    unittest.main()
