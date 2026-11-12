import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const read=p=>JSON.parse(fs.readFileSync('mod/goonk/Content/config/'+p+'.json'));
test('Emerald upgrades are paid, family-scoped, inherited by evolutions and bounded across towers',()=>{
 const tower=read('progression-objects').emeraldTower.types.emeraldTower;assert.equal(tower.visitMode,'bonus');assert(tower.canRefuse);assert.equal(tower.rewards.length,21);const families=new Map();
 for(const r of tower.rewards){assert.deepEqual(r.resources,{gold:-3000,gems:-3});assert.deepEqual(r.limiter.resources,{gold:3000,gems:3});const b=r.bonuses[0];assert.equal(b.limiters.type,'CREATURE_TYPE_LIMITER');assert(b.limiters.includeUpgrades);assert.equal(b.duration,'PERMANENT');assert(r.bonuses.some(b=>b.val===0&&!b.limiters&&b.duration==='PERMANENT'));families.set(b.limiters.creature,(families.get(b.limiters.creature)||0)+1);}
 assert.equal(families.size,7);assert([...families.values()].every(n=>n===3));
});
test('Troop banners use the single native creature slot; original WoG bonuses are not redefined',()=>{
 const banners=read('troop-banners');assert.equal(Object.keys(banners).length,3);for(const b of Object.values(banners)){assert.deepEqual(b.type,['CREATURE']);assert.equal(b.slot,'MISC');}
 const shop=read('progression-objects').bannerOutfitter.types.bannerOutfitter;assert.equal(shop.visitMode,'unlimited');assert.equal(shop.rewards.length,3);for(const r of shop.rewards){assert.equal(r.resources.gold,-2000);assert.equal(r.limiter.resources.gold,2000);assert.equal(r.artifacts.length,1);}
 const stock=read('stock-banner-descriptions');assert.equal(Object.keys(stock).length,9);for(const a of Object.values(stock))assert.deepEqual(Object.keys(a),['text']);
});
test('Each family specialist targets its family and the new support heroes have distinct native roles',()=>{
 const heroes=read('hero-specialists'),family=Object.values(heroes).filter(h=>h.specialty.creature);assert.equal(family.length,6);for(const h of family){const focus=h.specialty.bonuses.familyFocus;assert.equal(focus.limiters.creature,'goonk:'+h.specialty.creature);assert(focus.limiters.includeUpgrades);for(const image of Object.values(h.images))assert(fs.existsSync('mod/goonk/Content/Sprites/'+image));}
 assert(heroes.gardienGoonk.specialty.bonuses.familyVitality);assert.equal(Object.keys(heroes.goonkEngineer.specialty.bonuses).length,4);assert.equal(heroes.goonkArcanist.specialty.secondary,'core:sorcery');assert(heroes.goonkArcanist.spellbook.includes('core:magicArrow'));
 const classes=read('specialist-classes');for(const h of Object.values(classes)){assert.equal(h.faction,'goonk');for(const key of ['lowLevelChance','highLevelChance'])assert.equal(Object.values(h[key]).reduce((a,b)=>a+b,0),100);}
});
test('Progression map placements are symmetric, collision free and idempotent',()=>{
 execFileSync('python3',['-c',`import json,zipfile,importlib.util
spec=importlib.util.spec_from_file_location('p','scripts/place-adventure-objects.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
for file,size,count in [('000-Goonk.vmap',36,2),('001-Goonks.vmap',144,4)]:
 with zipfile.ZipFile('maps/'+file) as z:objects=json.loads(z.read('objects.json'))
 added=[o for o in objects if o['instanceName'].startswith('goonkProgression')];assert len(added)==count
 assert p.place_adventures(objects.copy(),size)==objects
 def cells(o):
  m=o['template']['mask'];return {(o['x']-(len(r)-1-x),o['y']-(len(m)-1-y)) for y,r in enumerate(m) for x,c in enumerate(r) if c in 'AB'}
 for o in added:
  assert all(not(cells(o)&cells(other)) for other in objects if other is not o)
  if size==144:assert any(a['type']==o['type'] and a['x']==143-o['x'] and a['y']==143-o['y'] for a in added)
`]);
});
