/** Strict production preflight. It never edits the mod; Root applies the reviewed plan after native QA. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {compileSourceReplacementPolicy,productionReplacementObjectResolver} from './source-replacements.mjs';
import {verifyNativeProofIndex,embeddedNativeEngine} from './native-proof-index.mjs';
import {DWELLING_CLOSURE} from './stage-dwelling-closure.mjs';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const BANKS=[48,51,64,65,66,67];
const BANK_XP_ACTORS=[253,272,281,289,290,301,302,330,340,358];
const DWELLING_XP_ACTORS=[274,276,277,282,284,285,288,292,305,306,312,313,314,316,360,362];
function sameSet(actual,expected,label){assert.deepEqual([...actual].sort((a,b)=>a-b),[...expected].sort((a,b)=>a-b),label);assert.equal(new Set(actual).size,actual.length,label+' duplicates');}
function validHash(value,label){assert.match(value??'',/^[a-f0-9]{64}$/,label);}
function assertNoPrivate(value,label){const text=JSON.stringify(value);assert(!text.includes('private-validation')&&!text.includes('private-')&&!text.includes('.candidate'),label+' contains private admission or candidate references');}
export function verifyAdventureAdmissionBinding({entry,validation,proofRoot,label='XP admission'}){for(const [field,key]of [['contracts','contractsSha256'],['migration','migrationSha256']]){validHash(validation[key],label+' '+field+' hash');assert(typeof entry[field]==='string'&&entry[field].length>0,label+' '+field+' file required');const bound=path.resolve(proofRoot,entry[field]);assert.equal(hash(fs.readFileSync(bound)),validation[key],label+' '+field+' bytes changed');}}
export function preflightAdventurePort({project=process.cwd(),union,sourceRoot=path.resolve('../Third-Upgrade-Mod-Full'),proofsFile}={}){
 assert(union&&proofsFile,'--union and --proofs are required');
 const proofRoot=path.dirname(path.resolve(proofsFile)),proofs=read(proofsFile),review=read(path.join(union,'union-review.json')),patches=read(path.join(union,'registry-patches.json'));
 assert.equal(proofs.schemaVersion,1);validHash(proofs.engineSha256,'Validated engine SHA');assert.equal(review.plans,102);assert.equal(review.source.missing.length,0);
 const evidence=[];
 function proof(entry,label){
  assert(entry&&typeof entry.file==='string',label+' proof file required');const file=path.resolve(proofRoot,entry.file),bytes=fs.readFileSync(file),data=JSON.parse(bytes);
  validHash(entry.sha256,label+' proof SHA');assert.equal(hash(bytes),entry.sha256,label+' proof bytes changed');
  if(entry.multiRunIndex===true){assert(label!=='Final engine integration','Final integration must remain a distinct run on the final engine');const checked=verifyNativeProofIndex({entry,file,data,project,finalEngineSha256:proofs.engineSha256});evidence.push({label,file,sha256:entry.sha256,...checked.evidence});return checked.summary;}
  assert.equal(data.passed,true,label+' native test did not pass');assert.equal(entry.nativeValidated,true,label+' native attestation required');
  const engine=embeddedNativeEngine(data);
  const expectedEngine=entry.engineSha256??proofs.engineSha256;validHash(expectedEngine,label+' tested engine SHA');assert.equal(engine,expectedEngine,label+' tested engine differs from its attestation');
  validHash(entry.sha256,label+' proof SHA');assert.equal(hash(bytes),entry.sha256,label+' proof bytes changed');
  if(expectedEngine!==proofs.engineSha256){assert(typeof entry.scope==='string'&&entry.scope.length>0,label+' historical proof requires explicit scope');assert(entry.sourceHashes&&Object.keys(entry.sourceHashes).length>0,label+' historical proof requires unchanged implementation hashes');}
  for(const[relative,sha]of Object.entries(entry.sourceHashes??{})){validHash(sha,label+' implementation hash');const source=path.resolve(project,relative);assert(source.startsWith(path.resolve(project)+path.sep),label+' implementation path outside project');assert.equal(hash(fs.readFileSync(source)),sha,label+' implementation changed: '+relative);}
  evidence.push({label,file,sha256:entry.sha256,engineSha256:expectedEngine,scope:entry.scope??'current-engine',sourceHashes:entry.sourceHashes??{}});return data;
 }
 const integration=proof(proofs.integration,'Final engine integration');assert.equal(proofs.integration.engineSha256??proofs.engineSha256,proofs.engineSha256,'Integration must test the final engine');
 for(const key of ['integrationSmokeValidated','mapSaveReloadValidated','playerRolesPreserved','actualResumedTurnTransitionsValidated'])assert.equal(integration[key],true,'Final integration '+key);
 const mixed=proof(proofs.mixed54,'Mixed54 native R0 scope');sameSet(mixed.r0MixSourceIds??[],DWELLING_CLOSURE,'Distinct mixed54 native scope');
 const sorceress=proof(proofs.critical316,'Critical316 native scope');assert.equal(sorceress.critical316Validated,true,'Distinct critical316 native scopes incomplete');
 assert(Array.isArray(proofs.actors),'54 whole actor attestations required');sameSet(proofs.actors.map(a=>a.sourceId),DWELLING_CLOSURE,'Whole54 actor closure');
 for(const actor of proofs.actors){const data=proof(actor,'Actor '+actor.sourceId);assert((data.validatedSourceIds??data.wholeActors??[]).includes(actor.sourceId),'Whole actor missing from native result '+actor.sourceId);}
 const bank=proof(proofs.banks,'Six banks');sameSet(bank.validatedBankIds??[],BANKS,'All six bank constructors/rewards/revisit');assert.equal(bank.saveReloadValidated,true);assert.equal(bank.revisitValidated,true);
 const cave=proof(proofs.cave,'Mysterious Cave');assert.equal(cave.completeSourceChoicesValidated,true);assert.equal(cave.saveReloadValidated,true);
 const replacement=proof(proofs.replacements,'All102 replacements');
 assert.equal(replacement.sourceProgramSha256,review.source.sourceProgramSha256);assert.equal(replacement.sourceProgramCount,102);
 for(const key of ['nativeDayOneOnly','nativeReloadIdempotent','shared143NativeValidated','nativeDeterministicSeed','nativeOffInert'])assert.equal(replacement[key],true,'Replacement proof '+key);
 const admissionEvidence={passed:true,nativeValidated:true,sourceProgramSha256:replacement.sourceProgramSha256,engineSha256:replacement.replacementProofEngineSha256??proofs.replacements.engineSha256??embeddedNativeEngine(replacement),dayOneOnly:true,saveReloadIdempotent:true,shared143NativeValidated:true};
 const compiled=compileSourceReplacementPolicy({sourceRoot,resolveObject:productionReplacementObjectResolver(project,{additional:review.extra}),admissionEvidence});assert.equal(compiled.policy.plans.length,102);
 function xpAdmission(entry,fixture,mode,actors,label){
  const native=proof(entry,label);assert(typeof entry.admission==='string',label+' production gate file required');const gate=read(path.resolve(proofRoot,entry.admission)),source=read(path.join(project,fixture));
  for(const field of ['schemaVersion','contract','archiveSha256','cohortSha256','rows'])assert.deepEqual(gate[field],source[field],label+' source '+field+' changed');
  for(const row of source.rows){const actual=(native.validatedXpRows??[]).find(r=>r.sourceId===row.sourceId&&r.sourceLine===row.sourceLine&&r.cacheSlot===row.cacheSlot&&r.code===row.code&&r.spell===row.spell);assert.deepEqual(actual,row,label+' native row not observed '+row.sourceId+row.code+'#'+row.spell);}
  assert.equal(gate.enabled,true);assert.equal(gate.nativeValidated,true);assert.equal(gate.mode,mode);assertNoPrivate(gate,label);
  const validation=gate.validation;assert(validation);validHash(validation.contractsSha256,label+' contracts proof');validHash(validation.migrationSha256,label+' migration proof');verifyAdventureAdmissionBinding({entry,validation,proofRoot,label});
  sameSet(validation.wholeActors.map(a=>a.sourceId),actors,label+' whole actors');for(const a of validation.wholeActors){assert.equal(a.nativeValidated,true);validHash(a.proofSha256,label+' actor proof');assert(proofs.actors.some(p=>p.sourceId===a.sourceId&&p.sha256===a.proofSha256),label+' actor proof not bound to whole actor');}
  return gate;
 }
 const bankXp=xpAdmission(proofs.bankXp,'tests/fixtures/tum/bank-xp6.json','validated-all6',BANK_XP_ACTORS,'Bank XP6');
 const dwellingXp=xpAdmission(proofs.dwellingXp,'tests/fixtures/tum/dwelling-xp17.json','validated-all17',DWELLING_XP_ACTORS,'Dwelling XP17');
 const modRoot=path.join(project,'mod/tum-era'),manifest=read(path.join(modRoot,'mod.json')),identities=read(path.join(modRoot,'era-identities.json'));
 const append=(field,values)=>{manifest[field]??=[];for(const v of values)if(!manifest[field].includes(v))manifest[field].push(v);};
 append('creatures',['config/source-bank-actors.json','config/source-dwelling-actors.json',...(review.additionalCreatureConfigs??[]).map(p=>p.replaceAll('.candidate',''))]);append('spells',['config/source-bank-spells.json','config/source-dwelling-spells.json']);append('objects',review.objects);
 manifest.french??={};manifest.french.translations??=[];if(!manifest.french.translations.includes('config/source-bank-french.json'))manifest.french.translations.push('config/source-bank-french.json');
 manifest.settings??={};manifest.settings.combat??={};manifest.settings.combat.layouts??={};Object.assign(manifest.settings.combat.layouts,patches.bank.combatLayouts,patches.stock?.settings?.combat?.layouts);
 const jsonWrites=new Map(),get=file=>jsonWrites.get(file)??read(path.join(modRoot,file));
 const merge=(file,field,entries)=>{const document=get(file);document[field]??={};Object.assign(document[field],entries??{});jsonWrites.set(file,document);};
 for(const patch of [patches.bank,patches.dwelling]){
  Object.assign(identities.creatures,patch.identities);merge('content/config/era-bridge-experience.json','creatures',patch.experience);merge('content/config/era-bridge-skeleton-transformations.json','creatures',patch.skeleton);merge('content/config/era-bridge-fear.json','creatures',patch.fear);merge('content/config/era-bridge-status-attacks.json','sourceIds',patch.statusSourceIds);
  const file='content/config/era-bridge-runtime.json',document=get(file);for(const[key,value]of Object.entries(patch.runtime.creatures))document.creatures[key]={...(document.creatures[key]??{}),...value};jsonWrites.set(file,document);
 }
 const gate=read(path.join(union,'content/config/era-dwelling-services-v1.candidate.json'));gate.enabled=true;
 for(const[file,value]of [['mod.json',manifest],['era-identities.json',identities],['content/config/era-object-replacements-v1.json',compiled.policy],['content/config/era-dwelling-services-v1.json',gate],['content/config/era-bridge-bank-xp-admission-v1.json',bankXp],['content/config/era-bridge-dwelling-xp-admission-v1.json',dwellingXp]])jsonWrites.set(file,value);
 const copies=[];for(const relative of fs.readdirSync(path.join(union,'content'),{recursive:true})){
  const from=path.join(union,'content',relative);if(!fs.statSync(from).isFile())continue;const to='content/'+relative.replaceAll('.candidate','');assert(!to.includes('private'),'Private asset cannot publish');
  if(to==='content/config/era-object-replacements-v1.json'||to==='content/config/era-dwelling-services-v1.json')continue;
  if(to.endsWith('.json')){const value=read(from);assertNoPrivate(value,to);}copies.push({from,to,sha256:hash(fs.readFileSync(from))});
 }
 for(const[file,value]of jsonWrites)assertNoPrivate(value,file);
 return {schemaVersion:1,preflightPassed:true,applied:false,engineSha256:proofs.engineSha256,proofs:evidence,copies,jsonWrites:Object.fromEntries(jsonWrites),summary:{actors:54,sourcePrograms:102,banks:6,files:copies.length,productionGates:['validated-all6','validated-all17']}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1]};
 assert(!args.includes('--apply'),'This tool performs preflight only; review the output before production application');
 const plan=preflightAdventurePort({union:option('--union'),proofsFile:option('--proofs'),sourceRoot:option('--source')});
 const output=option('--output');assert(output,'--output review plan is required');assert(!path.resolve(output).startsWith(path.resolve('mod')+path.sep),'Review output must stay outside production mod');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(plan,null,2)+'\n');console.log(JSON.stringify(plan.summary));
}
