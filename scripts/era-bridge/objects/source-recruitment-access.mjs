/** Two exact source recruitment links outside the102 replacement target set.
 * Returns reviewable native resources. Never writes or activates a production mod.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {parseArgs} from 'node:util';
import {readEraArchive} from '../resources.mjs';
import {parseDwellingTable,convertObjectTemplate,eraDwellingGuards,compileDwelling} from './objects.mjs';
import {readUnconditionalSourceUpgrades} from '../creatures/native-closed-upgrade-source.mjs';
import {createProductionObjectResolvers,readJsonc} from './production-resolvers.mjs';
export const RECRUITMENT_ACCESS_SOURCE_PINS=Object.freeze({
 'Data/AmeCre.pac':'452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c',
 'Data/s/Third Upgrade Mod.erm':'0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315',
 'Data/s/1000 tum - consts.erm':'cf39435c763439482ce6a96fc7d589abd27c96779de04e719678c2ec0db82d76',
 'Data/Creatures/141.cfg':'1ee0cca8ae2ef83f5ec9c6197c6d46accc26afac42a74f4bc08503602dca1f27',
 'Data/Creatures/362.cfg':'13ac70c3eb08199c95b353f98b558050a437c1cca0cd69ce615923bbb2c97679',
 'Lang/TUM_Objects.json':'612608f7dd53a717c7b318715aff11c41c79029f4d21bb731588a0698316bda3',
 'Lang/RMG_Dwellings.json':'c7fc310a56e3430b92d40e4eacb42d359d5749a03da0ef0068f1e271020aed95'
});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const jsonBytes=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
export function prepareSourceRecruitmentAccess({sourceRoot,resolver}={}){
 assert(sourceRoot&&resolver,'Explicit sourceRoot and native resolver required');
 const source=new Map();for(const[file,expected]of Object.entries(RECRUITMENT_ACCESS_SOURCE_PINS)){const bytes=fs.readFileSync(path.join(sourceRoot,file));assert.equal(sha(bytes),expected,'Changed recruitment source '+file);source.set(file,bytes)}
 for(const id of [141,360,362])assert(resolver.resolveCreature(id)&&resolver.byNative.has(resolver.resolveCreature(id)),'Unclosed recruitment identity '+id);
 const from=resolver.resolveCreature(141),to=resolver.resolveCreature(360),holyCreature=resolver.resolveCreature(362);assert.equal(from,'core:mummy','Original141 identity must remain native Mummy');
 const script=source.get('Data/s/Third Upgrade Mod.erm').toString('utf8'),constants=source.get('Data/s/1000 tum - consts.erm').toString('utf8'),upgrades=readUnconditionalSourceUpgrades(script,constants,{MON_CRYSTAL_DRAGON:133}),upgrade=upgrades.upgrades.get(141);
 assert.equal(upgrade?.to,360,'Final unconditional141 upgrade changed');assert.equal(upgrade.conditionDepth,0);assert(!upgrades.conditional.some(r=>r.from===141),'Conditional141 evolution requires explicit review');
 const cfgAssignments=[...source.get('Data/Creatures/141.cfg').toString('utf8').matchAll(/^UpgradesTo=(\d+)\s*$/gm)].map(m=>Number(m[1]));assert.deepEqual(cfgAssignments,[360],'Source Amethyst upgrade must agree with MA:U141/360');
 const existing=resolver.byNative.get(from).upgrades??[];assert(Array.isArray(existing),'Native Mummy upgrades must be an array');
 assert(!existing.length||existing.includes(to),'Conflicting or equivalent native Mummy evolution must be resolved explicitly; never overwrite');
 const mummyPatch={[from]:{upgrades:[...new Set([...existing,to])]}};
 const archive=readEraArchive(source.get('Data/AmeCre.pac')),rows=parseDwellingTable(archive.extract('DwTable.txt').toString('latin1')),row=rows.find(r=>r.objectType===17&&r.objectSubtype===166);assert(row);assert.deepEqual(row.creatureIds,[362]);assert.equal(row.portraitFrame,166);
 const language=JSON.parse(source.get('Lang/TUM_Objects.json').toString('utf8')),rmg=JSON.parse(source.get('Lang/RMG_Dwellings.json').toString('utf8')),lines=Object.values(rmg.RMG.resound.properties).flat().filter(line=>{const p=line.trim().split(/\s+/);return p[5]==='17'&&p[6]==='166'});assert(lines.length>0,'Exact original HolyPeaks template required');
 const templates={},assets=new Map();for(const[lineIndex,line]of lines.entries()){
  const animation=line.trim().split(/\s+/)[0];assert.match(animation,/^[A-Za-z0-9_-]+\.def$/i);const mask=animation.replace(/\.def$/i,'.msk');
  templates['base'+lineIndex]=convertObjectTemplate(line,{maskBytes:archive.extract(mask),animationPrefix:'tum-era/objects/'}).template;
  for(const name of [animation,mask])assets.set('content/sprites/tum-era/objects/'+name,archive.extract(name));
 }
 const guards=eraDwellingGuards(row,{resolveStats:resolver.resolveStats,levelBase:resolver.levelBase});assert.deepEqual(guards,[{creatureId:362,amount:3}],'Original HolyDragon dwelling guards changed');
 const compiled=compileDwelling(row,{objectId:'eraDwelling17_166',templates,name:language.era.dwellings1?.[166]||row.name,resolveCreature:resolver.resolveCreature,guards,nativeRmg:resolver.resolveDwellingRmg?.(row)});
 const objectConfig='content/config/objects/dwelling17_166.json',creatureConfig='content/config/source-mummy360-upgrade.json',files=new Map([[objectConfig,jsonBytes(compiled.definition)],[creatureConfig,jsonBytes(mummyPatch)],...assets]);
 const modPatch={objects:[objectConfig.replace(/^content\//,'')],creatures:[creatureConfig.replace(/^content\//,'')]};
 const provenance={schemaVersion:1,contract:'source-recruitment-access-v1',sourcePins:RECRUITMENT_ACCESS_SOURCE_PINS,nativeValidated:false,activated:false,
  mummyUpgrade:{sourceId:141,nativeId:from,targetSourceId:360,targetNativeId:to,sourceAssignment:upgrade,sourceCfg:'Data/Creatures/141.cfg:3 UpgradesTo=360',existingNativeUpgrades:existing,policy:'Keep an already equivalent resolved evolution; reject conflicting identities; patch only upgrades, never Mummy stats or abilities.'},
  holyPeaks:{objectSourceType:17,objectSourceSubtype:166,nativeGroup:'core:creatureGeneratorCommon',nativeType:'tum-era:eraDwelling17_166',row,creatureNativeId:holyCreature,guards,templateSourceLines:lines,config:objectConfig},
  files:[...files].map(([file,bytes])=>({file,bytes:bytes.length,sha256:sha(bytes)})),modPatch};
 return {files,modPatch,provenance};
}
export function stageSourceRecruitmentAccess(result,destination,{projectRoot=process.cwd(),sourceRoot}={}){
 const resolved=path.resolve(destination),forbidden=[path.resolve(projectRoot,'mod'),...(sourceRoot?[path.resolve(sourceRoot)]:[])];for(const root of forbidden)assert(resolved!==root&&!resolved.startsWith(root+path.sep),'Private stage must stay outside production mods and source pack');assert(!fs.existsSync(resolved),'Use a fresh private destination');
 for(const[file,bytes]of result.files){assert(file.startsWith('content/')&&!file.split('/').includes('..'));const full=path.join(resolved,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,bytes)}
 fs.writeFileSync(path.join(resolved,'source-recruitment-access.json'),jsonBytes(result.provenance));return result.provenance;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const{values}=parseArgs({options:{source:{type:'string'},project:{type:'string'},catalogue:{type:'string'},output:{type:'string'}}});assert(values.source&&values.catalogue&&values.output,'Required --source TUM_ROOT --catalogue COMPLETE_UNION --output FRESH_PRIVATE_DIR');
 const projectRoot=path.resolve(values.project??process.cwd()),sourceRoot=path.resolve(values.source),resolver=createProductionObjectResolvers({projectRoot,sourceRoot});
 for(const base of ['source-bank-actors','source-dwelling-actors']){const candidate=path.join(values.catalogue,'content/config',base+'.candidate.json'),normal=path.join(values.catalogue,'content/config',base+'.json'),file=fs.existsSync(candidate)?candidate:normal;for(const[key,definition]of Object.entries(readJsonc(file))){assert.match(key,/^eraCreature\d+$/);resolver.byEra.set(Number(key.replace('eraCreature','')),'tum-era:'+key);resolver.byNative.set('tum-era:'+key,definition)}}
 const result=prepareSourceRecruitmentAccess({sourceRoot,resolver});stageSourceRecruitmentAccess(result,values.output,{projectRoot,sourceRoot});console.log(JSON.stringify({files:result.files.size,modPatch:result.modPatch,output:values.output,activated:false}));
}
