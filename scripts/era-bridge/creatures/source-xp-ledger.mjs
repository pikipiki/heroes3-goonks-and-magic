/** Pure strict source XP ledger. No native bonus aggregation or mutation. */
import {REVIEWED_SOURCE_XP_ROWS} from './source-xp-reviewed-rows.mjs';
export const SOURCE_XP_LEDGER_CONTRACT='source-ordered-experience-casts-v1';
export const SOURCE_XP_ARCHIVE_SHA='452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c';
const codes=['p','J','j','a','K','k'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=m=>{throw new Error('Source XP ledger: '+m);};
const keys=(o,allowed)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!allowed.includes(k)))fail('unknown policy fields');};
export function sourceXpSemantics(code,spellId){
 if(!codes.includes(code)||!Number.isInteger(spellId)||spellId<0||spellId>=87)fail('invalid code/spell');
 return {phase:['p','J','j'].includes(code)?'before':'after',phaseOrder:codes.indexOf(code)%3,mastery:['p','a'].includes(code)?3:['J','K'].includes(code)?2:1,power:spellId===62||(spellId>=70&&spellId<=80)?'literal3':'currentActiveCreatureSourceTransform',casterKind:1,currentSide:'preserved',primaryQuerySide:'casterHypnotizeAware',chance:'skipZeroOtherwiseDraw1To100',aliveGate:'onceAtCodeGroupEntry'};
}
const key=r=>`${r.sourceId}:${r.code}:${r.modifier}`;
export function compileSourceXpLedger({archiveSha256,sourceRows,resolveCreature,resolveSpell}){
 if(archiveSha256!==SOURCE_XP_ARCHIVE_SHA||!Array.isArray(sourceRows))fail('pinned archive/source rows required');
 const actors=new Map();
 for(const expected of REVIEWED_SOURCE_XP_ROWS){
  const matches=sourceRows.filter(r=>r.creature===expected.sourceId&&r.code===expected.code&&r.modifier===expected.modifier);
  if(matches.length!==1)fail('missing/duplicate '+key(expected));const row=matches[0];
  if(row.line!==expected.sourceLine||!same(row.values,expected.chances))fail('changed row '+key(expected));
  if(resolveCreature(expected.sourceId)!==expected.nativeId||resolveSpell(Number(expected.modifier.slice(1)))!==expected.spell)fail('identity mismatch '+key(expected));
  const all=sourceRows.filter(r=>r.creature===expected.sourceId),ordinal=all.indexOf(row);if(ordinal!==expected.sourceOrdinal)fail('changed source ordinal');
  const entry={sourceId:expected.sourceId,nativeId:expected.nativeId,sourceLine:row.line,sourceOrdinal:ordinal,code:row.code,modifier:row.modifier,spell:expected.spell,chances:[...row.values],...sourceXpSemantics(row.code,Number(row.modifier.slice(1))),sourceSlot:null};
  const entries=actors.get(expected.nativeId)||[];entries.push(entry);actors.set(expected.nativeId,entries);
 }
 const result={schemaVersion:1,contract:SOURCE_XP_LEDGER_CONTRACT,enabled:false,complete:false,archiveSha256,actors:[...actors].map(([nativeId,rows])=>({nativeId,sourceId:rows[0].sourceId,rows:rows.sort((a,b)=>(a.phase==='before'?0:1)-(b.phase==='before'?0:1)||a.phaseOrder-b.phaseOrder||a.sourceOrdinal-b.sourceOrdinal)})),requiredProof:['original cache14-slot load/order binding','native target/mastery/power/resistance/RNG and FireShield controls','exact legacy and JSON migration without intrinsic/banners/Goonks']};
 validateSourceXpLedger(result);return result;
}
export function validateSourceXpLedger(policy){
 keys(policy,['schemaVersion','contract','enabled','complete','archiveSha256','actors','requiredProof']);
 if(!policy||policy.schemaVersion!==1||policy.contract!==SOURCE_XP_LEDGER_CONTRACT||policy.enabled!==false||policy.complete!==false||policy.archiveSha256!==SOURCE_XP_ARCHIVE_SHA||!Array.isArray(policy.actors))fail('only inactive reviewed contract accepted');
 const seen=new Set();for(const actor of policy.actors){keys(actor,['nativeId','sourceId','rows']);if(!Array.isArray(actor.rows)||!actor.rows.length)fail('empty actor');for(const row of actor.rows){
 keys(row,['sourceId','nativeId','sourceLine','sourceOrdinal','code','modifier','spell','chances','phase','phaseOrder','mastery','power','casterKind','currentSide','primaryQuerySide','chance','aliveGate','sourceSlot']);
 const expected=REVIEWED_SOURCE_XP_ROWS.find(r=>key(r)===key(row));if(!expected||seen.has(key(row)))fail('unknown/duplicate row');seen.add(key(row));
 if(actor.nativeId!==expected.nativeId||actor.sourceId!==expected.sourceId||row.nativeId!==expected.nativeId||row.sourceLine!==expected.sourceLine||row.spell!==expected.spell||!same(row.chances,expected.chances)||row.sourceOrdinal!==expected.sourceOrdinal||row.sourceSlot!==null)fail('changed provenance');
 const semantics=sourceXpSemantics(row.code,Number(row.modifier.slice(1)));for(const[k,v]of Object.entries(semantics))if(row[k]!==v)fail('changed semantics');
 }}if(seen.size!==37||policy.actors.length!==36)fail('incomplete reviewed set');return true;
}
/** Source execution order after a separately proven cache binding. Does not cast. */
export function planSourceXpSlots(rows,phase){
 if(!['before','after'].includes(phase)||!Array.isArray(rows))fail('phase/rows');const seen=new Set();
 for(const r of rows){if(!Number.isInteger(r.sourceSlot)||r.sourceSlot<0||r.sourceSlot>=14||seen.has(r.sourceSlot))fail('unique original slot0..13 required');seen.add(r.sourceSlot);sourceXpSemantics(r.code,Number(r.modifier.slice(1)));}
 return rows.filter(r=>sourceXpSemantics(r.code,Number(r.modifier.slice(1))).phase===phase).sort((a,b)=>sourceXpSemantics(a.code,Number(a.modifier.slice(1))).phaseOrder-sourceXpSemantics(b.code,Number(b.modifier.slice(1))).phaseOrder||a.sourceSlot-b.sourceSlot);
}
/** Proposals only. Intrinsic abilities are deliberately not accepted by this API. */
export function proposeSourceXpMigration(policy,{legacyRows,jsonRows=[]}){
 validateSourceXpLedger(policy);if(!Array.isArray(legacyRows)||!Array.isArray(jsonRows))fail('migration inputs');
 const proposals=[];for(const actor of policy.actors)for(const row of actor.rows){
 if(row.sourceId===231||row.sourceId===254){proposals.push({row:key(row),action:'retainExistingSourceOwner'});continue;}
 const matches=legacyRows.filter(r=>r.creature===row.sourceId&&r.code===row.code&&r.modifier===row.modifier);
 if(matches.length>1||matches.some(r=>!same(r.values,row.chances)))fail('ambiguous/changed legacy row '+key(row));
 for(const m of matches)proposals.push({row:key(row),action:'proposeRemoveLegacyRow',legacyLine:m.line,expected:m,apply:false});
 const json=jsonRows.filter(r=>r.nativeId===row.nativeId&&r.bonus?.type===(row.phase==='before'?'SPELL_BEFORE_ATTACK':'SPELL_AFTER_ATTACK')&&r.bonus.subtype===row.spell&&same(r.values,row.chances.slice(1)));
 if(json.length>1)fail('ambiguous JSON source copy '+key(row));for(const m of json){if(!m.file||!Number.isInteger(m.stackExperienceIndex)||m.stackExperienceIndex<0)fail('explicit JSON path/index required');proposals.push({row:key(row),action:'reviewExactJsonCandidate',file:m.file,stackExperienceIndex:m.stackExperienceIndex,expected:m,sourceProvenanceStillRequired:true,apply:false});}
 }return{enabled:false,apply:false,proposals,excluded:['abilities','equipment','banners','Goonks','existing231and254sourceOwners']};
}
