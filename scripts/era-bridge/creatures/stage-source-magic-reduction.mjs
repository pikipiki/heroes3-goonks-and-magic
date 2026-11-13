/** Inactive, source-pinned g% migration. No production files are modified. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {readEraArchive} from '../resources.mjs';
import {createProductionObjectResolvers,readJsonc} from '../objects/production-resolvers.mjs';
import {parseCreatureExperience,compileCreatureExperience} from './crexpbon.mjs';
const [projectArg='.',sourceArg='../Third-Upgrade-Mod-Full',outputArg='/tmp/goonk-source-g157-review']=process.argv.slice(2);
const project=path.resolve(projectArg),source=path.resolve(sourceArg),output=path.resolve(outputArg);
if(output===project||output.startsWith(project+path.sep)||fs.existsSync(output)&&fs.readdirSync(output).length)throw Error('Fresh isolated output required');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/AmeCre.pac')));
assert.equal(archive.sha256,'452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c');
const rows=parseCreatureExperience(archive.extract('crexpbon.txt').toString('latin1'));
const resolver=createProductionObjectResolvers({sourceRoot:source,projectRoot:project});
const profiles=readJsonc(path.join(project,'mod/tum-era/content/config/era-bridge-experience.json')).creatures;
const declarations=rows.filter(r=>r.code==='g'&&r.creature>=0&&profiles[resolver.resolveCreature(r.creature)]);
const legacyRelative='mod/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt';
const legacy=fs.readFileSync(path.join(project,legacyRelative)),legacyRows=parseCreatureExperience(legacy.toString('latin1'));
const patch={},records=[],removed=new Set();
const any=b=>b?.type==='SPELL_DAMAGE_REDUCTION'&&['spellSchool.any','any',-1].includes(b.subtype);
for(const row of declarations){
 const id=row.creature,key=resolver.resolveCreature(id),definition=resolver.byNative.get(key);
 assert.equal(declarations.filter(r=>r.creature===id).length,1,'Source duplicate g not closed');
 const result=compileCreatureExperience([row],{creatureId:id,installedRows:[],rankZero:'intrinsic',nativeExperienceProfile:true});
 assert.equal(result.ok,true,JSON.stringify(result.diagnostics));
 const intrinsic=Object.values(result.definition.abilities)[0];assert(intrinsic);
 const matching=Object.entries(definition.abilities||{}).filter(([name,b])=>any(b)&&b.val===row.values[0]);
 assert(matching.length<=1,`Ambiguous source gR0 ${key}`);
 const ability=matching[0]?.[0]||'sourceExperienceMagicReductionRank0';
 const originalXP=definition.stackExperience||[],ownG=originalXP.filter(r=>any(r.bonus));
 assert(ownG.length<=1,`Ambiguous source XPg ${key}`);
 const expected=result.definition.stackExperience[0];
 if(ownG.length){assert(expected,`Unexpected existing g XP ${key}`);assert.deepEqual(ownG[0].values,expected.values,`Existing g differs from source ${key}`);}
 const preserved=originalXP.filter(r=>!any(r.bonus));
 patch[key]={abilities:{[ability]:{...(matching[0]?.[1]||{}),...intrinsic}},stackExperience:[...preserved,...result.definition.stackExperience]};
 const legacyG=legacyRows.filter(r=>r.creature===id&&r.code==='g');assert(legacyG.length<=1);
 for(const previous of legacyG){assert.equal(previous.modifier,row.modifier);assert.deepEqual(previous.values,row.values,`Legacy g mismatch ${id}`);removed.add(previous.line);}
 records.push({sourceId:id,nativeId:key,sourceValues:row.values,rankZeroAbility:ability,existingRankZero:!!matching.length,preservedXP:preserved.length,replacedJSONRows:ownG.length,removedLegacyLines:legacyG.map(r=>r.line)});
}
const chunks=legacy.toString('latin1').match(/[^\n]*\n|[^\n]+$/g)||[];
const candidate=Buffer.from(chunks.filter((line,index)=>!removed.has(index+1)).join(''),'latin1');
const beforeNonG=legacyRows.filter(r=>!removed.has(r.line)).map(({source,line,...r})=>r),afterRows=parseCreatureExperience(candidate.toString('latin1')).map(({source,line,...r})=>r);
assert.deepEqual(afterRows,beforeNonG,'All nonmigrated legacy rows must remain semantically identical');
const write=(relative,bytes)=>{const p=path.join(output,relative);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes);};
write('content/config/source-experience-magic-reduction.candidate.json',JSON.stringify(patch,null,2)+'\n');
write('legacy/crexpbon.candidate.txt',candidate);
write('review.json',JSON.stringify({activation:false,nativeValidationRequired:true,sourceArchiveSha256:archive.sha256,legacyRelative,legacyBeforeSha256:sha(legacy),legacyAfterSha256:sha(candidate),records,preservedLegacyGOutsideMigration:legacyRows.filter(r=>r.code==='g'&&!removed.has(r.line)),creaturesManifestAppend:'config/source-experience-magic-reduction.candidate.json',controlsRequired:['g0 with equipmentANY on same source actor','g95 before School and casterSorcery','g100 eligibility and zero injury','intrinsic Golem replacement without double reduction','ordinary Goonk and equipmentANY unchanged'],note:'Only explicit source g rows of already registered actors. No activation, profile, ordinary ability or unrelated XP migration.'},null,2)+'\n');
console.log(JSON.stringify({output,actors:records.map(r=>r.sourceId),removedLegacyG:removed.size,activation:false}));
