import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
test('TUM uses the VCMI port and its existing WoG level-eight dependency',()=>{
 const mod=read('mod/third-upgrades/mod.json');assert.deepEqual(mod.depends,['wake-of-gods.level8units']);assert.equal(mod.compatibility.min,'1.6.1');assert.deepEqual(mod.settings.combat.badLuckChance,[2,4,6]);
 for(const f of ['book','summoner_book'])for(const a of Object.values(read('mod/third-upgrades/content/config/artifacts/'+f+'.json'))){assert(!Array.isArray(a.bonuses));assert(a.graphics.scenarioBonus);assert(!a.graphics.bonus);}
});
test('Red Bones Dragon has the original ERA stats, a real upgrade chain and a fourth Necropolis dwelling',()=>{
 const c=read('mod/tum-era/content/config/red-bones-dragon.json'),d=c.redBonesDragon,t=read('mod/tum-era/content/config/necropolis.json')['core:necropolis'].town;
 assert.deepEqual([d.hitPoints,d.speed,d.attack,d.defense,d.damage.min,d.damage.max],[400,18,30,27,40,75]);assert.equal(d.cost.gold,6000);assert.equal(d.cost.mercury,3);assert.deepEqual(c['wake-of-gods.level8units:bloodDragon'].upgrades,['redBonesDragon']);assert.equal(t.creatures[6].at(-1),'redBonesDragon');assert(!('id' in t.buildings.dwellingUp3Lvl7),'Predefined dwellingUp3Lvl7 resolves native57 without an ignored id field');assert.equal(t.buildings.dwellingUp3Lvl7.upgrades,'dwellingUp2Lvl7');assert(t.hallSlots[4][2].includes('dwellingUp3Lvl7'));assert.equal(d.abilities.regeneration.val,50);assert.equal(d.abilities.noRetaliation.type,'BLOCKS_RETALIATION');
});
test('The original dragon DEF files include frames and both extracted portraits are PNGs',()=>{
 for(const name of ['cr224.def','AVWCR224.DEF']){const b=fs.readFileSync('mod/tum-era/content/Sprites/tum-era/'+name);let p=784,frames=0;for(let g=0;g<b.readUInt32LE(12);g++){const n=b.readUInt32LE(p+4);frames+=n;p+=16+13*n;for(let i=0;i<n;i++)assert(b.readUInt32LE(p+i*4)<b.length);p+=n*4;}assert(frames>0);}
 for(const name of ['portrait-small.png','portrait-large.png']){const b=fs.readFileSync('mod/tum-era/content/Sprites/tum-era/'+name);assert.equal(b.subarray(1,4).toString(),'PNG');assert(b.readUInt32BE(16)>0);}
 for(const town of ['castle','inferno','necropolis','conflux','stronghold']){
  const icons=read('mod/tum-era/content/Sprites/tum-era/'+town+'-hall.json'),fourth=icons.images.find(image=>image.frame===57);
  assert.equal(fourth.file,'tum-era/'+town+'-building77.png');
  const image=fs.readFileSync('mod/tum-era/content/Sprites/'+fourth.file);assert.equal(image.subarray(1,4).toString(),'PNG');assert(image.readUInt32BE(16)>0);
 }

});
