/** Plans only source scalar-stat changes. Never activates a mod or edits a checkout. */
export const scalarFields=new Set(['hitPoints','attack','defense','speed','growth','aiValue','fightValue','shots']);
export const compoundFields={damage:new Set(['min','max']),cost:new Set(['wood','mercury','ore','sulfur','crystal','gems','gold'])};
function put(patch,field,value){if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid source scalar:'+field);const parts=field.split('.');if(parts.length===1&&scalarFields.has(field))patch[field]=value;else if(parts.length===2&&compoundFields[parts[0]]?.has(parts[1]))(patch[parts[0]]??={})[parts[1]]=value;else throw Error('Field outside stat-only whitelist:'+field);}
export function planSourceStatPatches(report){
 if(report.schemaVersion!==1||!Array.isArray(report.creatures))throw Error('Expected bounded creature inventory');const seenNative=new Set(),seenEra=new Set(),patches={},held={},entries=[];
 for(const c of report.creatures){if(!Number.isInteger(c.eraId)||typeof c.nativeId!=='string'||!c.nativeId.includes(':')||seenNative.has(c.nativeId)||seenEra.has(c.eraId))throw Error('Duplicate or invalid resolved identity');seenEra.add(c.eraId);seenNative.add(c.nativeId);if(!c.differences.length)continue;
  const patch={},guards=[];for(const d of c.differences){if(d.source===d.native)throw Error('False difference:'+c.nativeId);put(patch,d.field,d.source);if(d.field==='hitPoints'&&d.source<=0)guards.push('nonpositive source health');}
  if(c.nonComparable?.some(x=>x.field==='rank0 runtime stats'))guards.push('Intrinsic stat bonuses require BonusSystem evaluation before correcting base values');
  if(c.nonComparable?.some(x=>x.field!=='rank0 runtime stats'))guards.push('Unresolved baseline field(s)');
  if(c.levelComparison?.classification==='semantic level difference')guards.push('Source Level+1 differs from native tier; tier/XP/RMG interactions need separate review');
  if(guards.length)held[c.nativeId]=patch;else patches[c.nativeId]=patch;
  entries.push({eraId:c.eraId,nativeId:c.nativeId,sourceName:c.sourceName,fields:c.differences.map(d=>d.field),before:Object.fromEntries(c.differences.map(d=>[d.field,d.native])),after:Object.fromEntries(c.differences.map(d=>[d.field,d.source])),level:c.levelComparison,status:guards.length?'held-for-semantic-review':'primitive-stat-candidate-not-activated',guards});
 }
 return{schemaVersion:1,activationReady:false,patches,held,entries,summary:{changedIdentities:entries.length,primitiveCandidates:Object.keys(patches).length,heldIdentities:Object.keys(held).length},requirements:['Base-stat corrections only; source values are candidates, not an intentional-rebalance claim','Never emits level, abilities, flags, faction, upgrades, XP, or runtime policies','Existing object/recruitment/XP costs and map balance must be retested after deliberate activation','Apply candidate after all dependencies; preserve existing native abilities and runtime registries','Held identities are emitted separately and excluded from the disabled candidate manifest']};
}
