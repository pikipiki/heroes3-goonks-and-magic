import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root='mod/tum-era/',manifest=read(root+'mod.json');
const baseline=read('tests/fixtures/towns-stabilization-baseline.json');
const towns=read('tests/fixtures/town-upgrades-source.json');
test('All nine final evolutions have source costs, a real chain and a visible hall icon',()=>{
 assert.equal(towns.rows.length,9);assert.equal(new Set(towns.rows.map(r=>r.town)).size,9);
 for(const row of towns.rows){
  const file='config/'+row.town+'.json';assert(manifest.factions.includes(file));
  const t=read(root+'content/'+file)['core:'+row.town].town;
  const b=t.buildings.dwellingUp3Lvl7;
  assert.deepEqual(b.cost,row.cost,row.town);assert.equal(b.upgrades,'dwellingUp2Lvl7');
  assert(b.requires.includes('dwellingUp2Lvl7'));assert(!Object.hasOwn(b,'id'));
  assert.equal(t.creatures[6].at(-1).includes(':')?t.creatures[6].at(-1):'tum-era:'+t.creatures[6].at(-1),row.to);
  assert(t.hallSlots.flat(2).includes('dwellingUp3Lvl7'));
  const icon=read(root+'content/Sprites/'+t.buildingsIcons+'.json').images.find(i=>i.frame===row.hallId);
  assert(icon);assert(fs.existsSync(root+'content/Sprites/'+icon.file));
  const from=manifest.creatures.map(f=>read(root+'content/'+f)[row.from]).find(v=>v?.upgrades);
  assert(from?.upgrades.some(k=>k===row.to||'tum-era:'+k===row.to),row.town+' chain');
 }
});
test('Town stabilization preserves the existing artifacts, objects and source identities alongside reviewed additions',()=>{
 assert.deepEqual(Object.keys(read(root+'content/config/native-artifacts.json')).sort(),baseline.artifactKeys);
 assert.equal(baseline.artifactKeys.length,56);assert.deepEqual(manifest.objects.filter(f=>baseline.objects.includes(f)),baseline.objects);assert.equal(new Set(manifest.objects).size,manifest.objects.length);
 assert.deepEqual(Object.keys(read(root+'era-identities.json').creatures).map(Number).filter(id=>baseline.freshCreatureSourceIds.includes(id)).sort((a,b)=>a-b),baseline.freshCreatureSourceIds);
});
test('Every fresh town dependency has exactly one final health experience row',()=>{
 assert(manifest.creatures.includes('config/source-experience-defaults.json'));
 const merged=Object.assign({},...manifest.creatures.map(f=>read(root+'content/'+f)));
 for(const key of Object.values(read(root+'era-identities.json').creatures)){
  const name=key.split(':')[1],creature=merged[name];assert(creature,key+' must be registered');
  assert.equal(creature.stackExperience.filter(r=>r.bonus.type==='ERA_EXPERIENCE_HEALTH_PERCENT').length,1,key);
 }
 assert.equal(Object.keys(read(root+'content/config/era-bridge-experience.json').creatures).length,240+2);
});
