import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{recruitMaximum,recruitmentFamilies}from'../web/recruitment-families.mjs';
test('Evolution gallery retains locked forms and does not multiply shared family stock',()=>{const f=[{level:0,count:12,variants:[{id:1,built:true},{id:2,built:true},{id:3,built:false}]}];assert.equal(recruitmentFamilies({fortFamilies:f}),f);assert.equal(f[0].count,12);assert.equal(f[0].variants.length,3);});
test('Recruitment maximum accounts for all resources, stock, free units and unavailable dwellings',()=>{assert.equal(recruitMaximum({built:true,count:12,cost:[0,0,0,0,2,0,90,1]},[0,0,0,0,6,0,999,2]),2);assert.equal(recruitMaximum({built:false,count:12,cost:[]},[]),0);assert.equal(recruitMaximum({built:true,count:12,cost:[]},[]),12);assert.equal(recruitMaximum({built:true,count:12,cost:[0,0,0,0,0,0,90]},[]),0);});
test('Goonk families have distinct forms, legal native dwelling chain, translations and owned sprite sets',()=>{const read=p=>JSON.parse(fs.readFileSync(p)),dir='mod/goonk/',c=read(dir+'Content/config/creatures.json'),town=read(dir+'Content/config/faction.json').goonk.town,fr=read(dir+'Content/translation/french.json');assert.equal(Object.keys(c).length,22);for(const[i,ids]of town.creatures.entries()){assert.equal(ids.length,i===6?4:3);for(let j=0;j<ids.length-1;j++)assert.deepEqual(c[ids[j]].upgrades,[ids[j+1]]);assert(!c[ids.at(-1)].upgrades?.length);const b=town.buildings['dwellingUp2Lvl'+(i+1)];assert.equal(b.id,44+i);assert.equal(b.upgrades,'dwellingUpLvl'+(i+1));assert(fr['creatures.goonk.'+ids[2]+'.name.singular']);assert(c[ids[2]].hitPoints>c[ids[1]].hitPoints);const a=read(dir+'Content/Sprites/'+c[ids[2]].graphics.animation+'.json');for(const g of [0,2,12]){const seq=a.sequences.find(s=>s.group===g);assert(seq.frames.every(f=>f.includes('-exalted-')),ids[2]+' must use its own animation');for(const frame of seq.frames)assert(fs.existsSync(dir+'Content/Sprites/'+frame));}}});

test('The Solar Crucible unlocks the distinct fourth tier-seven form',()=>{
 const read=p=>JSON.parse(fs.readFileSync('mod/goonk/Content/'+p));
 const {goonk:{town}}=read('config/faction.json'),creatures=read('config/creatures.json');
 const key='dwellingUp3Lvl7',building=town.buildings[key],solar=creatures.maillemailleSolar;
 assert.equal(building.id,57);
 assert.deepEqual(building.requires,['dwellingUp2Lvl7']);
 assert.equal(building.upgrades,'dwellingUp2Lvl7');
 assert.equal(town.structures[key].builds,key);
 assert(town.hallSlots.flat().some(slot=>slot.includes(key)));
 assert.equal(solar.level,7);
 assert(solar.hitPoints>creatures.maillemailleExalted.hitPoints);
 assert.equal(solar.abilities.fireproof.subtype,'spellSchool.fire');
 for(const group of read('Sprites/goonk/fire-solar.json').sequences){
  assert(group.frames.every(f=>f.startsWith('goonk/fire-solar-')&&fs.existsSync('mod/goonk/Content/Sprites/'+f)));
 }
});
