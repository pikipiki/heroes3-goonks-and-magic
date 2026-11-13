/** Source286/294 required by original transformation artifacts. No activation. */
export const SOURCE_NEUTRAL_DEPENDENCIES_CONTRACT='source-neutral-transform-dependencies-v1';
export const DEMILICH_PERIODIC_VALUES=Object.freeze([5,10,20,30,40,50,60,70,80,90,100]);
export const DEMILICH_PROC_VALUES=Object.freeze([5,5,10,15,20,25,30,35,40,45,50]);
export function reviewedNeutralDependency(text,{sourceId,contract}={}){
 if(contract!==SOURCE_NEUTRAL_DEPENDENCIES_CONTRACT||![286,294].includes(sourceId))throw Error('Explicit original neutral286/294 contract required');
 const expected=sourceId===286?{Flags:394242,Level:5}:{Flags:16403,Level:4};
 const rows=text.trim().split(/\r?\n/).map(line=>line.split('=').map(v=>v.trim()));
 if(rows.length!==2||new Set(rows.map(([k])=>k)).size!==2||rows.some(([k,v])=>expected[k]===undefined||Number(v)!==expected[k]))throw Error('Unreviewed neutral dependency CFG');
 return {sourceId,fields:expected,source:sourceId===286?{
  preAttack:{spell:24,mastery:3,chances:[...DEMILICH_PROC_VALUES],power:'Current active stack; unconditional5A0145 override'},
  afterAttack:{spell:71,mastery:1,chances:[...DEMILICH_PROC_VALUES],power:3},
  periodicSummon:{creature:60,rankPercents:[...DEMILICH_PERIODIC_VALUES],firstRound:2,interval:4,slot:-1,summoned:false,
   evidence:'71DFE0..71E006 roundIndex%4==1;714D22 flags0/slot−1;479B31..479BF2 sixtharg is graphical redraw only'},
 }:{regeneration:{chancePercent:100,rankHealth:Array.from({length:11},(_,i)=>i*9)},afterAttack:{spell:21,mastery:3,chances:Array(11).fill(100),power:'Current active stack; unconditional5A0145 override'}}};
}
