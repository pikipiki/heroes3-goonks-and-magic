/** Whole original43 installer. Dry-run by default; effective flight is mandatory. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {parseCreatureExperience} from './crexpbon.mjs';
const apply=process.argv.includes('--apply'),tested=path.resolve(process.argv.find((s,i)=>i>1&&!s.startsWith('--'))||'work/downloads/wog-port157/familiar43-stage-after-g15'),root='mod/tum-era',out='outputs/wog-priorities-0.4.147/',read=p=>JSON.parse(fs.readFileSync(p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const proof=read(out+'native-familiar43-progress.json'),flyingPath=out+'native159-familiar43-flying.json',flight=fs.existsSync(flyingPath)?read(flyingPath):null;
for(const [rank,speed]of [[0,7],[5,8],[8,8],[10,9]]){const c=proof.ranks[rank];assert.equal(c.passed,true);assert.equal(c.actualRank,rank);assert.equal(c.effectiveSpeed,speed);assert.equal(c.canonicalHealth,4);assert.equal(c.canonicalAttack,4);assert.equal(c.canonicalDefense,4);if(rank)assert.equal(c.fortuneLuck,2);}
assert.equal(proof.hate.passed,true);assert.deepEqual(Object.fromEntries(proof.hate.observations.map(v=>[v.key,v.damage])),{'core:gnoll':10,'core:gremlin':15,'core:masterGremlin':15,'third-upgrades:tumGrandmasterGremlin':210});
for(const [name,delta]of [['twoStacks',1],['hypnotize',0],['killed',0]]){const c=proof.timing['channel-'+name];assert(c.passed);assert.equal(c.afterMana-c.beforeMana,delta);}
for(const [name,delta]of [['noHero',-5],['mixed',1],['GoonkPre',12]]){const c=proof.compatibility['familiar43-'+name];assert(c.passed);assert.equal(c.afterMana-c.beforeMana,delta);}
const ready=flight?.passed===true;
if(ready)for(const [rank,expected]of [[0,false],[5,true]]){const c=flight.cases['R'+rank];assert.equal(c.actualRank,rank);for(const view of ['army','equipment','activeUnit','battleUnits'])assert.equal(c.views[view],expected,'Missing real effective FLYING view '+rank+'/'+view);}
if(apply)assert(ready,'Original43 stays disabled until native159 R0/R5 effective flight passes');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'heroes-familiar43-verify-')),pending=new Map();let sourceReview;
try{
 execFileSync(process.execPath,['scripts/era-bridge/creatures/stage-familiar-channel43.mjs','.',path.resolve('../Third-Upgrade-Mod-Full'),path.resolve('../h3era-plugins'),scratch+'/stage'],{stdio:'pipe'});
 sourceReview=read(scratch+'/stage/review.json');
 // Source definitions must exactly match those exercised by native controls.
 // Legacy CSV is freshly derived below and is intentionally not copied from
 // the tested stage: this preserves cumulative g15,42 and later migrations.
 for(const [from,to]of [['source-familiar43.candidate.json','source-familiar43.json'],['era-core-familiar-channel43.candidate.json','era-core-familiar-channel43.json']]){const rel='content/config/'+from,bytes=fs.readFileSync(scratch+'/stage/'+rel);assert(bytes.equals(fs.readFileSync(tested+'/'+rel)),'Tested43 definition differs from current strict source '+rel);pending.set(root+'/content/config/'+to,bytes);}
 const legacyPath=sourceReview.legacyRelative,before=fs.readFileSync(legacyPath),after=fs.readFileSync(scratch+'/stage/legacy/crexpbon-without43.candidate.txt');assert.equal(sha(before),sourceReview.legacyBeforeSha256);assert.equal(sourceReview.legacyRowsRemoved.length,4,'Expected exact four legacy43 rows');
 const strip=rows=>rows.map(({source,line,...r})=>r);assert.deepEqual(strip(parseCreatureExperience(after.toString('latin1'))),strip(parseCreatureExperience(before.toString('latin1')).filter(r=>r.creature!==43)),'Other creatures legacy rows must remain unchanged');pending.set(legacyPath,after);
 const manifest=read(root+'/mod.json'),beforeManifest=structuredClone(manifest);manifest.creatures=[...new Set([...manifest.creatures,'config/source-familiar43.json'])];pending.set(root+'/mod.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
 const artifactHashes=Object.fromEntries((beforeManifest.artifacts||[]).map(p=>{const file=root+'/content/'+p.replace(/\.json$/,'')+'.json';return [file,sha(fs.readFileSync(file))];}));
 const g=read(out+'source-magic-reduction-installation.json');assert(g.installed);assert(!parseCreatureExperience(after.toString('latin1')).some(r=>g.actors.includes(r.creature)&&r.code==='g'),'Do not reintroduce migrated g CSV rows');
 const review={ready,activated:apply,sourceId:43,sourcePins:sourceReview.sourcePins,canonicalStatsVerified:true,sourceRows:sourceReview.sourceRows.map(r=>({code:r.code,modifier:r.modifier,values:r.values})),proofs:{progress:sha(fs.readFileSync(out+'native-familiar43-progress.json')),flying:ready?sha(fs.readFileSync(flyingPath)):null},plannedFiles:[...pending.keys()],plannedHashes:Object.fromEntries([...pending].map(([p,b])=>[p,sha(b)])),legacy:{beforeSha256:sha(before),afterSha256:sha(after),rowsRemoved:4,otherRowsUnchanged:true,source42RowsRetained:parseCreatureExperience(after.toString('latin1')).filter(r=>r.creature===42).length},artifactHashesPreserved:artifactHashes,limits:ready?[]:['Effective flight159 not yet validated; source43 remains disabled.']};
 if(apply){for(const [file,bytes]of pending){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}assert.deepEqual(read(root+'/mod.json').artifacts,beforeManifest.artifacts);for(const [file,hash]of Object.entries(artifactHashes))assert.equal(sha(fs.readFileSync(file)),hash);}
 fs.writeFileSync(out+'source-familiar43-installation-review.json',JSON.stringify(review,null,2)+'\n');console.log(JSON.stringify({ready,activated:apply,files:pending.size,legacy43RemovedIfApplied:4}));
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
