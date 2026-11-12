/** Install only whole source324 from a strict isolated review; native controls gate release. */
import fs from 'node:fs';import path from 'node:path';import {validateRuntimePolicy} from '../runtime-policy.mjs';
const review=path.resolve(process.argv[2]||'/tmp/goonk-mithril-review147c'),root='mod/tum-era',read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const report=read(review+'/native-closed-import-review.json'),record=report.records.find(r=>r.eraId===324);
if(report.nativeConstructOptIn!=='source-mithril-golem-v1'||!report.candidateIds.includes(324)||record.obligations.length)throw Error('Mithril source contract incomplete');
const key='tum-era:eraCreature324',definition=read(review+'/content/config/native-closed-creatures.candidate.json').eraCreature324;
if(!Object.values(definition.abilities).some(b=>b.type==='ERA_SOURCE_CONSTRUCT'))throw Error('Missing source construct marker');
write(root+'/content/config/complete-mithril-golem.json',{eraCreature324:definition});
for(const asset of record.assets){const dest=root+'/'+asset.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(review+'/'+asset.path,dest);}
for(const name of ['era-bridge-experience','era-bridge-skeleton-transformations','era-bridge-runtime']){const file=root+'/content/config/'+name+'.json',current=read(file),candidate=read(review+'/content/config/'+name+'.candidate.json');current.creatures[key]=candidate.creatures[key];if(name==='era-bridge-runtime')validateRuntimePolicy(current);write(file,current);}
const identityPath=root+'/era-identities.json',identities=read(identityPath);identities.creatures[324]=key;write(identityPath,identities);
for(const name of fs.readdirSync(root+'/content/config').filter(f=>/^era-bridge-.*\.json$/.test(f))){const p=root+'/content/config/'+name,data=read(p);if(data.sourceIds){data.sourceIds[key]=324;write(p,data);}}
const manifest=read(root+'/mod.json');manifest.creatures=[...new Set([...manifest.creatures,'config/complete-mithril-golem.json'])];write(root+'/mod.json',manifest);
write('outputs/wog-priorities-0.4.147/mithril-source.json',{sourcePins:report.sourcePins,record,fullNativeValidationRequired:true,constructDefaults:{source:'Amethyst tables.cpp13654..13655',ids:[30,31,32,33,116,117,133]},scope:'Explicit construct membership remains independent of ALIVE/UNDEAD/MIND/NO_MORALE; source repair target condition consumes actual membership.'});
console.log('Prepared complete Mithril Golem; native controls remain required before publication.');
