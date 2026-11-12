import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const objects=JSON.parse(fs.readFileSync('mod/goonk/Content/config/adventure-objects.json'));
const cfg=key=>objects[key].types[key];
test('Paid offers use native affordability and one-off visit rules, without editing the ERA bridge',()=>{
 for(const key of ['adventureAcademy','adventureWorkshop']){const o=cfg(key);assert.equal(o.selectMode,'selectPlayer');assert(o.canRefuse);for(const r of o.rewards){assert(r.resources.gold<0);assert.equal(r.limiter.resources.gold,-r.resources.gold);assert(r.description.startsWith('@'));}}
 assert.equal(cfg('adventureWorkshop').visitMode,'bonus','Hero bonus source prevents farming across every workshop of this type');
 for(const r of cfg('adventureWorkshop').rewards)for(const b of r.bonuses)assert.equal(b.duration,'PERMANENT');
 const [ballista,medic,armor]=cfg('adventureWorkshop').rewards;
 assert.deepEqual(ballista.limiter.artifacts,['core:ballista']);assert.equal(ballista.bonuses[0].type,'PERCENTAGE_DAMAGE_BOOST');assert.equal(ballista.bonuses[0].subtype,'damageTypeRanged');assert.equal(ballista.bonuses[0].val,25);assert.deepEqual(medic.limiter.artifacts,['core:firstAidTent']);
 assert(ballista.bonuses.filter(b=>b.val!==0).every(b=>b.limiters.creature==='core:ballista'));
 assert.equal(medic.bonuses.find(b=>b.type==='SPECIFIC_SPELL_POWER').limiters.creature,'core:firstAidTent');
 assert.deepEqual(armor.bonuses.filter(b=>b.val!==0).map(b=>b.limiters.creature),['core:ballista','core:firstAidTent','core:ammoCart','core:catapult']);
});
test('Every cache alternative consumes the same cache, and mana cannot overflow',()=>{
 const c=cfg('adventureCache');assert(c.canRefuse);assert.equal(c.rewards.length,3);assert(c.rewards.every(r=>r.removeObject));assert.equal(c.rewards[2].manaOverflowFactor,0);assert.deepEqual(c.rewards[2].limiter.noneOf,[{manaPercentage:100}]);
});
test('New map footprints are collision-free, preserve original objects and form symmetric duel pairs',()=>{
 execFileSync('python3',['-c',`import zipfile,json,importlib.util
spec=importlib.util.spec_from_file_location('adventures','scripts/place-adventure-objects.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
for name,size,count in [('000-Goonk.vmap',36,3),('001-Goonks.vmap',144,6)]:
 with zipfile.ZipFile('maps/'+name) as z:objects=json.loads(z.read('objects.json'))
 additions=[o for o in objects if o['instanceName'].startswith('goonkAdventure')]
 assert len(additions)==count
 assert m.place_adventures(objects.copy(),size)==objects
 def cells(o):
  rows=o['template']['mask'];return {(o['x']-(len(row)-1-x),o['y']-(len(rows)-1-y)) for y,row in enumerate(rows) for x,c in enumerate(row) if c in 'AB'}
 for obj in additions:
  assert all(not(cells(obj)&cells(other)) for other in objects if other is not obj)
  if size==144:assert any(other['type']==obj['type'] and other['x']==143-obj['x'] and other['y']==143-obj['y'] for other in additions)
`]);
});
