/** Install only the whole verified263/266 contract. Default dry-run; no partial activation. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [review, report='outputs/wog-priorities-0.4.147', mode='--dry-run']=process.argv.slice(2);
assert(review,'REVIEW [REPORT_DIR] [--dry-run|--apply]');assert(['--dry-run','--apply'].includes(mode));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected='98ea5b1c193cd61a89542db9a3916d4192694e269b120f87557c167c196a3771';
const proofs=['native163-summon-terrain.json','native163-fangarm263-astral.json','native163-horn266-persistence.json','native163-horn266-current-health.json','native163-fangarm263-experience.json','native163-fangarm263-counter-current.json','native163-horn266-events.json','native163-horn266-loss.json','native163-horn266-save.json','native163-horn266-casualty-xp.json','native163-horn266-commanders.json'];
const counts=[2,3,8,4,4,1,8,2,1,2,1];
for(const [index,file] of proofs.entries()){const d=read(path.join(report,file));assert(d.passed===true,`Incomplete ${file}`);assert.equal(Object.keys(d.report??{}).length,counts[index],`Missing controls ${file}`);assert((d.engineSHA256??d.engineSha256)===expected,`Changed engine ${file}`);}
const original=read(path.join(report,'native160-horn266-fangarm263-first15.json'));assert(original.passed===true,'Original15 source reception controls required');assert.equal(Object.keys(original.report??{}).length,15);
const sourceRoot=path.resolve('../Third-Upgrade-Mod-Full'), fresh=fs.mkdtempSync('work/downloads/horn266-install-preflight-');
let preflight;
try {
 // Rebuild from pinned original TUM inputs, not from unchecked candidate hashes.
 fs.rmdirSync(fresh);
 execFileSync(process.execPath,['scripts/era-bridge/horn266/stage-source.mjs','.',sourceRoot,fresh],{stdio:'pipe'});
 const list=root=>fs.readdirSync(root,{recursive:true}).filter(n=>fs.statSync(path.join(root,n)).isFile()).sort();
 const files=list(fresh);assert.deepEqual(list(review),files,'Unexpected or missing candidate files');
 preflight={sourceRoot,files:files.map(file=>{const original=fs.readFileSync(path.join(fresh,file)),candidate=fs.readFileSync(path.join(review,file));assert.deepEqual(candidate,original,`Candidate differs from fresh pinned source: ${file}`);return{path:file,sha256:sha(original)};})};
} finally {fs.rmSync(fresh,{recursive:true,force:true});}
const meta=read(path.join(review,'stage.json')), contract=read(path.join(review,'native-contract.candidate.json'));
const identities=read('mod/tum-era/era-identities.json');assert([undefined,'tum-era:eraCreature263'].includes(identities.creatures['263']),'Conflicting263 identity');identities.creatures['263']='tum-era:eraCreature263';

assert.deepEqual(contract,{schemaVersion:1,artifact:'tum-era:artifact266',creature:'tum-era:eraCreature263',contract:'source-fangarm263-hypnotize-v1'});
for(const a of meta.assets)assert.equal(sha(fs.readFileSync(path.join(review,a.path))),a.sha256,`Source asset changed: ${a.path}`);
const root='mod/tum-era',manifest=read(root+'/mod.json');
const definitions={creatures:['source-fangarm263','reviewed-fangarm263'],artifacts:['source-horn266','reviewed-horn266'],spells:['source-horn266-spells','reviewed-horn266-spells']};
for(const [kind,[source,target]]of Object.entries(definitions)){
 const value=read(path.join(review,'content/config',source+'.candidate.json'));
 assert.deepEqual(Object.keys(value),[kind==='creatures'?'eraCreature263':kind==='artifacts'?'artifact266':'sourceHornFangarmSummon']);
 if(mode==='--apply')write(root+'/content/config/'+target+'.json',value);
 manifest[kind]=[...new Set([...(manifest[kind]||[]),'config/'+target+'.json'])];
}
for(const name of ['era-bridge-experience','era-bridge-experience-attack-spells','era-bridge-status-attacks']){
 const value=read(root+'/content/config/'+name+'.json'),patch=read(path.join(review,'patches',name+'.json'));
 if(name==='era-bridge-status-attacks'){Object.assign(value.sourceIds,patch.sourceIds);value.creatures=[...new Set([...value.creatures,...patch.creatures])];}
 else Object.assign(value.creatures,patch.creatures);
 if(mode==='--apply')write(root+'/content/config/'+name+'.json',value);
}
if(mode==='--apply'){
 for(const name of fs.readdirSync(root+'/content/config').filter(n=>/^era-bridge-.*\.json$/.test(n))){const file=root+'/content/config/'+name,value=read(file);if(value.sourceIds){value.sourceIds['tum-era:eraCreature263']=263;write(file,value);}}
 for(const a of meta.assets){const target=path.join(root,a.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(review,a.path),target);}
 for(const sidecar of meta.sidecars||[]){const target=path.join(root,sidecar);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(review,sidecar),target);}
 write(root+'/content/config/era-horn266-contract.json',contract);
}
manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/source-horn266-french.json'])];
if(mode==='--apply'){write(root+'/mod.json',manifest);write(root+'/era-identities.json',identities);}
write(path.join(report,'horn266-install-preflight.json'),{passed:true,productionChanged:mode==='--apply',...preflight,identity263:identities.creatures['263'],engineSHA256:expected});
console.log(mode==='--apply'?'Installed verified whole263/266 contract.':'Whole263/266 proof gate passed; production unchanged.');
