"""Private two-scenario campaign; never modifies a distributed map or save."""
import copy
import importlib.util
import io
import json
import sys
import zipfile

options = json.loads(sys.argv[1])
with zipfile.ZipFile('maps/000-Goonk.vmap') as archive:
    base = {name: archive.read(name) for name in archive.namelist()}
with zipfile.ZipFile('mod/wake-of-gods/Mods/maps/content/maps/zc2.vcmp') as archive:
    regions = json.loads(archive.read('header.json'))['regions']
regions['desc'] = regions['desc'][:2]
spec = importlib.util.spec_from_file_location('normalize', 'scripts/normalize-map-instances.py')
normalize = importlib.util.module_from_spec(spec)
spec.loader.exec_module(normalize)

def scenario(index):
    entries = copy.deepcopy(base)
    objects = [o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero', 'goonkTown', 'enemyTown']]
    hero = next(o for o in objects if o['instanceName'] == 'goonkHero')
    hero['options'].update({'type': 'core:christian', 'experience': 15000,
        'army': [{'type': 'core:peasant', 'amount': 100}, {'type': 'core:archangel', 'amount': 5}],
        'henchman': {'type': 'core:peasant', 'experience': 790, 'stackExperience': 7500,
            'alive': options.get('alive', True), 'declined': False, 'banner': 8}})
    if index == 1:
        hero.update({'type': 'heroPlaceholder', 'subtype': 'object'})
        hero['options'] = {'owner': 'red', 'placeholderType': True, 'heroType': 'core:christian'}
        hero['template'] = {'animation': 'AHplace', 'mask': ['VVV', 'VAV'], 'visitableFrom': ['+++', '+-+', '+++']}
        second_town = copy.deepcopy(next(o for o in objects if o['instanceName'] == 'goonkTown'))
        second_town.update({'instanceName': 'henchmenSecondTown', 'x': 24, 'y': 23})
        objects.append(second_town)
    enemy = next(o for o in objects if o['instanceName'] == 'enemyTown')
    enemy['options']['buildings'] = {'allOf': ['core:villageHall'], 'noneOf': ['core:fort', 'core:tavern']}
    if index == 0:
        objects.append({'type': 'core:monster', 'subtype': 'core:peasant', 'instanceName': 'henchmenCampaignGuard',
            'x': 10, 'y': 11, 'l': 0, 'template': {'animation': 'AVWpeas.def', 'mask': ['A'], 'visitableFrom': ['+++', '+-+', '+++']},
            'options': {'amount': 1, 'character': 'savage', 'neverFlees': True}})
    entries['objects.json'] = json.dumps(objects).encode()
    header = json.loads(entries['header.json'])
    header['name'] = f'000 - Henchmen crossover {index + 1}'
    header['triggeredEvents'] = {'standardVictory': {
        'condition': ['standardWin'], 'effect': {'type': 'victory', 'messageToSend': 'The opponent has won.'},
        'message': 'Scenario complete.', 'description': 'Defeat the opposing kingdom.'}}
    if index == 0:
        header['triggeredEvents']['standardVictory']['condition'] = ['allOf', ['isHuman', {'value': 1}],
            ['destroy', {'object': 'henchmenCampaignGuard', 'type': 'core:monster'}]]
    for player in header['players'].values():
        if 'mainTown' in player:
            player['mainTown']['generateHero'] = False
    if index == 1:
        header['reservedCampaignHeroes'] = ['core:christian']
        header['players']['red'].pop('mainHero', None)
        header['players']['red']['heroes'] = {}
    entries['header.json'] = json.dumps(header).encode()
    for language in ['english.json', 'french.json']:
        translation = json.loads(entries[language])
        translation['mapName'] = header['name']
        entries[language] = json.dumps(translation).encode()
    entries = normalize.normalize(entries)
    result = io.BytesIO()
    with zipfile.ZipFile(result, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, data in entries.items():
            archive.writestr(name, data)
    return result.getvalue()

header = {'version': 1, 'name': '000 - Henchmen private crossover', 'description': 'Private gameplay validation',
    'author': 'Native validation', 'allowDifficultySelection': True, 'regions': regions, 'scenarios': []}
for index in range(2):
    header['scenarios'].append({'map': f'maps/{index}.vmap', 'preconditions': [] if index == 0 else [0],
        'color': 0, 'difficulty': 1, 'regionText': '', 'heroKeeps': ['experience', 'primarySkills', 'secondarySkills', 'spells', 'artifacts'],
        'keepCreatures': ['core:peasant', 'core:archangel'], 'startOptions': 'none', 'playerColor': 'red'})
result = io.BytesIO()
with zipfile.ZipFile(result, 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.writestr('header.json', json.dumps(header))
    for index in range(2):
        archive.writestr(f'maps/{index}.vmap', scenario(index))
sys.stdout.buffer.write(result.getvalue())
