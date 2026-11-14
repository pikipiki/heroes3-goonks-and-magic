import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';
import {prepareSourceRecruitmentAccess,stageSourceRecruitmentAccess,RECRUITMENT_ACCESS_SOURCE_PINS} from '../scripts/era-bridge/objects/source-recruitment-access.mjs';
import {createProductionObjectResolvers} from '../scripts/era-bridge/objects/production-resolvers.mjs';
const project=process.cwd(),source=path.resolve('../Third-Upgrade-Mod-Full'),available=fs.existsSync(source+'/Data/AmeCre.pac');
// Identity-only test declarations. Guard stats still come from the actual pinned source.
const resolver=()=>{const r=createProductionObjectResolvers({projectRoot:project,sourceRoot:source});for(const id of [360,362]){r.byEra.set(id,'tum-era:eraCreature'+id);r.byNative.set('tum-era:eraCreature'+id,{})}return r};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('HolyPeaks bytes match the independent full object importer, with exact source Mummy link',{skip:!available},()=>{
 const r=resolver(),result=prepareSourceRecruitmentAccess({sourceRoot:source,resolver:r});assert.equal(result.files.size,4);assert.equal(sha(result.files.get('content/config/objects/dwelling17_166.json')),'23fb4a5d7da3dec9884283e3365bc78a4fc41ccfc187f23cb3868fdf28a32ca3');assert.deepEqual(JSON.parse(result.files.get('content/config/source-mummy360-upgrade.json')),{'core:mummy':{upgrades:['tum-era:eraCreature360']}});assert.equal(result.provenance.activated,false);assert.equal(result.provenance.nativeValidated,false);
 const repeated=prepareSourceRecruitmentAccess({sourceRoot:source,resolver:r});assert.deepEqual([...repeated.files],[...result.files]);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-recruitment-stage-'));try{const output=path.join(root,'private');stageSourceRecruitmentAccess(result,output,{projectRoot:project,sourceRoot:source});assert(fs.existsSync(output+'/source-recruitment-access.json'));assert.throws(()=>stageSourceRecruitmentAccess(result,output),/fresh/);assert.throws(()=>stageSourceRecruitmentAccess(result,path.join(project,'mod/tum-era/rejected-review')),/outside production/)}finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('Existing equivalent upgrades are preserved; conflicting evolution is rejected',{skip:!available},()=>{
 const r=resolver();r.byNative.get('core:mummy').upgrades=['tum-era:eraCreature360'];assert.deepEqual(JSON.parse(prepareSourceRecruitmentAccess({sourceRoot:source,resolver:r}).files.get('content/config/source-mummy360-upgrade.json'))['core:mummy'].upgrades,['tum-era:eraCreature360']);r.byNative.get('core:mummy').upgrades=['other:unverifiedMummy'];assert.throws(()=>prepareSourceRecruitmentAccess({sourceRoot:source,resolver:r}),/Conflicting or equivalent native Mummy/);
});
test('Changed source CFG fails before producing review resources',{skip:!available},()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-recruitment-source-'));try{for(const file of Object.keys(RECRUITMENT_ACCESS_SOURCE_PINS)){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});if(file==='Data/Creatures/141.cfg')fs.writeFileSync(target,'UpgradesTo=359\n');else fs.symlinkSync(path.join(source,file),target)}assert.throws(()=>prepareSourceRecruitmentAccess({sourceRoot:root,resolver:resolver()}),/Changed recruitment source Data\/Creatures\/141.cfg/)}finally{fs.rmSync(root,{recursive:true,force:true})}
});
