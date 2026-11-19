"""Memory-only native source127 adventure; never changes a published map."""
import copy
import json
import zipfile


def apply(entries, objects, options):
    water = options.get('water', False)
    objects = [o for o in objects if o['instanceName'] != 'henchmenTrainingGuard']
    hero = next(o for o in objects if o['instanceName'] == 'goonkHero')
    hero.update(x=9, y=12 if water else 11)
    if options.get('weakArmy') or options.get('defeat'):
        hero['options']['army'] = [{'type': 'core:peasant', 'amount': 1}]
    if options.get('ai'):
        enemy = next(o for o in objects if o['instanceName'] == 'enemyHenchmanHero')
        enemy.update(x=21, y=20)
        enemy['options'].update(army=[{'type': 'core:peasant', 'amount': 1}], patrolRadius=6)
        enemy['options'].pop('henchman', None)
    header = json.loads(entries['header.json'])
    header['players']['blue']['mainTown']['generateHero'] = False
    entries['header.json'] = json.dumps(header).encode()
    terrain = json.loads(entries['surface_terrain.json'])
    if water:
        for y in range(11, 28):
            for x in range(36):
                terrain[y][x] = 'wt0_'
    with zipfile.ZipFile('maps/003-Goonks-WoG.vmap') as archive:
        original = json.loads(archive.read('objects.json'))
    resource = next(o for o in original if o['type'] == 'core:resource' and o['subtype'] == ('core:gold' if options.get('ai') else 'core:wood'))
    for index in range(options.get('sites', 112)):
        row, column = divmod(index, 14)
        x = 9 + (13 - column if row % 2 else column)
        y = (14 if water else 12) + row * (1 if water else 2)
        if water:
            obj = {'type': 'core:flotsam', 'subtype': 'core:flotsam',
                   'template': {'animation': 'AVTflot0.def', 'mask': ['A'],
                                'visitableFrom': ['+++', '+-+', '+++']}, 'options': {}}
        else:
            obj = copy.deepcopy(resource)
            obj['options'] = {'amount': 1000 if options.get('ai') else 1}
        obj.update(instanceName='rogueSite' + str(index), x=x, y=y, l=0)
        objects.append(obj)
    entries['surface_terrain.json'] = json.dumps(terrain).encode()
    return objects
