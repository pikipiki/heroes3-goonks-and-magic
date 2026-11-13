/** Original eighth recruitment data -> native eighth-tier buildings.
 * Native BuildingID150/151 are eighth-tier dwellings; original ERA88/89 are
 * resource indices, not native building identifiers. No active manifest is
 * modified, and incomplete creature or hall contracts cannot enable a town.
 */
import crypto from 'node:crypto';

export const EIGHTH_TOWNS=['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux'];
const resources=['wood','mercury','ore','sulfur','crystal','gems','gold'];
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');

export function readSourceEighthTown(text,{townIndex,script}={}){
 if(!Number.isInteger(townIndex)||townIndex<0||townIndex>8)throw Error('Original town index0..8 required');
 const fields=new Map();
 for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)){
  const match=/^([^=]+)=(.*)$/.exec(line.trim());if(!match)continue;
  const key=match[1].trim();if(fields.has(key))throw Error('Duplicate town key '+key);
  fields.set(key,match[2].trim());
 }
 const quoted=key=>{const value=fields.get(key);if(!/^"[^"\r\n]*"$/.test(value??''))throw Error('Missing quoted source field '+key);return value.slice(1,-1);};
 const ints=key=>{const value=quoted(key);if(!/^-?\d+(?:\s+-?\d+)*$/.test(value))throw Error('Invalid source integers '+key);return value.split(/\s+/).map(Number);};
 const roster=ints('level_7_creatures');
 if(roster.length!==4||roster[0]<197||roster[1]<197||roster[2]!==-1||roster[3]!==-1||roster[0]===roster[1])throw Error('Complete original eighth family required');
 const assignments=[...String(script??'').matchAll(/!!UN:T(\d+)\/7\/0\/(\d+);/g)].map(m=>[Number(m[1]),Number(m[2])]);
 if(assignments.length!==9||new Set(assignments.map(a=>a[0])).size!==9||assignments.find(a=>a[0]===townIndex)?.[1]!==roster[0])throw Error('Source option roster disagrees with town data');
 const guardian=Number(fields.get('town_guardian'));if(!Number.isSafeInteger(guardian)||guardian!==roster[1])throw Error('Source eighth guardian disagrees with roster');
 const dependencies=ints('BuildingDeps0088');
 if(JSON.stringify(dependencies)!=='[35,-1]')throw Error('Unreviewed eighth dwelling prerequisites');
 const buildings=[88,89].map(id=>{
  const suffix=String(id).padStart(4,'0'),cost=ints('BuildingCost'+suffix);
  if(cost.length!==7||cost.some(v=>!Number.isSafeInteger(v)||v<0))throw Error('Invalid original eighth cost');
  const name=quoted('BuildingName'+suffix),description=quoted('BuildingDesc'+suffix);
  if(!name||!description)throw Error('Source eighth name/description required');
  return {sourceId:id,nativeId:id===88?150:151,key:id===88?'dwellingLvl8':'dwellingUpLvl8',name,description,cost:Object.fromEntries(resources.map((r,i)=>[r,cost[i]]))};
 });
 return {townIndex,town:'core:'+EIGHTH_TOWNS[townIndex],sourceCfgSha256:sha(text),sourceScriptSha256:sha(script),roster,guardian,buildings,
  upgradeAuthority:'Town level_7_creatures defines recruitment353/354; late ERM line360 MA:U353/354 overrides CFG353 self-upgrade, while CFG354 upgrades back to353.'};
}

export function compileEighthTownAccess(records,{enabled,baselineTowns,actorContracts,halls}={}){
 if(typeof enabled!=='boolean')throw Error('Explicit eighth-monsters option required');
 if(records.length!==9||new Set(records.map(r=>r.town)).size!==9||records.some((r,i)=>r.town!=='core:'+EIGHTH_TOWNS[i]))throw Error('All nine source towns must be compiled atomically');
 if(new Set(records.flatMap(r=>r.roster.slice(0,2))).size!==18)throw Error('All eighteen original eighth actors must be distinct');
 if(!enabled)return {enabled:false,patch:{},source:records,scope:'No roster, building or availability changes.'};
 const patch={};
 for(const record of records){
  const baseline=baselineTowns?.[record.town];if(!baseline||baseline.creatures?.length!==7)throw Error('Seven-tier native baseline required '+record.town);
  const roster=record.roster.slice(0,2).map(id=>{
   const contract=actorContracts?.[id];
   if(!contract||contract.complete!==true||contract.nativeValidated!==true||!/^[-\w.]+:[-\w.]+$/.test(contract.nativeId??''))throw Error('Incomplete eighth creature contract '+id);
   return contract.nativeId;
  });
  if(new Set(roster).size!==2)throw Error('Distinct native eighth variants required');
  const hall=halls?.[record.town];
  if(!hall||hall.sourceFrames?.[150]!==88||hall.sourceFrames?.[151]!==89||typeof hall.animation!=='string'||!hall.animation.startsWith('tum-era/'))throw Error('Exact source hall frame remap required '+record.town);
  if(baseline.buildings?.dwellingLvl8||baseline.buildings?.dwellingUpLvl8)throw Error('Existing native eighth dwelling must not be overwritten');
  const creatures=[...structuredClone(baseline.creatures),roster];
  const hallSlots=structuredClone(baseline.hallSlots);if(!Array.isArray(hallSlots))throw Error('Original native hall layout required');
  if(hallSlots.length!==5||hallSlots[4].length!==3)throw Error('Reviewed five-row hall layout required');
  hallSlots[4].push(['dwellingLvl8','dwellingUpLvl8']);
  const buildings=Object.fromEntries(record.buildings.map(b=>[b.key,{id:b.nativeId,name:b.name,description:b.description,cost:b.cost,
   requires:[b.sourceId===88?'dwellingLvl6':'dwellingLvl8'],...(b.sourceId===89?{upgrades:'dwellingLvl8'}:{})}]));
  patch[record.town]={town:{creatures,hallSlots,buildingsIcons:hall.animation,buildings}};
 }
 return {enabled:true,patch,source:records,scope:'Native eighth-tier recruitment and source hall resources only; no automatic ERA script execution or creature substitution.'};
}
