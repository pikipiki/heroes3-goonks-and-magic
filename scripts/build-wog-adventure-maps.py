"""Publish playable solo/online variants with the reviewed source banks and the Mysterious Cave.

Existing maps and armies are inputs, never saves. Each kingdom gets the same
banks. Placement preserves every existing objective and checks walkable access.
"""
from pathlib import Path
from collections import deque
import copy
import json
import zipfile
import os
import hashlib

ROOT = Path(__file__).resolve().parents[1]
BANKS = [34, 35, 36, 39, 40, 42, 45, 46, 49, 50, 54, 55, 58, 60, 48, 51, 64, 65, 66, 67, 21, 24, 25, 26, 27, 28, 29, 30, 31]
MAP_OUTPUT_ROOT = Path(os.environ.get("GOONK_MAP_OUTPUT_ROOT", ROOT / "maps"))
OBJECT_ROOT = Path(os.environ.get("GOONK_MAP_OBJECT_ROOT", ROOT / "mod/tum-era/content/config/objects"))


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


def add_recruitment(objects, target, size, water, homes, earlier_placements):
    catalogue = json.loads((ROOT / 'scripts/wog-adventure-recruitment.json').read_text())
    plan = next(p for p in catalogue['maps'] if p['map'] == target)
    digest = hashlib.sha256(json.dumps(objects, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()
    if digest != plan['baseObjectsSha256']:
        raise ValueError('Recruitment catalogue needs review after a change to the base map')
    scenery = {'core:oakTrees', 'core:rock'}
    removed = set(plan['removedScenery'])
    if removed - {o['instanceName'] for o in objects if o['type'] in scenery}:
        raise ValueError('Recruitment may remove only reviewed scenery')
    before = [reachable(size, water | set().union(*(cells(o) for o in objects)), home) for home in homes]
    retained = [o for o in objects if o['instanceName'] not in removed]
    protected = set().union(*(cells(o, 'ABTV') for o in objects if o['type'] not in scenery))
    protected = {(x+dx, y+dy) for x, y in protected for dx in range(-1, 2) for dy in range(-1, 2)}
    geometries = {e['id']: e['alternatives'] for e in catalogue['geometries']}
    envelope, reserved, approaches = set(), set(), []
    for placement in plan['placements']:
        footprint, blockers = set(), set()
        for alternative in geometries[placement['id']]:
            template = alternative['template']
            visit = [(len(row)-1-x, len(template['mask'])-1-y)
                     for y, row in enumerate(template['mask']) for x, c in enumerate(row) if c in 'AT']
            if len(visit) != 1:
                raise ValueError('Each recruitment outcome needs one visit tile')
            vx = placement['visit'][0] + alternative['xOffset']
            vy = placement['visit'][1]
            obj = dict(x=vx+visit[0][0], y=vy+visit[0][1], template=template)
            footprint |= cells(obj, 'ABTV')
            blockers |= cells(obj)
            approaches.append((placement['side'], [(vx+dx-1, vy+dy-1)
                for dy, row in enumerate(template['visitableFrom']) for dx, c in enumerate(row) if c == '+']))
        if footprint & (protected | water | reserved) or any(not (0 <= x < size and 0 <= y < size) for x, y in footprint):
            raise ValueError('Recruitment outcome overlaps an objective, water or another site')
        reserved |= footprint
        envelope |= blockers
    blocked = water | set().union(*(cells(o) for o in retained)) | envelope
    after = [reachable(size, blocked, home) for home in homes]
    if any(not any(p in after[side] for p in options) for side, options in approaches):
        raise ValueError('A possible recruitment replacement has no walkable approach')
    if any((before[side] - envelope) - after[side] for side in range(2)):
        raise ValueError('Recruitment disconnects an existing route')
    if any(not p.get('requiresFlight', False) and tuple(p['approach']) not in after[p['side']] for p in earlier_placements):
        raise ValueError('Recruitment blocks a bank, cave or hill fort')
    result = retained + [copy.deepcopy(p['object']) for p in plan['placements']]
    return result, plan['placements'], sorted(removed)


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
    for index, bank in enumerate(['flightCache'] + BANKS + ['mysteriousCave', 'hillFort']):
        flight_required = bank in (66, 67)
        if bank == 'flightCache':
            template = dict(animation='AVA0072.def', mask=['A'], visitableFrom=['+++', '+-+', '+++'])
        elif bank == 'hillFort':
            template = json.loads((ROOT / 'scripts/wog-adventure-map-templates.json').read_text())['hillFort']['template']
        elif bank == 'mysteriousCave':
            definition = json.loads((OBJECT_ROOT / 'mysterious-cave.json').read_text())['mysteriousCave']['types']['mysteriousCave']
            template = copy.deepcopy(next(iter(definition['templates'].values())))
        else:
            definition = json.loads((OBJECT_ROOT / f'bank{bank}.json').read_text())
            definition = definition['core:creatureBank']['types'][f'eraBank{bank}']
            template = copy.deepcopy(next(iter(definition['templates'].values())))
        def make(x, y, side):
            if bank == 'flightCache':
                return dict(type='core:artifact', subtype='core:angelWings', instanceName=f'wogFlightCache_{side}', x=x, y=y, l=0, template=copy.deepcopy(template), options={'guards':[{'type':'core:royalGriffin', 'amount':20}]})
            if bank == 'mysteriousCave':
                return dict(type='tum-era:mysteriousCave', subtype='tum-era:mysteriousCave', instanceName=f'wogCave_{side}', x=x, y=y, l=0, template=copy.deepcopy(template), options={})
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
            approaches = [next((p for p in options if (flight_required and 0 <= p[0] < size and 0 <= p[1] < size) or p in new_routes[side]), None)
                          for side, options in enumerate(approach_options)]
            if any(p is None for p in approaches):
                continue
            if any(not p.get('requiresFlight', False) and tuple(p['approach']) not in new_routes[p['side']] for p in placements):
                continue
            cleared_scenery.extend(obj['instanceName'] for obj in removed)
            objects = retained + pair
            blocked = future
            routes = new_routes
            for side, obj in enumerate(pair):
                footprint = footprints[side]
                avoid |= {(a+dx, b+dy) for a, b in footprint for dx in range(-3, 4) for dy in range(-3, 4)}
                placements.append(dict(bank=bank, side=side, anchor=[obj['x'], obj['y']],
                                       visit=list(entrances[side]), approach=list(approaches[side]), requiresFlight=flight_required))
            break
        else:
            raise ValueError(f'No accessible symmetric position for bank {bank}')
    objects, recruitment, recruitment_scenery = add_recruitment(objects, target, size, water, homes, placements)
    cleared_scenery.extend(recruitment_scenery)
    title = 'Goonks — Trésors de WoG' + (' en ligne' if online else '')
    description = ('Duel XL ' + ('en ligne' if online else 'contre l’ordinateur') +
                   '. Chaque royaume dispose de vingt-neuf repaires WoG, avec leurs gardiens et récompenses d’origine, et d’une Grotte mystérieuse proposant de vrais choix. '
                   'Des forts permettent de payer les améliorations de vos créatures, notamment la chaîne des dragons de cristal. '
                   'Deux repaires flottants demandent de voler : des Ailes d’ange gardées par vingt Griffons royaux attendent chaque royaume. '
                   'Trente-trois lieux de recrutement par royaume ouvrent de nouvelles familles et leurs évolutions. Cinq autres sites peuvent se transformer au premier jour selon les probabilités WoG. '
                   'Explorez, préparez votre armée puis choisissez les combats. Victoire : vaincre votre adversaire.')
    header.update(name=title, description=description)
    header.setdefault('mods', []).append(dict(modId='tum-era', name='TUM ERA bridge', version='0.1.0'))
    entries['header.json'] = json.dumps(header, ensure_ascii=False).encode()
    entries['objects.json'] = json.dumps(objects, ensure_ascii=False).encode()
    for language in ['english.json', 'french.json']:
        translated = json.loads(entries[language])
        translated.update(mapName=title, mapDescription=description)
        entries[language] = json.dumps(translated, ensure_ascii=False).encode()
    with zipfile.ZipFile(MAP_OUTPUT_ROOT / target, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in entries.items():
            info = zipfile.ZipInfo(name, (2026, 11, 12, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data)
    return dict(map=target, source=source, banks=[p for p in placements if isinstance(p['bank'], int)],
                hillForts=[p for p in placements if p['bank'] == 'hillFort'],
                mysteriousCaves=[p for p in placements if p['bank'] == 'mysteriousCave'],
                flightCaches=[p for p in placements if p['bank'] == 'flightCache'], recruitment=recruitment,
                conservativeRecruitmentBfs=True, preservedObjectives=original_objectives, clearedScenery=cleared_scenery)


if __name__ == '__main__':
    report = [build('001-Goonks.vmap', '003-Goonks-WoG.vmap', False),
              build('002-Goonks-Online.vmap', '004-Goonks-WoG-Online.vmap', True)]
    output = ROOT / 'outputs/wog-adventure-maps'
    output.mkdir(parents=True, exist_ok=True)
    (output / 'placements.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print('Created two playable maps with 116 banks, four Caves, four hill forts and 152 recruitment/exploration sites.')
