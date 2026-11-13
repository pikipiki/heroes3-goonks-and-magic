/** Install only a source-pinned, native-validated g migration; preserve other modules. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {readJsonc} from '../objects/production-resolvers.mjs';
const[projectArg='.',sourceArg='../Third-Upgrade-Mod-Full',reviewArg='work/downloads/wog-port157/source-g-review',proofArg='outputs/wog-priorities-0.4.147/native-source-magic-reduction.json',reportArg='outputs/wog-priorities-0.4.147/source-magic-reduction-installation.json']=process.argv.slice(2);
const project=path.resolve(projectArg),source=path.resolve(sourceArg),review=path.resolve(reviewArg),proof=readJsonc(path.resolve(proofArg)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(proof.featureContract,'source-experience-magic-reduction-v1');assert.equal(proof.nativeValidated,true);assert.equal(proof.nativeControlsPassed,9);
for(const[name,value]of Object.entries({g0:23,ordinary:24,g50:20,mixed:14,banner:16,g95:0,g95sorcery:6,g100:0}))assert.equal(proof.controls['magicReduction-'+name].damage,value);
const zero=proof.controls['magicReduction-zeroWound'];assert.equal(zero.zeroSpell.damage,0);assert.equal(zero.first.reflected,Math.floor(zero.first.physical*20/100));assert(zero.first.reflected>0);assert.equal(zero.expired.reflected,0);
for(const series of Object.values(proof.reports))assert.equal(series.engineMetadata.sha256,'b93b3bc6af5e3aa1088a85775a7194c8a7f3632993fcb94d134b64222897b9de');
for(const[file,expected]of Object.entries(proof.cppSourceHashes))assert.equal(sha(fs.readFileSync(path.join(project,file))),expected,'Native-validated source changed: '+file);
const sourceReview=readJsonc(path.join(review,'review.json')),creatures=fs.readFileSync(path.join(review,'content/config/source-experience-magic-reduction.candidate.json')),legacy=fs.readFileSync(path.join(review,'legacy/crexpbon.candidate.txt'));
assert.equal(sha(creatures),proof.candidateSha256);assert.equal(sha(legacy),proof.legacyCandidateSha256);assert.equal(sourceReview.legacyBeforeSha256,proof.legacyBeforeSha256);
// Recompute from the current ROOT (including recently added artifacts), rather
// than applying a stale whole creature array over intervening changes.
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'era-g-install-'));
try{
 const fresh=path.join(scratch,'review'),run=spawnSync(process.execPath,[path.join(project,'scripts/era-bridge/creatures/stage-source-magic-reduction.mjs'),project,source,fresh],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr||run.stdout);
 assert.equal(sha(fs.readFileSync(path.join(fresh,'content/config/source-experience-magic-reduction.candidate.json'))),proof.candidateSha256,'Current definitions differ from the native-validated candidate');
 assert.equal(sha(fs.readFileSync(path.join(fresh,'legacy/crexpbon.candidate.txt'))),proof.legacyCandidateSha256);
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
const manifestPath=path.join(project,'mod/tum-era/mod.json'),before=fs.readFileSync(manifestPath),manifest=JSON.parse(before),relative='config/source-experience-magic-reduction.json',target=path.join(project,'mod/tum-era/content',relative),legacyPath=path.join(project,sourceReview.legacyRelative);
assert(!manifest.creatures.includes(relative),'Migration already installed');assert(!fs.existsSync(target),'Unexpected existing migration file');assert.equal(sha(fs.readFileSync(legacyPath)),proof.legacyBeforeSha256);
const artifacts=structuredClone(manifest.artifacts),artifactHashes={};
for(const file of artifacts){let p=path.join(project,'mod/tum-era/content',file);if(!path.extname(p))p+='.json';artifactHashes[path.relative(project,p)]=sha(fs.readFileSync(p));}
const next=structuredClone(manifest);next.creatures.push(relative);
assert.deepEqual(next.artifacts,artifacts);const a=structuredClone(manifest),b=structuredClone(next);delete a.creatures;delete b.creatures;assert.deepEqual(a,b,'Every non-creature manifest field must be preserved');assert.equal(sha(fs.readFileSync(manifestPath)),sha(before),'Concurrent manifest modification');
fs.writeFileSync(target,creatures);fs.writeFileSync(legacyPath,legacy);fs.writeFileSync(manifestPath,JSON.stringify(next,null,2)+'\n');
for(const[file,expected]of Object.entries(artifactHashes))assert.equal(sha(fs.readFileSync(path.join(project,file))),expected,'Existing artifact modified');
const changedFiles=['mod/tum-era/content/'+relative,sourceReview.legacyRelative,'mod/tum-era/mod.json'];
const report={installed:true,nativeValidated:true,engineSha256:Object.values(proof.reports)[0].engineMetadata.sha256,actors:sourceReview.records.map(r=>r.sourceId),legacyRowsRemoved:sourceReview.records.flatMap(r=>r.removedLegacyLines).length,candidateSha256:proof.candidateSha256,legacyBeforeSha256:proof.legacyBeforeSha256,legacyAfterSha256:proof.legacyCandidateSha256,manifestBeforeSha256:sha(before),manifestAfterSha256:sha(fs.readFileSync(manifestPath)),artifactManifestPreserved:true,artifactFileHashes:artifactHashes,changedFiles,unrelatedModules:'Source43 and whole355/356 remain inactive; no profile/identity/artifact rewrite'};
const reportPath=path.resolve(reportArg);fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({installed:true,actors:report.actors,legacyRowsRemoved:report.legacyRowsRemoved,changedFiles}));
