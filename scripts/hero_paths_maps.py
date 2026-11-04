"""Add the permanent-path sanctuaries to bundled new-game maps only.
No saved games are read or rewritten. Stable metadata makes updates idempotent.
"""
import copy
import json
import zipfile
from pathlib import Path

MOD = {'modId': 'hero-paths', 'name': 'Voies des héros', 'version': '1.0.0'}
TYPE = 'hero-paths:heroPathShrine'
TEMPLATE = {'animation': 'AVTchst0.def', 'mask': ['A'],
            'visitableFrom': ['+++', '+-+', '+++']}
PLANS = {'000-Goonk.vmap': [(11, 11), (27, 31)],
         '001-Goonks.vmap': [(22, 24), (121, 119)]}
HELP = ' Dès le niveau 5, visitez le Sanctuaire des voies près de votre ville de départ : un choix permanent par héros entre Armée (+2 Attaque), Magie (+2 Puissance) et Économie (+250 or maintenant et par jour).'


def apply(contents, filename):
    positions = PLANS[filename]
    objects = contents['objects.json']
    existing = [o for o in objects if o['type'] == TYPE]
    if existing:
        assert sorted((o['x'], o['y']) for o in existing) == sorted(positions)
        assert len(existing) == len(positions)
    else:
        blocked = set()
        for obj in objects:
            mask = obj['template']['mask']
            for iy, row in enumerate(mask):
                for ix, cell in enumerate(row):
                    if cell in 'AB':
                        blocked.add((obj['x'] - len(row) + 1 + ix,
                                     obj['y'] - len(mask) + 1 + iy))
        for i, (x, y) in enumerate(positions):
            assert (x, y) not in blocked, f'Sanctuary overlaps an object at {x},{y}'
            objects.append({'type': TYPE, 'subtype': 'hero-paths:sanctuary',
                            'instanceName': f'heroPathSanctuary_{i}',
                            'x': x, 'y': y, 'l': 0,
                            'template': copy.deepcopy(TEMPLATE), 'options': {}})
    header = contents['header.json']
    header.setdefault('mods', [])
    if not any(m['modId'] == MOD['modId'] for m in header['mods']):
        header['mods'].append(copy.deepcopy(MOD))
    if HELP not in header['description']:
        header['description'] += HELP
    return contents


def update(filename):
    with zipfile.ZipFile(filename) as z:
        contents = {n: json.loads(z.read(n)) for n in z.namelist()}
    apply(contents, filename.name)
    with zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, value in contents.items():
            info = zipfile.ZipInfo(name, (2026, 10, 31, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode())


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    for name in PLANS:
        update(root / 'maps' / name)
