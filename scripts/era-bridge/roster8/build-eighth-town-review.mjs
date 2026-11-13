/** Extract native eighth-tier town candidates and original hall resources.
 * Output is isolated. No creature, town or mod is activated by this command.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
import {readEraArchive} from '../resources.mjs';import {readDefFrame} from '../def-frame.mjs';
import {EIGHTH_TOWNS,readSourceEighthTown,compileEighthTownAccess} from './eighth-town-access.mjs';

const [projectArg,tumArg,outArg,contractsArg]=process.argv.slice(2);
if(!projectArg||!tumArg||!outArg)throw Error('Usage: PROJECT TUM FRESH_OUTPUT [COMPLETE_ACTOR_CONTRACTS]');
const project=path.resolve(projectArg),tum=path.resolve(tumArg),out=path.resolve(outArg);
if(out===project||out.startsWith(project+path.sep)||fs.existsSync(out)&&fs.readdirSync(out).length)throw Error('Use fresh isolated output');
const require=createRequire(path.join(project,'work/browser-tests/package.json')),sharp=require('sharp'),JSON5=require('json5');
const read=file=>JSON5.parse(fs.readFileSync(file,'utf8')),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const script=fs.readFileSync(tum+'/Data/s/Third Upgrade Mod.erm','utf8');
const source=fs.readFileSync(tum+'/Data/Common Def.pac'),archive=readEraArchive(source);
const hallNames=['hallcstl.def','hallramp.def','halltowr.def','hallinfr.def','hallnecr.def','halldung.def','hallstrn.def','hallfort.def','hallelem.def'];
const records=[],halls={},baselineTowns={},resources=[];
const write=(name,value)=>{const file=path.join(out,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.isBuffer(value)?value:JSON.stringify(value,null,2)+'\n');};
const resolveCase=(root,relative)=>{let p=root;for(const name of relative.split('/')){const matches=fs.readdirSync(p).filter(n=>n.toLowerCase()===name.toLowerCase());if(matches.length!==1)throw Error('Unresolved resource '+relative);p=path.join(p,matches[0]);}return p;};
for(const [townIndex,name]of EIGHTH_TOWNS.entries()){
 const town='core:'+name,record=readSourceEighthTown(fs.readFileSync(tum+'/Data/Towns/'+townIndex+'.cfg','utf8'),{townIndex,script});records.push(record);
 const baseline=read(project+'/mod/tum-era/content/config/'+name+'.json')[town].town;baselineTowns[town]=baseline;
 const base=baseline.buildingsIcons;if(!base)throw Error('Existing native hall required '+name);
 const sourceRoot=base.startsWith('tum-era/')?'mod/tum-era/content/Sprites':'mod/third-upgrades/content/sprites';
 const relative=base.replace(/\.def$/i,'');let frames=[];
 try{const json=read(resolveCase(project+'/'+sourceRoot,relative+'.json'));frames=(json.images||[]).map(f=>f.frame);}catch(e){
  // A base DEF with no custom frame map has contiguous frame identifiers.
  const bytes=fs.readFileSync(resolveCase(project+'/'+sourceRoot,relative+'.def'));
  if(bytes.readUInt32LE(12)!==1)throw Error('Hall must have one source group '+name);
  frames=Array.from({length:bytes.readUInt32LE(788)},(_,i)=>i);
 }
 if(!frames.length||new Set(frames).size!==frames.length||frames.some(f=>!Number.isSafeInteger(f)||f<0||f>=150))throw Error('Unexpected existing hall frame map '+name);
 const animation='tum-era/eighth-'+name+'-hall',images=frames.map(frame=>({frame,defFile:base,defFrame:frame}));
 for(const [nativeFrame,sourceFrame]of [[150,88],[151,89]]){
  const frame=readDefFrame(archive.extract(hallNames[townIndex]),sourceFrame),png=await sharp(frame.rgba,{raw:{width:frame.width,height:frame.height,channels:4}}).png().toBuffer();
  const sprite='tum-era/eighth-'+name+'-'+sourceFrame+'.png';write('content/Sprites/'+sprite,png);images.push({frame:nativeFrame,file:sprite});
  resources.push({town,sourceHall:hallNames[townIndex],sourceFrame,nativeFrame,sprite,rgbaSha256:sha(frame.rgba),pngSha256:sha(png)});
 }
 write('content/Sprites/'+animation+'.json',{images});halls[town]={animation,sourceFrames:{150:88,151:89}};
}
const ledger=contractsArg?read(path.resolve(contractsArg)):undefined,contracts=ledger?.actorContracts??ledger;
const requiredActorIds=records.flatMap(r=>r.roster.slice(0,2)),missingActorIds=requiredActorIds.filter(id=>!contracts?.[id]?.complete||!contracts?.[id]?.nativeValidated);
// A partial ledger remains useful for resource review. The strict compiler is
// enabled only after all18 source contracts genuinely pass; never synthesize them.
const compiled=compileEighthTownAccess(records,{enabled:Boolean(contracts)&&missingActorIds.length===0,actorContracts:contracts,baselineTowns,halls});
const files=[];for(const town of Object.values(halls)){const p='content/Sprites/'+town.animation+'.json';files.push({path:p,sha256:sha(fs.readFileSync(path.join(out,p)))});}for(const r of resources){const p='content/Sprites/'+r.sprite;files.push({path:p,sha256:sha(fs.readFileSync(path.join(out,p)))});}
const sourceGlobal=fs.readFileSync(tum+'/Data/towns.cfg','utf8');if(!/^EighthsSupported=1\s*$/m.test(sourceGlobal)||!/^disable_cathedral=0\s*$/m.test(sourceGlobal)||!/^buildings_daily=1\s*$/m.test(sourceGlobal)||!/^town_guardian_recruitable_from_grail=0\s*$/m.test(sourceGlobal))throw Error('Unreviewed global source eighth settings');

if(compiled.enabled)write('content/config/eighth-town-access.candidate.json',compiled.patch);
write('eighth-town-source.json',{schemaVersion:1,registered:false,requiredActorIds,missingActorIds,actorContracts:contracts??{},all18ActorContractsComplete:compiled.enabled,baselineTowns,baselineTownSha256:sha(Buffer.from(JSON.stringify(baselineTowns))),patchSha256:compiled.enabled?sha(Buffer.from(JSON.stringify(compiled.patch))):null,files,sourceGlobal:{path:'Data/towns.cfg',sha256:sha(Buffer.from(sourceGlobal)),eighthSupported:true,cathedralEnabled:true,buildingsPerDay:1,guardianGrailRecruitment:false},sourceArchive:'Data/Common Def.pac',sourceArchiveSha256:sha(source),records,halls,resources,enabled:compiled.enabled,
 pending:[...(missingActorIds.length?['Complete source/native contracts for '+missingActorIds.join(',')]:[]),'Native construction, weeklygrowth, recruitment, upgrade, save/load and mobile hall controls'],
 sourceOverride:'Fortress recruitment353/354 comes from town roster; late ERM line360 MA:U353/354 overrides CFG353 self-upgrade, and CFG354 retains the reverse353 upgrade.',
 scope:'Original8th-monsters roster/buildings/hall extraction. No manifest activation or gameplay validation claimed.'});
console.log(JSON.stringify({towns:records.length,resources:resources.length,candidate:compiled.enabled,registered:false,output:out}));
