import ast
import hashlib
from io import BytesIO
from pathlib import Path

from PIL import Image

SOURCE_URL = 'https://drive.usercontent.google.com/download?id=1lLI6X3hAx-IebShGFe1jxbCZgGOzJ60-&export=download&confirm=t'
SOURCE_SHA256 = '49b71739ddc13d4bb5d333058a87153a2d31808837921e097bb2ce496023b77e'
ROOT = Path(__file__).parent
ASSETS = ROOT.parent / 'public' / 'icon-cleanup'
FUNCTIONS = {'is_border_subset_of_slot', 'extract_nonoverlapping_region', 'make_transparent'}


def load_functions():
    source = (ROOT / 'vendor' / 'make-icon.py').read_bytes()
    if hashlib.sha256(source).hexdigest() != SOURCE_SHA256:
        raise RuntimeError('Icon cleanup script checksum does not match.')
    tree = ast.parse(source)
    nodes = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in FUNCTIONS]
    if {node.name for node in nodes} != FUNCTIONS:
        raise RuntimeError('Icon cleanup functions are missing.')
    namespace = {'Image': Image}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), 'make-icon.py', 'exec'), namespace)
    return namespace


def clean_icon(data):
    if len(data) > 16_384:
        raise ValueError('Choose one original bank or GE slot.')
    try:
        image = Image.open(BytesIO(data))
        if image.format != 'PNG' or image.size != (38, 34) or getattr(image, 'n_frames', 1) != 1:
            raise ValueError('Use an original 38 by 34 bank or GE slot PNG.')
        image = image.convert('RGBA')
    except (OSError, Image.DecompressionBombError) as error:
        raise ValueError('The slot PNG could not be read.') from error
    functions = load_functions()
    for kind in ['ge', 'inventory', 'inventory-alt']:
        with Image.open(ASSETS / f'{kind}-border.png') as border:
            if not functions['is_border_subset_of_slot'](border.convert('RGBA'), image):
                continue
        with Image.open(ASSETS / f'{kind}-background.png') as background:
            cleaned = functions['extract_nonoverlapping_region'](image, background.convert('RGBA'))
        cleaned = functions['make_transparent'](cleaned, [(0, 0, 1, 255), (255, 255, 0, 255)])
        if not cleaned.getbbox():
            raise ValueError('The selected slot is empty.')
        output = BytesIO()
        cleaned.save(output, format='PNG')
        return output.getvalue()
    raise ValueError('This slot does not match the original bank or GE borders. Use an opaque screenshot at 100% interface scale.')
