/** Deterministic TUM policies for native event adapters. These functions do not install hooks. */
const integer=(x,name)=>{if(!Number.isSafeInteger(x))throw new TypeError(`${name} must be a safe integer`);return x;};
export function summonPower(encoded,heroPower){integer(encoded,'encoded');integer(heroPower,'heroPower');const p=encoded<0?Math.trunc(-encoded*heroPower/1000):encoded===0?heroPower:encoded;return p===0?1:p;}
export function dailyConversions(army,equippedArtifacts){const result=structuredClone(army);for(const art of equippedArtifacts)for(const {from,to} of art.upgrades??[])for(const stack of result)if(stack?.creature===from)stack.creature=to;return result;}
export function orbChaosDamage(damage){integer(damage,'damage');return Math.trunc(damage*3/2);}
export function goldenGooseIncome({owned,equipped,backpackOption=false}){integer(owned,'owned');integer(equipped,'equipped');return 7000*(backpackOption?owned:equipped);}
export function reflectionResistance(current,equipped){return equipped?Math.min(100,Math.max(0,current+20)):current;}
export function hydraQueenEligible({arrowTower=false,doubleWide=false,breathWeapon=false,lifeDrain=false}){return !arrowTower&&!doubleWide&&!breathWeapon&&!lifeDrain;}
export function wayfarerPolicy({human,equipped}){return !equipped?{}:human?{pathfindingLevel:3}:{dailyMovement:400,currentMovement:400};}
export function allowDifferentElementals({equipped,originalRestriction}){return equipped?true:!originalRestriction;}
export function fangarmCount({originalCount,currentCount,targetHp,fangarmHp,living,isFangarm=false,sideStackCount}) {
  for(const [key,value] of Object.entries({originalCount,currentCount,targetHp,fangarmHp,sideStackCount}))integer(value,key);
  if(fangarmHp<=0)throw new RangeError('fangarmHp must be positive');
  if(!living||isFangarm||originalCount<=0||currentCount>0||sideStackCount>20)return 0;
  return Math.max(0,Math.min(Math.trunc(originalCount*targetHp/fangarmHp),Math.trunc(originalCount/2)));
}
export function survivingFangarmGain(stacks){return stacks.reduce((sum,s)=>sum+(s.isFangarm?Math.max(0,s.count-s.originalCount):0),0);}
export function fangarmArmySlot(army){const existing=army.findIndex(s=>s?.isFangarm);return existing>=0?existing:army.findIndex(s=>!s||s.creature==null);}
export function exchangeCloak({attackerEquipped,defenderEquipped,attacker,defender,reborn=false}) {
  if(!attacker||!defender||!!attackerEquipped===!!defenderEquipped)return null;
  return {attacker:{attackDelta:defender.attack-attacker.attack,defenseDelta:defender.defense-attacker.defense,...(!reborn?{mana:defender.mana}:{})},
    defender:{attackDelta:attacker.attack-defender.attack,defenseDelta:attacker.defense-defender.defense,...(!reborn?{mana:attacker.mana}:{})},excludeCreatureIds:[145,146,147,148,149]};
}
export function equipEqualizer(first,second){return {first:Math.max(first,second),second:Math.max(first,second),storedDifference:second-first};}
export function unequipEqualizer(first,second,storedDifference){return {first:storedDifference>0?first-storedDifference:first,second:storedDifference<0?second+storedDifference:second};}
export function lightningResistance({spell,sameSide,ownRod,eitherRod,artifactImmune,current}) {
  if(!['lightningBolt','chainLightning'].includes(spell)||artifactImmune)return current;
  if(spell==='chainLightning'&&sameSide&&ownRod)return 100;
  return eitherRod?0:current;
}
export function lightningRodExtraDamage({spellCoefficient,spellEffect,heroPower}){return spellCoefficient*heroPower+spellEffect;}
export function massSpellPlan({spell,artifactEquipped,heroPower,schoolLevel,actingSide,mainTarget,stacks}) {
  if(!artifactEquipped||!['resurrection','animateDead','implosion'].includes(spell))return [];
  const side=spell==='implosion'?1-actingSide:actingSide,power=Math.min(255,Math.max(1,Math.trunc(heroPower*30/100)));
  return stacks.filter(s=>s.side===side&&s.id!==mainTarget&&s.creatureId> -1&&!s.arrowTower&&s.count>0&&s.canReceiveSpell).map(s=>({stackId:s.id,position:s.position,spell,schoolLevel,power}));
}
export function oblivionPolicy({eitherEquipped,spell}){return {resistance:eitherEquipped&&['resurrection','animateDead','sacrifice'].includes(spell)?100:null,removeDeadBodies:eitherEquipped,necromancyPower:eitherEquipped?0:null};}
export function interferencePower({heroPower,charm=false,seal=false,plate=false}){const reduction=Math.min(100,(charm?10:0)+(seal?10:0)+(plate?25:0));return reduction?Math.max(1,Math.trunc((100-reduction)*heroPower/100)):heroPower;}
export function dragonheartCandidates(creatures){return creatures.filter(c=>c.isDragon&&!(c.eraId>=341&&c.eraId<=347)).map(c=>c.id);}
export function chooseDragon(candidates,randomIndex){if(!candidates.length)return null;integer(randomIndex,'randomIndex');if(randomIndex<0||randomIndex>=candidates.length)throw new RangeError('random index outside dragon pool');return candidates[randomIndex];}
