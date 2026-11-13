import fs from 'node:fs';
import test from'node:test';import assert from'node:assert/strict';import{eighthTownRecruitment,eighthTownViewport,factionPortraitBuildings}from'../web/town-portrait.mjs';import{townBuildingArt}from'../web/town/building-art.mjs';
const base={id:150,key:'tum-era:dwellingLvl8',built:false,unlocksCreature:{id:269,name:'Light Templar'}},upgrade={id:151,key:'tum-era:dwellingUpLvl8',built:false,unlocksCreature:{id:278,name:'Light Paladin'}};
test('eighth access appears only with both real dwelling definitions and follows current unlocked form',()=>{assert.equal(eighthTownRecruitment({mode:'town',buildings:[base]}),null);assert.equal(eighthTownRecruitment({mode:'map',buildings:[base,upgrade]}),null);const s={mode:'town',buildings:[base,upgrade]};assert.equal(eighthTownRecruitment(s).unit.id,269);assert.equal(eighthTownRecruitment(s).built,false);s.buildings=[{...base,built:true},upgrade];s.recruits=[{id:269,level:7,variant:0,count:3}];assert.equal(eighthTownRecruitment(s).unit.id,269);assert.equal(eighthTownRecruitment(s).built,true);s.recruits.push({id:278,level:7,variant:1,count:3});assert.equal(eighthTownRecruitment(s).unit.id,278);});
test('eighth dwelling uses the complete city viewport and its own terrace',()=>{
 for(const[faction,catalog]of Object.entries(townBuildingArt)){const bases=new Map();let id=0;const records=Object.keys(catalog).map(key=>{let family=key.replace(/dwellingUp2?Lvl/,'dwellingLvl').replace(/mageGuild\d/,'mageGuild1');if(['citadel','castle'].includes(key))family='fort';if(['townHall','cityHall','capitol'].includes(key))family='villageHall';if(!bases.has(family))bases.set(family,id);const baseId=bases.get(family);return{id:id++,baseId,upgradeId:baseId===id-1?-1:baseId,key:'core:'+key,built:true};});
  for(const[w,h]of[[320,344],[390,730],[844,280],[568,180],[820,1066],[1180,706]]){const view=eighthTownViewport(w,h);assert.deepEqual(view,{x:0,y:0,width:w,height:h,badgeWidth:0});const drawn=factionPortraitBuildings(view.width,view.height,records,faction,{minimumRowHeight:44});assert(drawn.length>10);for(const b of drawn){assert(b.hit.w>=44&&b.hit.h>=44);assert(b.hit.x+view.x>=0&&b.hit.y+view.y>=0);assert(b.hit.x+view.x+b.hit.w<=w+.01&&b.hit.y+view.y+b.hit.h<=h+.01,faction+' target '+w+'x'+h);}}
 }
});

test('unbuilt eighth projects never appear as completed city structures',()=>{for(const faction of Object.keys(townBuildingArt)){
 const records=[{...base,baseId:150,upgradeId:-1},{...upgrade,baseId:150,upgradeId:150}];
 assert.deepEqual(factionPortraitBuildings(640,280,records,faction),[]);
 records[0].built=true;assert.equal(factionPortraitBuildings(640,280,records,faction)[0].id,150);
 records[1].built=true;assert.equal(factionPortraitBuildings(640,280,records,faction)[0].id,151);
}});

test('eighth building artwork reuses the original reviewed hall images without alteration',()=>{for(const faction of Object.keys(townBuildingArt))for(const frame of [88,89])assert.deepEqual(fs.readFileSync(new URL(`../web/town/eighth/${faction}-${frame}.png`,import.meta.url)),fs.readFileSync(new URL(`../mod/tum-era/content/Sprites/tum-era/eighth-${faction}-${frame}.png`,import.meta.url)));});
