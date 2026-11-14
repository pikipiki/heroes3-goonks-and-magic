"""Product scenario: ordinary Heroes army and adjacent neutral guard, no runtime test injection."""
import json, zipfile
from pathlib import Path
root = Path(__file__).resolve().parents[3]
with zipfile.ZipFile(root / 'maps/000-Goonk.vmap') as source:
    entries = {name: source.read(name) for name in source.namelist()}
header = json.loads(entries['header.json'])
header.update(name='Crossover - duel StarCraft', description='Attaque le garde immédiatement à droite de Christian. Tes archers et piquiers Heroes affrontent des Marines StarCraft sur le même champ de bataille. La bataille se joue dans OpenBW ; ses pertes sont appliquées ensuite par VCMI. Test solo limité aux batailles de terrain et à 128 créatures par camp.')
header['mods'].append({'modId':'heroes-starcraft','name':'Heroes StarCraft','version':'0.1.0'})
objects = [row for row in json.loads(entries['objects.json']) if row['instanceName'] in ['goonkTown', 'goonkHero', 'enemyTown']]
for row in objects:
    if row['instanceName'] == 'goonkHero':
        row['options'].update(type='core:christian', army=[{'type':'core:archer','amount':12},{'type':'core:pikeman','amount':6}], artifacts={}, secondarySkills={}, experience=0)
objects.append({'type':'core:monster','subtype':'heroes-starcraft:marine','instanceName':'starcraftGuard','x':10,'y':11,'l':0,'template':{'animation':'crossover/marine-map','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':3,'character':'savage','neverFlees':True}})
entries['header.json'] = json.dumps(header, ensure_ascii=False).encode()
entries['objects.json'] = json.dumps(objects, ensure_ascii=False).encode()
with zipfile.ZipFile(root / 'maps/005-Crossover-StarCraft.vmap', 'w', zipfile.ZIP_DEFLATED) as target:
    for name, data in entries.items():
        info = zipfile.ZipInfo(name, (2026, 11, 14, 0, 0, 0));info.compress_type = zipfile.ZIP_DEFLATED
        target.writestr(info, data)
print('Created maps/005-Crossover-StarCraft.vmap')
