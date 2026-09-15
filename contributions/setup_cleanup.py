import hashlib
from pathlib import Path

import requests

from cleanup import SOURCE_URL, SOURCE_SHA256

response = requests.get(SOURCE_URL, timeout=30)
response.raise_for_status()
if hashlib.sha256(response.content).hexdigest() != SOURCE_SHA256:
    raise SystemExit('The upstream icon script changed. Review it before updating the pinned checksum.')
destination = Path(__file__).parent / 'vendor' / 'make-icon.py'
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_bytes(response.content)
print('Verified icon cleanup script installed.')
