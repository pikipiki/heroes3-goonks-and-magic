/** Private-only whole102 source identity union. Never writes a production manifest. */
import fs from 'node:fs';import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProductionObjectResolvers,readJsonc} from '../../scripts/era-bridge/objects/production-resolvers.mjs';
import {prepareTumObjectImport} from '../../scripts/era-bridge/objects/importer.mjs';
import {compileSourceReplacementPolicy,productionReplacementObjectResolver} from '../../scripts/era-bridge/objects/source-replacements.mjs';
export function buildReplacement185Union({project=process.cwd(),source=path.resolve('../Third-Upgrade-Mod-Full'),dwelling='/tmp/goonk-dwelling-stage185-native-final',banks='/tmp/goonk-six-banks185',cave='/tmp/goonk-cave185-candidate-final',output='/tmp/goonk-replacement185-union'}={}){
 if(fs.existsSync(output)&&fs.readdirSync(output).length)throw Error('Fresh private union required');fs.mkdirSync(output,{recursive:true});
 const files=new Map(),add=(name,bytes)=>{if(files.has(name)&&!files.get(name).equals(bytes))throw Error('Private candidate resource collision '+name);files.set(name,bytes);};
 const tree=root=>{for(const file of fs.readdirSync(path.join(root,'content'),{recursive:true})){const full=path.join(root,'content',file);if(fs.statSync(full).isFile())add('content/'+file,fs.readFileSync(full));}};
 for(const root of[dwelling,banks,cave])tree(root);
 const stock=path.join(project,'work/downloads/wog-port185/root/stock-banks'),stockIds=new Set([21,24,25,26,27,28,29,30,31]);
 for(const id of stockIds){const file='content/config/objects/bank'+id+'.json';add(file,fs.readFileSync(path.join(stock,file)));}
 const stockReview=readJsonc(path.join(stock,'review.json'));
 for(const asset of stockReview.assets.filter(a=>stockIds.has(Number(a.object.replace(/^bank:/,'')))&&a.object.startsWith('bank:')))add(asset.path,fs.readFileSync(path.join(stock,asset.path)));
 const resolver=createProductionObjectResolvers({projectRoot:project,sourceRoot:source});
 const creatureDefinitions={...readJsonc(path.join(dwelling,'content/config/source-dwelling-actors.candidate.json')),...readJsonc(path.join(banks,'content/config/source-bank-actors.candidate.json'))};
 for(const[key,definition]of Object.entries(creatureDefinitions)){const id=Number(key.replace('eraCreature',''));resolver.byEra.set(id,'tum-era:'+key);resolver.byNative.set('tum-era:'+key,definition);}
 const imported=prepareTumObjectImport({sourceRoot:source,...resolver});
 const manifest=readJsonc(path.join(project,'mod/tum-era/mod.json')),registered=new Set(manifest.objects??[]);
 const initial=compileSourceReplacementPolicy({sourceRoot:source,resolveObject:productionReplacementObjectResolver(project)}),needed=new Set(initial.review.ledger.map(r=>r.effectiveTarget.type+':'+r.effectiveTarget.subtype));
 const extra={};const dwellingConfigs=[];
 for(const record of imported.compiled.filter(r=>r.kind==='dwelling')){
  const[type,subtype]=String(record.id).split('_').map(Number);if(!needed.has(type+':'+subtype))continue;
  if(!registered.has(record.config.replace(/^content\//,''))){
   add(record.config,imported.files.get(record.config));dwellingConfigs.push(record.config.replace(/^content\//,''));
   for(const asset of imported.assets.filter(a=>a.object==='dwelling:'+record.id))add(asset.path,imported.files.get(asset.path));
  }
  const def=JSON.parse(imported.files.get(record.config));for(const[group,value]of Object.entries(def))for(const key of Object.keys(value.types??{}))extra[type+':'+subtype]={group:group.includes(':')?group:'tum-era:'+group,type:'tum-era:'+key};
 }
 for(const id of[48,51,64,65,66,67,...stockIds])extra['16:'+id]={group:'core:creatureBank',type:'tum-era:eraBank'+id};
 const caveReview=readJsonc(path.join(cave,'mysterious-cave-source.json'));Object.assign(extra,caveReview.identityBindings);
 const resolveObject=productionReplacementObjectResolver(project,{additional:extra});
 const selection=initial.review.sourceRecords.map(r=>r.file);
 const compiled=compileSourceReplacementPolicy({sourceRoot:source,resolveObject,privateSelection:selection});
 if(compiled.review.missing.length)throw Error('Unclosed full102 union identities '+JSON.stringify(compiled.review.missing));
 // This explicit bypass is confined to the private test tree; production compiler still requires matching evidence.
 compiled.policy.enabled=true;
 add('content/config/era-object-replacements-v1.json',Buffer.from(JSON.stringify(compiled.policy,null,2)+'\n'));
 const objectConfigs=[...dwellingConfigs,...[48,51,64,65,66,67,...stockIds].map(id=>'config/objects/bank'+id+'.json'),'config/objects/mysterious-cave.json'];
 for(const[file,bytes]of files){const full=path.join(output,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,bytes);}
 const patches={dwelling:readJsonc(path.join(dwelling,'dwelling-registry-patches.json')),bank:readJsonc(path.join(banks,'bank-registry-patches.json')),stock:stockReview.modPatch};
 fs.writeFileSync(path.join(output,'registry-patches.json'),JSON.stringify(patches,null,2)+'\n');
 const review={privateOnly:true,activated:false,nativeValidated:false,plans:compiled.policy.plans.length,objects:objectConfigs,source:compiled.review,extra,files:files.size,sourceStages:{dwelling,banks,cave,stock},dwellingDiagnostics:imported.diagnostics.filter(d=>d.kind==='dwelling')};
 fs.writeFileSync(path.join(output,'union-review.json'),JSON.stringify(review,null,2)+'\n');return review;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const result=buildReplacement185Union({output:process.argv[2],dwelling:process.argv[3]});console.log(JSON.stringify({plans:result.plans,objects:result.objects.length,files:result.files,missing:result.source.missing,output:process.argv[2]}));}
