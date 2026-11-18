import {execFileSync} from 'node:child_process';
export const creatureTownFixture=execFileSync('python3',['-c',`import zipfile,json,io,copy,sys,importlib.util
with zipfile.ZipFile('maps/000-Goonk.vmap') as z:entries={n:z.read(n) for n in z.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
town=next(o for o in objects if o['instanceName']=='goonkTown');objects.remove(town)
for i,faction in enumerate(['goonk','castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux']):
 t=copy.deepcopy(town);t.update(instanceName='abilityTown'+str(i),subtype=('goonk:' if i==0 else 'core:')+faction,x=9+(i%3)*10,y=9+(i//3)*8);t['options']['name']=faction;t['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1']};objects.append(t)
entries['objects.json']=json.dumps(objects).encode();h=json.loads(entries['header.json']);h['name']='000 - Creature abilities';entries['header.json']=json.dumps(h).encode()
for name in ['english.json','french.json']:
 t=json.loads(entries[name]);t['mapName']=h['name'];entries[name]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);entries=mod.normalize(entries)
o=io.BytesIO()
with zipfile.ZipFile(o,'w',zipfile.ZIP_DEFLATED) as z:
 for n,v in entries.items():z.writestr(n,v)
sys.stdout.buffer.write(o.getvalue())`]);
