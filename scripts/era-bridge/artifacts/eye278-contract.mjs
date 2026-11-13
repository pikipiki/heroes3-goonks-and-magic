import assert from'node:assert/strict';import fs from'node:fs';
const pins=JSON.parse(fs.readFileSync(new URL('./eye278-source-pins.json',import.meta.url))).sha256;
const ordinary=new Map([[273,[1,0]],[274,[0,1]],[275,[2,0]],[276,[0,2]],[277,[2,2]],[278,[5,5]]]);
/** JS preflight equivalent of the scoped native admission, never a global count relaxation. */
export function admittedEmeraldEndpoints(id,definition,{eye278Policy}={}){
 if(!ordinary.has(id))return false;const bonuses=Object.values(definition.bonuses||{}).filter(b=>b.type==='CREATURE_DAMAGE'),values=[[],[]];
 for(const b of bonuses){if((b.valueType||'ADDITIVE_VALUE')!=='ADDITIVE_VALUE'||(b.effectRange||'NO_LIMIT')!=='NO_LIMIT')return false;const i=b.subtype==='creatureDamageMin'?0:b.subtype==='creatureDamageMax'?1:-1;if(i<0||!Number.isSafeInteger(b.val))return false;values[i].push(b.val);}
 for(const v of values)v.sort((a,b)=>a-b);
 if(id===278&&eye278Policy){
  if(Object.keys(definition.bonuses||{}).length!==2)return false;
  if(eye278Policy.schemaVersion!==2||Object.keys(eye278Policy).length!==5||JSON.stringify(eye278Policy.sourceCfgSha256)!==JSON.stringify(pins)||eye278Policy.contract!=='source-eye278-direct-ids-v2'||eye278Policy.artifact!=='tum-era:artifact278'||JSON.stringify(eye278Policy.parts)!==JSON.stringify([273,274,276,277].map(n=>'tum-era:artifact'+n))||JSON.stringify(definition.components)!==JSON.stringify(eye278Policy.parts))return false;
  return JSON.stringify(values)===JSON.stringify([[5],[5]]);
 }
 const expected=ordinary.get(id).map(n=>n?[n]:[]);return JSON.stringify(values)===JSON.stringify(expected);
}
export function assertDirectEye278(definition,policy){assert(admittedEmeraldEndpoints(278,definition,{eye278Policy:policy}),'Exact source278 recipe and two original endpoint bonuses required');}
