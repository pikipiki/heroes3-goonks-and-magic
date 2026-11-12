"""Publish playable solo/online variants with the fourteen reviewed source banks.

Existing maps and armies are inputs, never saves. Each kingdom gets the same
banks. Placement preserves every existing objective and checks walkable access.
"""
from pathlib import Path
from collections import deque
import copy
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BANKS = [34, 35, 36, 39, 40, 42, 45, 46, 49, 50, 54, 55, 58, 60]


def cells(obj, characters='ABT'):
    mask = obj.get('template', {}).get('mask', ['A'])
    return {(obj['x'] - len(row) + 1 + x, obj['y'] - len(mask) + 1 + y)
            for y, row in enumerate(mask) for x, char in enumerate(row)
            if char in characters}


def reachable(size, blocked, start):
    seen = {start}
    queue = deque([start])
    while queue:
        x, y = queue.popleft()
        for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
            p = x + dx, y + dy
            if 0 <= p[0] < size and 0 <= p[1] < size and p not in blocked and p not in seen:
                seen.add(p)
                queue.append(p)
    return seen


def build(source, target, online):
    with zipfile.ZipFile(ROOT / 'maps' / source) as z:
        entries = {name: z.read(name) for name in z.namelist()}
    header = json.loads(entries['header.json'])
    objects = json.loads(entries['objects.json'])
    size = header['mapLevels']['surface']['width']
    terrain = json.loads(entries['surface_terrain.json'])
    blocked = set().union(*(cells(obj) for obj in objects))
    water = {(x, y) for y, row in enumerate(terrain) for x, tile in enumerate(row)
             if tile[:2] in ('wt', 'rk')}
    blocked |= water
    # Keep existing content, its sprite footprint and a walkable margin intact.
    scenery_types = {'core:oakTrees', 'core:rock'}
    original_objectives = sum(obj['type'] not in scenery_types for obj in objects)
    cleared_scenery = []
    occupied = set().union(*(cells(obj, 'ABTV') for obj in objects if obj['type'] not in scenery_types))
    avoid = {(x + dx, y + dy) for x, y in occupied for dx in range(-1, 2) for dy in range(-1, 2)}
    homes = [(17, 18), (size - 18, size - 17)]
    routes = [reachable(size, blocked, home) for home in homes]
    placements = []
    for index, bank in enumerate(BANKS + ['hillFort']):
        if bank == 'hillFort':
            template = json.loads((ROOT / 'scripts/wog-adventure-map-templates.json').read_text())['hillFort']['template']
        else:
            definition = json.loads((ROOT / f'mod/tum-era/content/config/objects/bank{bank}.json').read_text())
            definition = definition['core:creatureBank']['types'][f'eraBank{bank}']
            template = copy.deepcopy(next(iter(definition['templates'].values())))
        def make(x, y, side):
            return dict(type='core:hillFort' if bank == 'hillFort' else 'core:creatureBank',
                        subtype='core:object' if bank == 'hillFort' else f'tum-era:eraBank{bank}',
                        instanceName=f'wogHillFort_{side}' if bank == 'hillFort' else f'wogBank{bank}_{side}', x=x, y=y, l=0,
                        template=copy.deepcopy(template), options={})
        # Successively move outward from each kingdom, with deterministic ties.
        desired = (30 + index * 3, 32 + (index % 3) * 22)
        candidates = sorted(((x, y) for x in range(14, size // 2 - 7) for y in range(14, size - 14)),
                            key=lambda p: ((p[0]-desired[0])**2+(p[1]-desired[1])**2, p))
        for x, y in candidates:
            pair = [make(x, y, 'red'), make(size-1-x, size-1-y, 'blue')]
            footprints = [cells(obj, 'ABTV') for obj in pair]
            visits = [cells(obj, 'AT') for obj in pair]
            if any(len(v) != 1 for v in visits):
                raise ValueError('Expected one source visit tile')
            entrances = [next(iter(v)) for v in visits]
            if footprints[0] & footprints[1] or any(f & avoid for f in footprints):
                continue
            clearing = {(a+dx, b+dy) for footprint in footprints for a,b in footprint
                        for dx in range(-1, 2) for dy in range(-1, 2)}
            removed = [obj for obj in objects if obj['type'] in scenery_types and cells(obj, 'ABTV') & clearing]
            retained = [obj for obj in objects if obj not in removed]
            future = water | set().union(*(cells(obj) for obj in retained + pair))
            # Respect the source approach mask, including entrances above blocking tiles.
            approach_options = [[(vx+dx-1, vy+dy-1)
                                 for dy, row in enumerate(template['visitableFrom'])
                                 for dx, char in enumerate(row) if char == '+']
                                for vx, vy in entrances]
            new_routes = [reachable(size, future, home) for home in homes]
            approaches = [next((p for p in options if p in new_routes[side]), None)
                          for side, options in enumerate(approach_options)]
            if any(p is None for p in approaches):
                continue
            if any(tuple(p['approach']) not in new_routes[p['side']] for p in placements):
                continue
            cleared_scenery.extend(obj['instanceName'] for obj in removed)
            objects = retained + pair
            blocked = future
            routes = new_routes
            for side, obj in enumerate(pair):
                footprint = footprints[side]
                avoid |= {(a+dx, b+dy) for a, b in footprint for dx in range(-3, 4) for dy in range(-3, 4)}
                placements.append(dict(bank=bank, side=side, anchor=[obj['x'], obj['y']],
                                       visit=list(entrances[side]), approach=list(approaches[side])))
            break
        else:
            raise ValueError(f'No accessible symmetric position for bank {bank}')
    title = 'Goonks — Trésors de WoG' + (' en ligne' if online else '')
    description = ('Duel XL ' + ('en ligne' if online else 'contre l’ordinateur') +
                   '. Chaque royaume dispose des quatorze nouveaux repaires WoG, avec leurs gardiens et récompenses d’origine. '
                   'Des forts permettent de payer les améliorations de vos créatures, notamment la chaîne des dragons de cristal. '
                   'Explorez, préparez votre armée puis choisissez les combats. Victoire : vaincre votre adversaire.')
    header.update(name=title, description=description)
    header.setdefault('mods', []).append(dict(modId='tum-era', name='TUM ERA bridge', version='0.1.0'))
    entries['header.json'] = json.dumps(header, ensure_ascii=False).encode()
    entries['objects.json'] = json.dumps(objects, ensure_ascii=False).encode()
    for language in ['english.json', 'french.json']:
        translated = json.loads(entries[language])
        translated.update(mapName=title, mapDescription=description)
        entries[language] = json.dumps(translated, ensure_ascii=False).encode()
    with zipfile.ZipFile(ROOT / 'maps' / target, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in entries.items():
            info = zipfile.ZipInfo(name, (2026, 11, 12, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data)
    return dict(map=target, source=source, banks=[p for p in placements if isinstance(p['bank'], int)],
                hillForts=[p for p in placements if p['bank'] == 'hillFort'], preservedObjectives=original_objectives, clearedScenery=cleared_scenery)


if __name__ == '__main__':
    report = [build('001-Goonks.vmap', '003-Goonks-WoG.vmap', False),
              build('002-Goonks-Online.vmap', '004-Goonks-WoG-Online.vmap', True)]
    output = ROOT / 'outputs/wog-adventure-maps'
    output.mkdir(parents=True, exist_ok=True)
    (output / 'placements.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print('Created two playable maps with twenty-eight accessible source banks each.')
