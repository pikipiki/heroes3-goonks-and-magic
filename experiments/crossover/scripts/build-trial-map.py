"""Product scenario: ordinary Heroes army and adjacent neutral guard, no runtime test injection."""
import json, zipfile, re
from pathlib import Path
root = Path(__file__).resolve().parents[3]
with zipfile.ZipFile(root / 'maps/000-Goonk.vmap') as source:
    entries = {name: source.read(name) for name in source.namelist()}
header = json.loads(entries['header.json'])
header.update(name='Crossover - duel StarCraft', description='Attaque le garde immédiatement à droite de Christian. Sept troupes finales de factions différentes, une créature par troupe, affrontent douze unités Terrans, Zergs et Protoss avec leurs améliorations maximales sur le même champ de bataille. La bataille se joue dans OpenBW ; ses pertes sont appliquées ensuite par VCMI. Test solo limité aux batailles de terrain et à 128 créatures par camp.')
header['mods'].append({'modId':'heroes-starcraft','name':'Heroes StarCraft','version':'0.2.0'})
spells=[]
for name in ['offensive','timed','other']:
    text=(root/'work/vcmi-wasm/config/spells'/f'{name}.json').read_text()
    spells += ['core:'+key for key,index in re.findall(r'\n\t"(\w+)"\s*:\s*\{\s*\n\t\t"index"\s*:\s*(\d+)',text) if 10<=int(index)<=69 and int(index)!=57]
objects = [row for row in json.loads(entries['objects.json']) if row['instanceName'] in ['goonkTown', 'goonkHero', 'enemyTown']]
for row in objects:
    if row['instanceName'] == 'goonkHero':
        row['options'].update(type='core:christian', army=[{'type':'tum-era:'+key,'amount':1} for key in ['cherub','gemDragon','guardianOfZeus','antichrist','redBonesDragon','chasmDragon','ancestralBehemoth']], artifacts={'spellbook':'core:spellBook','rightHand':'core:titansThunder'}, spellBook=spells, primarySkills={'attack':1,'defence':1,'spellpower':4,'knowledge':30}, secondarySkills={key:'expert' for key in ['core:wisdom','core:airMagic','core:earthMagic','core:fireMagic','core:waterMagic']}, experience=0)
objects.append({'type':'core:garrisonHorizontal','subtype':'core:normal','instanceName':'starcraftGuard','x':10,'y':11,'l':0,'template':{'animation':'crossover/marine-map','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'removableUnits':False,'army':[{'type':'heroes-starcraft:'+key,'amount':2} for key in ['marine','firebat','zergling','hydralisk','zealot','dragoon']]}})
entries['gameSettings.json']=json.dumps({'modules':{'commanders':False}}).encode()
entries['header.json'] = json.dumps(header, ensure_ascii=False).encode()
entries['objects.json'] = json.dumps(objects, ensure_ascii=False).encode()
with zipfile.ZipFile(root / 'maps/005-Crossover-StarCraft.vmap', 'w', zipfile.ZIP_DEFLATED) as target:
    for name, data in entries.items():
        info = zipfile.ZipInfo(name, (2026, 11, 14, 0, 0, 0));info.compress_type = zipfile.ZIP_DEFLATED
        target.writestr(info, data)
print('Created maps/005-Crossover-StarCraft.vmap')
