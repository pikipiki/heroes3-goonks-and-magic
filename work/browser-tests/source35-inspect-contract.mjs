import assert from'node:assert/strict';
export const resourceOrder=['wood','mercury','ore','sulfur','crystal','gems','gold'];
export const extendedFields=['growth','aiValue','fightValue','shots'];
function buildGroups(plan,sourceRows,held){
 assert.equal(plan.schemaVersion,1);assert.equal(plan.summary.primitiveCandidates,66);assert.equal(plan.summary.heldIdentities,8);
 const admitted=plan.entries.filter(x=>x.status===(held?'held-for-semantic-review':'primitive-stat-candidate-not-activated'));assert.equal(admitted.length,held?8:66);const ids=new Set(),natives=new Set();
 const cases=admitted.map(entry=>{assert(!ids.has(entry.eraId));ids.add(entry.eraId);assert(!natives.has(entry.nativeId));natives.add(entry.nativeId);if(held){assert(entry.guards.length);assert(Object.hasOwn(plan.held,entry.nativeId));assert(!Object.hasOwn(plan.patches,entry.nativeId));}else{assert.equal(entry.guards.length,0);assert(Object.hasOwn(plan.patches,entry.nativeId));assert(!Object.hasOwn(plan.held,entry.nativeId));}const s=sourceRows[entry.eraId];assert(s&&!s.invalidRange);return{eraId:entry.eraId,nativeId:entry.nativeId,expected:{key:entry.nativeId,count:1,health:s.hitPoints,attack:s.attack,defense:s.defense,speed:s.speed,damageMin:s.damage.min,damageMax:s.damage.max,cost:resourceOrder.map(k=>s.cost[k])},sourceStats:{growth:s.growth,aiValue:s.aiValue,fightValue:s.fightValue,shots:s.shots},patchedFields:held?[]:entry.fields,sourceDifferentFields:entry.fields,...(held?{measurementOnly:true,semanticGuards:entry.guards,sourceNativeLevelComparison:entry.level}:{})};});
 return Array.from({length:Math.ceil(cases.length/7)},(_,i)=>cases.slice(i*7,i*7+7));
}
export const buildInspectGroups=(plan,rows)=>buildGroups(plan,rows,false);
export const buildHeldInspectGroups=(plan,rows)=>buildGroups(plan,rows,true);
export function assessInspectCreature(actual,item,{extended='legacy'}={}){
 assert(['legacy','required'].includes(extended),'Unknown extended snapshot contract');assert(actual,'Missing source'+item.eraId);assert.equal(actual.key,item.nativeId,'Unexpected source/native identity');assert.equal(actual.count,1,'Fixture stack count must stay1');const differences=[],observedExtendedFields=[],missingExtendedFields=[];
 for(const[k,want]of Object.entries(item.expected)){const got=k==='cost'?actual[k]?.slice(0,7):actual[k];if(JSON.stringify(got)!==JSON.stringify(want))differences.push({field:k,source:want,native:got});}
 if(actual.cost?.slice(7).some(x=>x!==0))differences.push({field:'additional-native-resource-costs',source:[],native:actual.cost.slice(7)});
 for(const key of extendedFields){if(!Object.hasOwn(actual,key)){missingExtendedFields.push(key);if(extended==='required')differences.push({field:key,source:item.sourceStats[key],native:null,reason:'required-native-snapshot-field-missing'});continue;}assert(Number.isFinite(actual[key]),'Invalid native extended field:'+key);observedExtendedFields.push(key);if(actual[key]!==item.sourceStats[key])differences.push({field:key,source:item.sourceStats[key],native:actual[key]});}
 return{differences,observedExtendedFields,missingExtendedFields,extendedContract:extended,completeExtendedSnapshot:missingExtendedFields.length===0};
}
export const compareInspectCreature=(actual,item,options)=>assessInspectCreature(actual,item,options).differences;
