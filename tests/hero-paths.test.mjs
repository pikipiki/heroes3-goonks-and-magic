import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const mod=JSON.parse(fs.readFileSync('mod/hero-paths/mod.json'));
const type=JSON.parse(fs.readFileSync('mod/hero-paths/content/config/hero-paths.json')).heroPathShrine.types.sanctuary;
test('Every eligible hero gets one native permanent choice across sanctuary instances',()=>{
  assert.equal(mod.keepDisabled,false);
  assert.equal(type.visitMode,'bonus');
  assert.equal(type.selectMode,'selectPlayer');
  assert.equal(type.canRefuse,true);
  assert.equal(type.rewards.length,3);
  assert(!type.resetParameters,'Choices must not reset on a new week');
  for(const reward of type.rewards){
    assert.equal(reward.limiter.heroLevel,5);
    assert(reward.bonuses.some(b=>b.duration==='PERMANENT'&&b.val===0&&b.type==='PRIMARY_SKILL'),'Each path needs a native visit marker, including paths granting direct stats');
  }
  assert.equal(type.rewards[0].primary.attack,2);
  assert.equal(type.rewards[1].primary.spellpower,2);
  assert.equal(type.rewards[2].resources.gold,250);
  assert(type.rewards[2].bonuses.some(b=>b.type==='GENERATE_RESOURCE'&&b.subtype==='core:gold'&&b.val===250&&b.duration==='PERMANENT'));
});
test('Both bundled maps have accessible sanctuaries without overwritten objects; migration is idempotent',()=>{
 const result=JSON.parse(execFileSync('python3',['-c',`
import sys,zipfile,json,copy
sys.path.insert(0,'scripts')
from hero_paths_maps import apply,PLANS,TYPE
result=[]
for name,positions in PLANS.items():
 with zipfile.ZipFile('maps/'+name)as z:c={n:json.loads(z.read(n))for n in z.namelist()}
 old=copy.deepcopy(c);apply(c,name);apply(c,name);assert c==old
 objects=c['objects.json'];shrines=[o for o in objects if o['type']==TYPE]
 assert len(shrines)==2
 assert len(set(o['instanceName']for o in objects))==len(objects)
 blocked=set()
 for o in objects:
  mask=o['template']['mask']
  for iy,row in enumerate(mask):
   for ix,ch in enumerate(row):
    if ch in 'AB':
     cell=(o['x']-len(row)+1+ix,o['y']-len(mask)+1+iy)
     blocked.add(cell)
 for shrine in shrines:
  for obj in objects:
   if obj is shrine:continue
   mask=obj['template']['mask']
   for iy,row in enumerate(mask):
    for ix,ch in enumerate(row):
     if ch in 'AB':assert (shrine['x'],shrine['y'])!=(obj['x']-len(row)+1+ix,obj['y']-len(mask)+1+iy),f'Sanctuary overlap: {name}'
 w=c['header.json']['mapLevels']['surface']['width'];h=c['header.json']['mapLevels']['surface']['height']
 for player in c['header.json']['players'].values():
  town=player['mainTown'];start=(town['x'],town['y']+2)
  seen={start};q=[start]
  for x,y in q:
   for dx in [-1,0,1]:
    for dy in [-1,0,1]:
     p=(x+dx,y+dy)
     if 0<=p[0]<w and 0<=p[1]<h and p not in blocked and p not in seen:seen.add(p);q.append(p)
  for o in shrines:assert any((o['x']+dx,o['y']+dy)in seen for dx in [-1,0,1]for dy in [-1,0,1]),f'Inaccessible sanctuary: {name}'
 result.append(name)
print(json.dumps(result))
`],{encoding:'utf8'}));
 assert.equal(result.length,2);
});
test('Public map normalization preserves mainHero references and is idempotent without changing source maps',()=>{
 const result=JSON.parse(execFileSync('python3',['-c',`
import importlib.util,zipfile,json
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
result=[]
for filename in ['000-Goonk.vmap','001-Goonks.vmap']:
 with zipfile.ZipFile('maps/'+filename)as z:original={n:z.read(n)for n in z.namelist()}
 normalized=mod.normalize(dict(original));assert mod.normalize(dict(normalized))==normalized
 objects=json.loads(normalized['objects.json']);assert all(o.get('options',{}).get('owner')!='neutral'for o in objects);names={o['instanceName']for o in objects}
 assert len(names)==len(objects)
 assert all('_'in n and n.rsplit('_',1)[-1].isdigit()for n in names)
 for player in json.loads(normalized['header.json'])['players'].values():
  if 'mainHero'in player:assert player['mainHero']in names
 assert len(objects)==len(json.loads(original['objects.json']))
 for n in original:
  if n not in ['objects.json','header.json']:assert original[n]==normalized[n]
 result.append(filename)
print(json.dumps(result))
`],{encoding:'utf8'}));assert.equal(result.length,2);
});
