/** Strict bridge for declarative TUM bank rewards, not ERM map replacement. */
const resourceNames=['wood','mercury','ore','sulfur','crystal','gems','gold'];
const artifactClasses=['TREASURE','MINOR','MAJOR','RELIC'];
const escapePointer=s=>String(s).replace(/~/g,'~0').replace(/\//g,'~1');
const join=(base,key)=>base+'/'+escapePointer(key);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const evidence='VCMI config/schemas/rewardable.json; lib/rewardable/Info.cpp configureRewards; lib/json/JsonRandom.cpp loadArtifacts/filterKeysTyped';
export class BankCompilationError extends Error {
 constructor(diagnostics){super(diagnostics.map(d=>`${d.source}${d.line?':'+d.line:''}${d.pointer}: ${d.code}: ${d.message}`).join('\n'));this.name='BankCompilationError';this.diagnostics=structuredClone(diagnostics);}
}
/** JSON value locations are retained; duplicate JSON properties are fatal. */
export function parseTumBanks(text,{source='<TUM_CreatureBanks.json>'}={}){
 if(typeof text!=='string')throw new TypeError('Expected JSON text');
 let document;try{document=JSON.parse(text);}catch(cause){throw new BankCompilationError([{source,pointer:'',line:null,column:null,code:'INVALID_JSON',message:cause.message}]);}
 const locations={},diagnostics=[];let position=0;
 const whitespace=()=>{while(/\s/.test(text[position]||'')&&position<text.length)position++;};
 const location=(pointer,start)=>{const prefix=text.slice(0,start),line=(prefix.match(/\n/g)||[]).length+1,last=prefix.lastIndexOf('\n');locations[pointer]={source,pointer,line,column:start-last};};
 const stringToken=()=>{const start=position++;while(position<text.length){const c=text[position++];if(c==='\\'){position++;continue;}if(c==='"')break;}return JSON.parse(text.slice(start,position));};
 const walk=pointer=>{whitespace();location(pointer,position);const c=text[position];
  if(c==='{'){position++;whitespace();const keys=new Set();while(text[position]!=='}'){whitespace();const start=position,key=stringToken(),next=join(pointer,key);if(keys.has(key)){const prefix=text.slice(0,start);diagnostics.push({source,pointer:next,line:(prefix.match(/\n/g)||[]).length+1,column:start-prefix.lastIndexOf('\n'),code:'DUPLICATE_PROPERTY',message:`Duplicate JSON key ${key}`});}keys.add(key);whitespace();position++;walk(next);whitespace();if(text[position]!==',')break;position++;}position++;}
  else if(c==='['){position++;whitespace();let index=0;while(text[position]!==']'){walk(join(pointer,index++));whitespace();if(text[position]!==',')break;position++;}position++;}
  else if(c==='"')stringToken();else while(position<text.length&&!/[\s,}\]]/.test(text[position]))position++;
 };
 walk('');if(diagnostics.length)throw new BankCompilationError(diagnostics);
 return {document,source,locations};
}
function atPointer(value,pointer){if(!pointer)return value;if(!pointer.startsWith('/'))throw new TypeError('Expected JSON Pointer beginning with /');for(const key of pointer.slice(1).split('/').map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~'))){if(!value||typeof value!=='object'||!own(value,key))return undefined;value=value[key];}return value;}
/**
 * Input may be a bank object, raw JSON, or parseTumBanks result. `pointer` selects
 * a bank in a complete source document. Caller supplies objectId, nativeTemplates
 * and guardsLayout; source properties lines are never guessed into tile masks.
 * `upgrade` is unsupported by default, including zero, unless caller explicitly
 * proves its zero-disabled meaning with disabledUpgradeEvidence.
 */
export function compileTumBank(input,{
 source='<TUM_CreatureBanks.json>',pointer='',objectId,nativeTemplates,guardsLayout,
 resolveCreature,resolveArtifact,resolveResource,nativeRmg,
 chanceMode='percent',disabledUpgradeEvidence,
}={}){
 const parsed=typeof input==='string'?parseTumBanks(input,{source}):input&&own(input,'document')&&own(input,'locations')?structuredClone(input):{document:structuredClone(input),source,locations:{}};
 const root=atPointer(parsed.document,pointer),diagnostics=[],provenance=[];
 const site=p=>parsed.locations[p]||{source:parsed.source||source,pointer:p,line:null,column:null};
 const error=(p,code,message)=>diagnostics.push({...site(p),code,message});
 const note=(p,operation,reference=evidence)=>provenance.push({...site(p),operation,evidence:reference});
 const fail=()=>{if(diagnostics.length)throw new BankCompilationError(diagnostics);};
 const integer=(value,p,{min=0,max=2147483647}={})=>{if(!Number.isSafeInteger(value)||value<min||value>max){error(p,'INVALID_INTEGER',`Expected integer in [${min}, ${max}]`);return undefined;}return value;};
 const object=(v,p)=>{if(!v||typeof v!=='object'||Array.isArray(v)){error(p,'INVALID_OBJECT','Expected an object');return false;}return true;};
 const keys=(v,allowed,p)=>{if(!object(v,p))return false;for(const k of Object.keys(v))if(!allowed.includes(k))error(join(p,k),'UNSUPPORTED_PROPERTY',`Unsupported bank property ${k}`);return true;};
 const array=(v,p,length)=>{if(!Array.isArray(v)||(length!==undefined&&v.length!==length)){error(p,'INVALID_ARRAY',length===undefined?'Expected array':`Expected ${length} entries`);return false;}return true;};
 const resolve=(value,fn,p,kind)=>{
  if(typeof fn!=='function'){error(p,'MISSING_RESOLVER',`Explicit ${kind} resolver required`);return;}
  try{const result=fn(value);if(typeof result!=='string'||!result.trim()){error(p,'UNRESOLVED_IDENTIFIER',`Unresolved ERA ${kind} ID ${value}`);return;}return result;}catch(cause){error(p,'RESOLVER_FAILED',cause.message);}
 };
 if(typeof objectId!=='string'||!/^[A-Za-z][A-Za-z0-9_-]*$/.test(objectId))error(pointer,'INVALID_OBJECT_ID','Explicit stable native objectId is required');
 if(!nativeTemplates||typeof nativeTemplates!=='object'||Array.isArray(nativeTemplates)||!Object.keys(nativeTemplates).length)error(pointer,'MISSING_NATIVE_TEMPLATES','Explicit verified native templates are required; source property lines are opaque');
 else for(const [id,t]of Object.entries(nativeTemplates)){
  const p=join(pointer,'nativeTemplates/'+id);if(!object(t,p))continue;
  if(typeof t.animation!=='string'||!t.animation.trim())error(p,'INVALID_TEMPLATE','Template requires animation');
  if(!Array.isArray(t.mask)||!t.mask.length||t.mask.some(r=>typeof r!=='string'||!r.length||!/^[VAB]+$/.test(r))||new Set(t.mask.map(r=>r.length)).size!==1)error(p,'INVALID_TEMPLATE','Template requires a rectangular V/A/B mask');
 }
 if(typeof guardsLayout!=='string'||!guardsLayout.trim())error(pointer,'MISSING_GUARDS_LAYOUT','Explicit verified native guardsLayout is required');
 if(chanceMode!=='percent'&&chanceMode!=='relative')error(pointer,'INVALID_CHANCE_MODE','chanceMode must be percent or relative');
 if(!keys(root,['name','states','properties','sound','text','density','value','enabled'],pointer)){fail();}
 if(typeof root.name!=='string'||!root.name.trim())error(join(pointer,'name'),'MISSING_NAME','Bank needs a nonempty name');
 else note(join(pointer,'name'),'native bank name');
 if(!Array.isArray(root.states)||!root.states.length)error(join(pointer,'states'),'MISSING_STATES','Bank needs one or more reward states');
 const states=Array.isArray(root.states)?root.states:[];
 if(own(root,'properties')){if(array(root.properties,join(pointer,'properties'))&&root.properties.some(v=>typeof v!=='string'))error(join(pointer,'properties'),'INVALID_TEMPLATE_METADATA','Source properties must be strings');note(join(pointer,'properties'),'opaque ERA object-template lines retained in report; native templates supplied explicitly');}
 for(const k of ['density','value'])if(own(root,k)){integer(root[k],join(pointer,k));note(join(pointer,k),'ERA RMG metadata retained; no automatic distribution equivalence claimed');}
 if(own(root,'enabled')){if(typeof root.enabled!=='boolean')error(join(pointer,'enabled'),'INVALID_BOOLEAN','enabled must be boolean');if(root.enabled===false)error(join(pointer,'enabled'),'DISABLED_SOURCE_BANK','Cannot emit a playable bank from a disabled ERA definition');note(join(pointer,'enabled'),'source bank enabled gate');}
 const definition={name:root.name,templates:structuredClone(nativeTemplates||{}),visitMode:'once',selectMode:'selectFirst',guardsLayout,rewards:[]};
 if(own(root,'sound')&&keys(root.sound,['enter','loop'],join(pointer,'sound'))){definition.sounds={};for(const [key,native]of [['enter','visit'],['loop','ambient']])if(own(root.sound,key)){const p=join(join(pointer,'sound'),key);if(typeof root.sound[key]!=='string'||!root.sound[key])error(p,'INVALID_SOUND','Expected sound resource name');else{definition.sounds[native]=[root.sound[key]];note(p,'native '+native+' sound');}}}
 if(own(root,'text')&&keys(root.text,['visit'],join(pointer,'text'))){if(typeof root.text.visit!=='string')error(join(join(pointer,'text'),'visit'),'INVALID_TEXT','Expected visit message');else{definition.onGuardedMessage=root.text.visit;note(join(join(pointer,'text'),'visit'),'native guarded-visit message');}}
 if(nativeRmg!==undefined){if(keys(nativeRmg,['value','rarity','mapLimit','zoneLimit'],join(pointer,'nativeRmg'))){for(const[k,v]of Object.entries(nativeRmg))integer(v,join(pointer,'nativeRmg/'+k));definition.rmg=structuredClone(nativeRmg);note(pointer,'caller-supplied native RMG policy; ERA density/value are report-only');}}
 const weights=[];
 for(let i=0;i<states.length;i++){
  const state=states[i],p=join(join(pointer,'states'),i);
  if(!keys(state,['chance','guardians','resources','creatureRewardType','creatureRewardCount','artifactTypeCounts','artifactIds','upgrade'],p)){weights.push(0);continue;}
  const w=integer(state.chance,join(p,'chance'),{min:0,max:1000000});weights.push(w??0);
 }
 const total=weights.reduce((a,b)=>a+b,0);
 if(total<=0||!Number.isSafeInteger(total))error(join(pointer,'states'),'INVALID_WEIGHTS','Reward state weights must have a positive safe total');
 if(chanceMode==='percent'&&total!==100)error(join(pointer,'states'),'INVALID_WEIGHTS','Percentage chance weights must sum to 100; no implicit normalization');
 let cursor=0;
 for(let i=0;i<states.length;i++){
  const s=states[i],p=join(join(pointer,'states'),i);if(!s||typeof s!=='object'||Array.isArray(s))continue;
  const width=chanceMode==='relative'&&total>0?weights[i]*100/total:weights[i];
  if(!Number.isInteger(width))error(join(p,'chance'),'NONREPRESENTABLE_WEIGHTS','Exact state ratio is not representable on native 100-outcome dice; rounding is forbidden');
  const reward={appearChance:{min:cursor,max:cursor+width},guards:[]};cursor+=width;note(join(p,'chance'),'shared native 0..99 dice, disjoint [min,max) state interval');
  if(own(s,'upgrade')){if(s.upgrade===0&&typeof disabledUpgradeEvidence==='string'&&disabledUpgradeEvidence.trim())note(join(p,'upgrade'),'caller-proven zero disables ERA upgrade semantics',disabledUpgradeEvidence);else error(join(p,'upgrade'),'UNSUPPORTED_SEMANTICS','ERA upgrade behavior requires an explicit adapter; even zero requires disabledUpgradeEvidence');}
  const gp=join(p,'guardians');
  if(keys(s.guardians,['type','count'],gp)&&array(s.guardians.type,join(gp,'type'))&&array(s.guardians.count,join(gp,'count'))){
   if(s.guardians.type.length!==s.guardians.count.length||s.guardians.type.length>7||!s.guardians.type.length)error(gp,'INVALID_GUARD_SLOTS','Guard type/count arrays must have matching lengths from 1 to 7');
   for(let slot=0;slot<s.guardians.count.length;slot++){
    const cp=join(join(gp,'count'),slot),tp=join(join(gp,'type'),slot),count=integer(s.guardians.count[slot],cp),id=integer(s.guardians.type[slot],tp,{min:-1});
    if(count===0){note(cp,'zero-count guardian slot ignored');note(tp,'zero-count guardian slot identity unused');continue;}
    if(count===undefined||id===undefined)continue;if(id<0){error(tp,'UNRESOLVED_IDENTIFIER','Positive guardian count has no creature ID');continue;}
    const type=resolve(id,resolveCreature,tp,'creature');if(type){reward.guards.push({type,amount:count});note(tp,'resolved native guardian creature');note(cp,'native guardian amount');}
   }
  }
  if(!reward.guards.length)error(gp,'MISSING_GUARDIANS','A bank requires at least one resolved guardian stack');
  const rp=join(p,'resources');
  if(array(s.resources,rp)){
   if(s.resources.length<7)error(rp,'INVALID_RESOURCE_SLOTS','Expected at least seven standard resource slots');
   reward.resources={};for(let ri=0;ri<s.resources.length;ri++){
    const amount=integer(s.resources[ri],join(rp,ri));if(amount===undefined)continue;
    if(!amount){note(join(rp,ri),'zero resource reward');continue;}
    let resource=resourceNames[ri];if(!resource)resource=resolve(ri,resolveResource,join(rp,ri),'resource');
    if(resource){if(own(reward.resources,resource))error(join(rp,ri),'DUPLICATE_RESOURCE','Resource resolver mapped two slots to the same native resource');else{reward.resources[resource]=amount;note(join(rp,ri),'native resource '+resource);}}
   }
   if(!Object.keys(reward.resources).length)delete reward.resources;
  }
  const count=integer(s.creatureRewardCount,join(p,'creatureRewardCount')),id=integer(s.creatureRewardType,join(p,'creatureRewardType'),{min:-1});
  if(count===0){note(join(p,'creatureRewardCount'),'no creature reward');note(join(p,'creatureRewardType'),'zero-count creature reward identity unused');}
  else if(count!==undefined&&id!==undefined){if(id<0)error(join(p,'creatureRewardType'),'UNRESOLVED_IDENTIFIER','Positive creature reward has no creature ID');else{const type=resolve(id,resolveCreature,join(p,'creatureRewardType'),'creature');if(type){reward.creatures=[{type,amount:count}];note(join(p,'creatureRewardType'),'resolved native reward creature');note(join(p,'creatureRewardCount'),'native creature reward amount');}}}
  const artifacts=[];
  if(own(s,'artifactTypeCounts')&&array(s.artifactTypeCounts,join(p,'artifactTypeCounts'),4))for(let ai=0;ai<4;ai++){
   const ap=join(join(p,'artifactTypeCounts'),ai),amount=integer(s.artifactTypeCounts[ai],ap,{max:1000});if(amount!==undefined){for(let j=0;j<amount;j++)artifacts.push({class:artifactClasses[ai]});note(ap,'native random artifact class '+artifactClasses[ai]);}
  }
  if(own(s,'artifactIds')&&array(s.artifactIds,join(p,'artifactIds')))for(let ai=0;ai<s.artifactIds.length;ai++){
   const ap=join(join(p,'artifactIds'),ai),id=integer(s.artifactIds[ai],ap);if(id===undefined)continue;const artifact=resolve(id,resolveArtifact,ap,'artifact');if(artifact){artifacts.push(artifact);note(ap,'resolved native artifact reward');}
  }
  if(artifacts.length)reward.artifacts=artifacts;
  if(weights[i]>0)definition.rewards.push(reward);
 }
 fail();return {definition:{'core:creatureBank':{types:{[objectId]:definition}}},provenance,report:{source:parsed.source||source,pointer,sourceTemplateLines:structuredClone(root.properties||[]),sourceRmgMetadata:Object.fromEntries(['density','value','enabled'].filter(k=>own(root,k)).map(k=>[k,root[k]])),nativeRmgProvided:nativeRmg!==undefined,unsupportedScope:['ERM day-one map-object replacement probabilities and offsets','Plugin behavior outside the selected declarative reward state'],chanceMode,sourceWeightTotal:total}};
}
