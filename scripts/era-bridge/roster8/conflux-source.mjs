/** Whole355/356 source contract. Installation still requires native evidence. */
import{SOURCE_FAERIE_POOL}from'./primal-faerie.mjs';
export const SOURCE_CONFLUX_CONTRACT='source-conflux-eighth-v1';
export const SOURCE_CONFLUX_G_PERCENT=Object.freeze([5,10,20,30,40,50,60,70,80,90,95]);
export const SOURCE_CONFLUX_SUMMON_PERCENT=Object.freeze([0,2,5,5,10,10,15,15,20,20,25]);
// Original+Emerald+TUM spellflag closure, independently reconstructed by
// artifacts/review-spell-artifact-cache.mjs (not inferred from native bonuses).
export const SOURCE_CONFLUX_SPELL_RESET_IDS=Object.freeze([1,86,87,88,89,123,124,128,135,136,192,193,194,195,197,198,219,220,232,279]);
export function sourceConfluxFeaturePolicy(){
 const core={1:'spellScroll',86:'tomeOfFireMagic',87:'tomeOfAirMagic',88:'tomeOfWaterMagic',89:'tomeOfEarthMagic',123:'seaCaptainsHat',124:'spellbindersHat',128:'armageddonsBlade',135:'titansThunder',136:'admiralsHat'};
 return{schemaVersion:1,creatures:['tum-era:eraCreature355','tum-era:eraCreature356'],spellArtifactReset:SOURCE_CONFLUX_SPELL_RESET_IDS.map(id=>id<171?'core:'+core[id]:'tum-era:artifact'+id)};
}
export function reviewedConflux(text,{sourceId,contract,resolveSpell}={}){
 if(contract!==SOURCE_CONFLUX_CONTRACT||![355,356].includes(sourceId))throw Error('Explicit whole Conflux355/356 contract required');
 const expected=sourceId===355?{isTeleporter:1,AfterMeleeSpell:15,AfterDefendSpell:13,AfterWoundSpell:29,AfterActionSpellMastery:0,Flags:17,Level:6,Town:8,UpgradesTo:356,isSorceress:1}:{isTeleporter:1,ACAST_CUSTOM_Chance:100,ACAST_CUSTOM_Spell:60,Flags:17,Level:6,Town:8,'Spell 1':8,'Spell 2':7,'Spell 3':2,MagicChannel:1,isAimedCaster:1,isFaerie:1,CreatureMimicArtifact2:88,isVulnerabilityCatalyst:1};
 const entries=text.trim().split(/\r?\n/).map(l=>l.split('=').map(v=>v.trim()));
 if(entries.length!==Object.keys(expected).length||new Set(entries.map(([k])=>k)).size!==entries.length||entries.some(([k,v])=>expected[k]===undefined||Number(v)!==expected[k]))throw Error('Unreviewed Conflux CFG');
 const abilities={sourceTeleport:{type:'FLYING',subtype:'movementTeleporting'}};
 if(sourceId===356){
  abilities.sourceFaeriePower={type:'CREATURE_SPELL_POWER',val:100};
  abilities.sourceMagicChannel={type:'MANA_CHANNELING',val:20};
  for(const{spell,weight}of SOURCE_FAERIE_POOL){const key=resolveSpell?.(spell);if(typeof key!=='string'||!key.includes(':'))throw Error('Exact native spell resolver required for '+spell);abilities['sourceFaerieCast'+spell]={type:'SPELLCASTER',subtype:key,val:2,addInfo:weight};}
 }
 return{abilities,consumedKeys:Object.keys(expected).filter(k=>!['Flags','Level','Town','UpgradesTo'].includes(k)),featurePolicy:sourceConfluxFeaturePolicy(),source:{dormantKeys:sourceId===355?['isSorceress']:['ACAST_CUSTOM_Chance','ACAST_CUSTOM_Spell'],afterMelee:sourceId===355?{spell:15,mastery:0,kind:1}:undefined,afterDefend:sourceId===355?{spell:13,name:'Fire Wall',mastery:0,kind:1,hexes:2,duration:2,rawDamage:'10*currentCount+10',casterHero:null}:undefined,afterWound:sourceId===355?{spell:29,mastery:0,kind:1,remainingOwnCount:true}:undefined,tomeAvailableCache:sourceId===356?{artifact:88,learned:false,field:'hero+0x430',reset:'worn source spellflag/combo-spellflag artifact change only',staleAfterArmyRemoval:true}:undefined,catalyst:sourceId===356?{currentActiveSideOnly:true,requiresCasterHeroArgument:true}:undefined}};
}

export function reviewedConfluxExperienceRows(rows,{sourceId,contract}={}){
 if(contract!==SOURCE_CONFLUX_CONTRACT||![355,356].includes(sourceId))throw Error('Explicit whole Conflux experience contract required');
 const proc=Array.from({length:11},(_,i)=>(i+1)*5),speed=[0,0,0,0,1,1,1,1,1,1,2];
 const expected=sourceId===355?[
  ['g','%',SOURCE_CONFLUX_G_PERCENT],['p','#21',proc],['a','#17',proc],['p','#23',proc],['a','#16',proc],['S','+',speed]
 ]:[['g','%',SOURCE_CONFLUX_G_PERCENT],...[112,113,114,115].map(id=>['u','#'+id,SOURCE_CONFLUX_SUMMON_PERCENT]),['S','+',speed]];
 if(rows.length!==expected.length||rows.some((r,i)=>r.creature!==sourceId||r.code!==expected[i][0]||r.modifier!==expected[i][1]||JSON.stringify(r.values)!==JSON.stringify(expected[i][2])))throw Error('Unreviewed Conflux experience row set/order/values');
 return{sourceId,contract,rows:rows.length};
}

export function sourceConfluxFireWallTrigger(base){
 if(base?.targetType!=='CREATURE'||base.power!==10||base.level!==2||base.flags?.damage!==true||base.flags?.negative!==true||base.flags?.special!==true||base.levels?.none?.power!==10||base.levels?.expert?.power!==50)throw Error('Original native FireWall trigger template changed');
 const result=structuredClone(base);delete result.index;return result;
}
