/** Explicit original351/352 CFG contract. No actor is activated here. */
export const SOURCE_DUNGEON_CONTRACT='source-dungeon-eighth-v1';
export function reviewedDungeon(text,{sourceId,contract}={}){
 if(contract!==SOURCE_DUNGEON_CONTRACT||![351,352].includes(sourceId))throw Error('Explicit Dungeon351/352 contract required');
 const expected=sourceId===351?{Flags:2069,Level:6,Town:5,UpgradesTo:352,Sharpshooters:1,ShootingRayColor:10092543}:{Flags:21,Level:6,Town:5,CreatureSpellPowerMultiplier:0,'Shot type':4};
 const rows=text.trim().split(/\r?\n/).map(l=>l.split('=').map(v=>v.trim()));
 if(rows.length!==Object.keys(expected).length||new Set(rows.map(([k])=>k)).size!==rows.length||rows.some(([k,v])=>expected[k]===undefined||Number(v)!==expected[k]))throw Error('Unreviewed Dungeon CFG');
 return {abilities:sourceId===351?{sourceSharpshooter:{type:'NO_DISTANCE_PENALTY',val:1}}:{},
  consumedKeys:sourceId===351?['Sharpshooters','ShootingRayColor']:['CreatureSpellPowerMultiplier','Shot type'],
  graphics:sourceId===351?{missile:{ray:Array.from({length:5},()=>({start:[255,255,255,255],end:[255,255,255,255]}))}}:undefined,
  source:{sourceId,ray:sourceId===351?{sourceColor:10092543,rawLowWord:65535,rgba:[255,255,255,255],evidence:'43F271 passes raw color;5A5CD8 uses lowWORD RGB565;43F2xx/5A5F30 five lines'}:null,
   slow:{spell:54,rankChance:Array.from({length:11},(_,i)=>i*3),mastery:0,power:sourceId===352?'current-active-CFG-multiplier0':'current-active-count',durationZero:'Cast visual and remove Haste53; no speed penalty because original getters require nonzero duration54'},
   chain:sourceId===352?{complete:false,nativeExecutor:'applyDungeonChainShot',kind:4,hops:4,undefinedSecondPhysicalPass:0,exception:'Original EAX after void LeaveCriticalSection has no defined ABI value; fixed0 according to owner preference; verified nearest-friendly termination is retained'}:null}};
}

export function sourceDungeonChainVisual(nativeChain){
 if(nativeChain?.index!==19||nativeChain?.levels?.base?.battleEffects?.directDamage?.chainLength!==4)throw Error('Original ChainLightning19 required');
 const spell=structuredClone(nativeChain);delete spell.index;
 spell.type='ability';spell.name='Chain shot';spell.school={};spell.level=4;spell.power=0;spell.defaultGainChance=0;spell.gainChance={};spell.graphics={};
 for(const name of['base','none','basic','advanced','expert']){const level=spell.levels[name]??={};delete level.effects;level.battleEffects={};level.description='Original physical chain shot presentation.';level.cost=0;level.power=0;}
 spell.flags={negative:true};return spell;
}
