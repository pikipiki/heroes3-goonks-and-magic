/** Guaranteed0/100 accuracy controls for source5A6500's per-target query side. */
import fs from 'node:fs';import assert from 'node:assert/strict';
import {readEraArchive} from '../../scripts/era-bridge/resources.mjs';
const firstTop=bytes=>{const groups=bytes.readUInt32LE(12);assert(groups>0);let p=784;for(let g=0;g<groups;g++){const count=bytes.readUInt32LE(p+4),offsets=p+16+count*13;if(count)return bytes.readUInt32LE(bytes.readUInt32LE(offsets)+28);p=offsets+count*4;}throw Error('No source DEF frame');};
export async function runDungeonCatalystCases({boot,combat,cmd,state,wait,page,finish,hp}){
 const stage=process.env.CONFLUX_STAGE||'work/downloads/wog-port157/conflux-stage',archive=readEraArchive(fs.readFileSync('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3sprite.lod'));
 const gnollTop=firstTop(archive.extract('CGNOLL.DEF'));
 for(const mode of(process.env.DUNGEON_CATALYST_CASES||'physicalOrb,catalyst').split(',')){
  const actor='tum-era:eraCreature352',friendKey=mode==='catalyst'?'tum-era:eraCreature356':'core:blackDragon',top=firstTop(mode==='catalyst'?fs.readFileSync(stage+'/content/Sprites/tum-era/creatures/356/CR356.def'):archive.extract('CBDRGN.DEF'));
  const noRandom={noMorale:{type:'NO_MORALE'},noLuck:{type:'NO_LUCK'}};
  await boot({seed:85213,artifacts:mode==='physicalOrb'?{misc1:'core:orbOfVulnerability'}:{},army:[{type:actor,amount:10},{type:friendKey,amount:1}],garrison:[{type:'core:gnoll',amount:1},{type:'core:gnoll',amount:1}],controls:{[actor]:{damage:{min:50,max:50},abilities:noRandom},[friendKey]:{hitPoints:1000000,speed:30,abilities:{...noRandom,fixtureResistance:{type:'MAGIC_RESISTANCE',val:100}}},'core:gnoll':{hitPoints:1000000,attack:0,defense:0,speed:1,damage:{min:1,max:1},abilities:{...noRandom,fixtureInactive:{type:'NOT_ACTIVE'},fixtureNoRetal:{type:'NO_RETALIATION'}}}}});
  await combat();await wait(key=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===key,friendKey);
  const initial=await state(),friend=initial.battleUnits.find(u=>u.key===friendKey),enemies=initial.battleUnits.filter(u=>u.enemy);
  const point=(hex,margin,wide=false)=>({x:44*(hex%17)+(Math.floor(hex/17)%2===0?22:0)-(wide?22:0),y:42*Math.floor(hex/17)-Math.trunc((267-margin)/2)}),distance=(a,b)=>Math.floor(Math.hypot(a.x-b.x,a.y-b.y)),friendlyPoint=point(friend.occupied[0],top,true);
  enemies.sort((a,b)=>distance(friendlyPoint,point(a.occupied[0],gnollTop))-distance(friendlyPoint,point(b.occupied[0],gnollTop)));
  const primary=enemies[0],other=enemies[1];assert(distance(friendlyPoint,point(primary.occupied[0],gnollTop))<distance(point(other.occupied[0],gnollTop),point(primary.occupied[0],gnollTop)),'Original DEF crop centres put the living friendly before the next enemy');
  await cmd(13,initial.activeStack,initial.round);await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key==='tum-era:eraCreature352');const before=await state();assert(before.battleUnits.find(u=>u.stackId===primary.stackId).canShootAt);await cmd(14,4,primary.occupied[0]);
  await wait(({id,health})=>{const u=goonkMobileState.battleUnits.find(u=>u.stackId===id);return u&&(u.count-1)*u.maximumHealth+u.currentHealth<health;},{id:primary.stackId,health:hp(primary)});await page().waitForTimeout(1700);
  const after=await state(),primaryDamage=hp(primary)-hp(after.battleUnits.find(u=>u.stackId===primary.stackId)),otherDamage=hp(other)-hp(after.battleUnits.find(u=>u.stackId===other.stackId)),friendDamage=hp(friend)-hp(after.battleUnits.find(u=>u.stackId===friend.stackId));
  assert.equal(primaryDamage,500,'Source Shot4 currentCount10 times fixed50 without normal attack scaling');assert.equal(friendDamage,0,'Original friendly candidate termination never damages that friend');
  assert.equal(otherDamage,mode==='catalyst'?250:0,mode==='catalyst'?'Friendly side0 querySide1 has no hero, so Catalyst cannot negate100% resistance; chain continues':'A real physicalOrb on the target-side hero still negates natural immunity bilaterally; original friendly termination retained');
  await finish('dungeonCatalyst-'+mode,{sourceEvidence:'5A6500/5A6582 passes query1 for targetside0 and query0 for targetside1; CURRENT is separately preserved.44A420 guards only casterOrb/Catalyst query;44A436 still checks physical targetHeroOrb.',crop:{gnollTop,friendTop:top},before,after,primaryDamage,otherDamage,friendDamage});
 }
}
