import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {readEraArchive,readCreatureTable,creatureStats} from '../resources.mjs';
import {parseCreatureExperience,compileCreatureExperience} from './crexpbon.mjs';
import {compileFreshSourceExperienceDefaults,SOURCE_EXPERIENCE_DEFAULTS_CONTRACT} from './source-experience-defaults.mjs';
import {parseJsonc} from '../artifacts/importer.mjs';
import {source241ProxyFile,source241ProxyFileSha,reviewSource241Proxy,source241ProxyPolicy} from './source241-proxy-policy.mjs';

const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export function compileSource241(project,source){
 const archiveBytes=fs.readFileSync(path.join(source,'Data/AmeCre.pac'));assert.equal(sha(archiveBytes),'452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c');
 const archive=readEraArchive(archiveBytes),cfg=fs.readFileSync(path.join(source,'Data/Creatures/241.cfg'));
 assert.equal(cfg.toString('utf8').replaceAll('\\r','').replace(/\r/g,''),'Flags=18\nLevel=2\nTown=7\nAttack effect=3\nRetaliations=100\nStrikeAndReturn=1\n');
 const nativeBytes=fs.readFileSync(path.join(project,source241ProxyFile)),native=parseJsonc(nativeBytes.toString('utf8'));assert.equal(sha(nativeBytes),source241ProxyFileSha);
 const proxy=reviewSource241Proxy(source241ProxyPolicy(),nativeBytes,native);
 assert.deepEqual(native.tumChaoticDragonFly.abilities.unlimitedRetaliation,{type:'UNLIMITED_RETALIATIONS'});
 assert.deepEqual(native.tumChaoticDragonFly.stackExperience,[{bonus:{type:'BLOCKS_RETALIATION'},values:[false,false,false,true,true,true,true,true,true,true]},{bonus:{type:'STACKS_SPEED'},values:[0,0,0,1,2,3,3,4,4,5]}]);
 const rows=parseCreatureExperience(archive.extract('crexpbon.txt').toString('latin1'));
 const own=rows.filter(r=>r.creature===241);
 assert.deepEqual(own.map(r=>[r.code,r.modifier]),[['H','+'],['A','+'],['D','+'],['S','+'],['f','A'],['k','#45'],['c','#47']]);
 assert.deepEqual(own.map(r=>r.values),[[0,1,2,4,5,7,8,10,11,13,14],[0,1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,1,1],[0,0,0,0,1,2,3,3,4,4,5],[2,2,2,2,2,2,2,1,1,1,1],Array(11).fill(100),Array.from({length:11},(_,i)=>5*i)]);
 const installedRows=parseCreatureExperience(fs.readFileSync(path.join(project,'mod/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt'),'latin1'));
 assert(!installedRows.some(r=>r.creature===241),'No numeric241 CSV row is owned by this replacement');
 const staticRows=rows.filter(r=>r.creature!==241||!['H','k','c'].includes(r.code));
 const xp=compileCreatureExperience(staticRows,{creatureId:241,installedRows,rankZero:'intrinsic',nativeExperienceProfile:true,throwOnError:true});
 // This is a complete replacement of the two source-pinned native JSON rows,
 // not an assertion that the installed creature had no previous defaults.
 const defaults=compileFreshSourceExperienceDefaults(rows,{creatureId:241,sourceLevelZeroBased:2,installedRows,nativeExperienceProfile:true,contract:SOURCE_EXPERIENCE_DEFAULTS_CONTRACT,freshDefinition:true,nativeDefaultCarrier:'creature-json',healthRoundingContract:'source-health-xp-rounding-v1'});
 assert.equal(defaults.ok,true);assert.deepEqual(defaults.sourceDefaultsReplacedByOwn.map(r=>r.code).sort(),['A','D','H']);
 const hp=own.find(r=>r.code==='H');
 // Full-value boolean rank ranges avoid native delta merging/stacking. Only
 // one marker can be active at once; no bonus enum or save field is added.
 const healthRows=hp.values.slice(1).map((value,i)=>({bonus:{type:'NONE',val:value,valueType:'ADDITIVE_VALUE',stacking:'eraSourceXpOwnHealth:241:v1',hidden:true},values:Array.from({length:10},(_,rank)=>rank===i)}));
 const stats=creatureStats(readCreatureTable(archive.extract('Crtraits.txt').toString('latin1'))[241]);delete stats.name;
 const definition={...stats,level:3,faction:'core:fortress',abilities:{castWeakness:null,unlimitedRetaliation:null,sourceRetaliations100:{type:'ADDITIONAL_RETALIATION',val:99},sourceOriginalStatusHealth:{type:'ERA_SOURCE_STATUS_HEALTH',val:50},...xp.definition.abilities},stackExperience:[...defaults.definition.stackExperience,...xp.definition.stackExperience,...healthRows]};
 const profile=JSON.parse(fs.readFileSync(path.join(project,'mod/tum-era/content/config/era-bridge-experience.json'))).creatures['third-upgrades:tumChaoticDragonFly'];
 assert.deepEqual(profile,{fullRank10:52500,rank11Extra:26250,battlePercent:40,experienceMultiplier:1,upgradeMultiplier:.75});
 return{definition:{'third-upgrades:tumChaoticDragonFly':definition},review:{activation:false,nativeValidated:false,sourceId:241,sourceCfgSHA256:sha(cfg),sourceArchiveSHA256:sha(archiveBytes),nativeDefinitionSHA256:sha(nativeBytes),proxy,profile,sourceRows:own,defaults:defaults.sourceDefaultRows,retiredOwnDefaults:defaults.sourceDefaultsReplacedByOwn,healthTag:'eraSourceXpOwnHealth:241:v1',healthOrdering:'native pre-XP HP, then exact source additive H+, then existing specialist/status rules',nativeOtherAbilitiesPreserved:['canFly','dispellHelpful','strikeAndReturn'],retiredFiniteCounterProxy:'unlimitedRetaliation→100 total',requiredRuntimeOwners:{k45:'strict source XP admission43 independent of DEFEND',c47:'existing exact source status service'},graphicsAndSound:'Preserve existing native assets and localized names',freshCarrierProof:'Both exact native JSON XP rows wholly retired; source defaults/own rows are complete and disjoint',pending:['Native R0/R4/R7/R10/profile stats, finite100/counter58/rank7 adjacent attacks','Real health-percent native extension and expiry/poison order','Nonduplicatedk45/c47, native source owner preservation and save reload']}};
}
if(process.argv[1]===new URL(import.meta.url).pathname){const project=path.resolve(process.argv[2]||'.'),source=path.resolve(process.argv[3]||'../Third-Upgrade-Mod-Full'),out=path.resolve(process.argv[4]||'work/downloads/wog-port184/root/source241-candidate');assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});const r=compileSource241(project,source);fs.writeFileSync(out+'/definition.json',JSON.stringify(r.definition,null,2)+'\n');fs.writeFileSync(out+'/review.json',JSON.stringify(r.review,null,2)+'\n');console.log(out);}
