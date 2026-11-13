/** Source71AD24/71ABC7 three-pass loader model; not native state or activation. */
export const SOURCE_XP_CACHE_SLOTS=14;
export const SOURCE_XP_RECORD_BYTES=17;
export const SOURCE_XP_ALLOCATED_RECORDS=20;
export const SOURCE_XP_OVERWRITE_CODES='ADHMSm';
const byte=n=>((n%256)+256)%256;
function record(row){return{active:true,code:row.code,modifier:row.modifier.startsWith('#')?byte(Number(row.modifier.slice(1))):row.modifier.charCodeAt(0),chances:row.values.map(byte),sourceLine:row.line,sourceId:row.creature};}
export function sourceXpFindSlot(table,code=null,modifier=-1){
 if(!Array.isArray(table)||table.length!==14)throw Error('Original14-slot table required');
 if(code!==null){const i=table.findIndex(r=>r?.active&&r.code===code&&(modifier===-1||r.modifier===modifier));if(i>=0)return i;}
 return table.findIndex(r=>!r?.active);
}
export function simulateSourceXpCache14(sourceRows,{sourceId,zeroBasedLevel,creatureLimit=1024}){
 if(!Number.isInteger(sourceId)||sourceId<0||sourceId>=creatureLimit||!Number.isInteger(zeroBasedLevel)||zeroBasedLevel<0||zeroBasedLevel>7)throw Error('Bounded source actor/level required');
 const empty=()=>Array(14).fill(null),defaults=Array.from({length:8},empty),table=empty(),trace=[],dropped=[];
 const load=(target,row,phase,overwrite)=>{const slot=sourceXpFindSlot(target,overwrite?row.code:null);if(slot<0){dropped.push({phase,sourceLine:row.line,sourceId:row.creature});return;}const previous=target[slot];target[slot]=record(row);trace.push({phase,sourceLine:row.line,sourceId:row.creature,slot,overwroteLine:previous?.sourceLine??null});};
 for(const row of sourceRows)if(row.creature>=-8&&row.creature<=-1)load(defaults[-row.creature-1],row,'defaultTable',false);
 for(const[level,phase]of[[zeroBasedLevel,'levelDefault'],[7,'universalDefault']])for(const row of defaults[level])if(row?.active){const slot=sourceXpFindSlot(table,row.code);if(slot<0){dropped.push({phase,sourceLine:row.sourceLine,sourceId:row.sourceId});continue;}if(table[slot]?.active){trace.push({phase,sourceLine:row.sourceLine,sourceId:row.sourceId,slot,skippedExistingCode:true});continue;}table[slot]=structuredClone(row);trace.push({phase,sourceLine:row.sourceLine,sourceId:row.sourceId,slot});}
 for(const row of sourceRows)if(row.creature===sourceId)load(table,row,'actor',SOURCE_XP_OVERWRITE_CODES.includes(row.code));
 return{sourceId,zeroBasedLevel,allocatedRecords:20,scannedSlots:14,recordBytes:17,table,trace,dropped};
}
