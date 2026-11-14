import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parseReplacementScript} from './objects.mjs';
import {readJsonc} from './production-resolvers.mjs';

export const SOURCE_REPLACEMENT_CONTRACT='source-object-replacements-v1';
export const SOURCE_REPLACEMENT_ARCHIVE='452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c';
export const digest=value=>crypto.createHash('sha256').update(Buffer.isBuffer(value)||typeof value==='string'?value:JSON.stringify(value)).digest('hex');

export function sourceScriptOrder(names) {
  const priority=name=>Number(/^(-?\d+)\s/.exec(path.basename(name))?.[1]??0);
  return [...names].sort((a,b)=>priority(b)-priority(a)||(a.toLowerCase()<b.toLowerCase()?-1:a.toLowerCase()>b.toLowerCase()?1:0));
}

/** Native numeric subtypes are never inferred from ERA numeric subtypes.
 * Only explicit core indices and registered TUM identities are supplied here.
 * Additional stock WoG mappings require a caller-reviewed identity catalogue.
 */
export function productionReplacementObjectResolver(projectRoot,{additional={}}={}) {
  const core=new Map(),groups=new Map();
  const config=path.join(projectRoot,'work/vcmi-wasm/config/objects');
  const files=fs.readdirSync(config).filter(file=>file.endsWith('.json')).sort();
  for(const file of files)for(const[key,value]of Object.entries(readJsonc(path.join(config,file)))){
    if(!Number.isInteger(value.index))continue;
    const group='core:'+key;groups.set(value.index,group);
    for(const[type,definition]of Object.entries(value.types??{}))
      if(Number.isInteger(definition.index))core.set(`${value.index}:${definition.index}`,{group,type:'core:'+type,evidence:`Explicit core object/type indices in config/objects/${file}`});
  }
  const manifest=readJsonc(path.join(projectRoot,'mod/tum-era/mod.json')),tum=new Map();
  for(const relative of manifest.objects??[])for(const[group,definition]of Object.entries(readJsonc(path.join(projectRoot,'mod/tum-era/content',relative))))
    for(const[type,value]of Object.entries(definition.types??{})){
      const bank=/^eraBank(\d+)$/.exec(type),dwelling=/^eraDwelling(17|20)_(\d+)$/.exec(type);
      const key=bank?`16:${Number(bank[1])}`:dwelling?`${dwelling[1]}:${Number(dwelling[2])}`:null;
      if(key)tum.set(key,{group:group.includes(':')?group:'tum-era:'+group,type:'tum-era:'+type,evidence:'Registered manifest '+relative});
    }
  return (type,subtype)=>additional[`${type}:${subtype}`]??tum.get(`${type}:${subtype}`)??core.get(`${type}:${subtype}`)??null;
}

export function compileSourceReplacementPolicy({sourceRoot,resolveObject,privateSelection,admissionEvidence}={}) {
  if(typeof resolveObject!=='function')throw Error('Explicit object identity resolver required');
  const archive=fs.readFileSync(path.join(sourceRoot,'Data/AmeCre.pac'));
  if(digest(archive)!==SOURCE_REPLACEMENT_ARCHIVE)throw Error('Changed replacement source archive');
  const names=sourceScriptOrder(fs.readdirSync(path.join(sourceRoot,'Data/s')).filter(file=>/replacer.*\.erm$/i.test(file)));
  const sourceRecords=names.map(name=>{const file='Data/s/'+name,bytes=fs.readFileSync(path.join(sourceRoot,file));return{file,sha256:digest(bytes),plan:parseReplacementScript(bytes.toString('utf8'),{source:file})};});
  if(sourceRecords.length!==102)throw Error('Expected all102 supplied source replacement programs');
  const byId=new Map();for(const record of sourceRecords){const list=byId.get(record.plan.id)??[];list.push(record);byId.set(record.plan.id,list);}
  const duplicates=[...byId].filter(([,records])=>records.length>1);
  if(duplicates.length!==1||duplicates[0][0]!=='143'||duplicates[0][1].length!==2)
    throw Error('Changed shared replacement parameter/function identities');
  const collision=duplicates[0][1];
  if(!collision[0].file.endsWith('/143_Frigate of the fallen (replacer).erm')||!collision[1].file.endsWith('/144_Defunct Treetop Tower (replacer).erm'))
    throw Error('Changed original143 shared-handler source order');
  const sourceProgramSha256=digest(sourceRecords.map(({file,sha256})=>({file,sha256})));
  const selected=privateSelection===undefined?null:new Set(privateSelection);
  if(selected&&(!selected.size||[...selected].some(file=>!sourceRecords.some(record=>record.file===file))))
    throw Error('Private selection requires exact existing source file keys');
  const missing=[],ledger=[],plans=[];
  const resolve=(type,subtype,record,role)=>{
    const identity=resolveObject(type,subtype);
    if(!identity||typeof identity.group!=='string'||!identity.group.includes(':')||typeof identity.type!=='string'||!identity.type.includes(':')){
      missing.push({file:record.file,role,sourceType:type,sourceSubtype:subtype});return null;
    }
    return {group:identity.group,type:identity.type};
  };
  for(const record of sourceRecords){
    if(selected&&!selected.has(record.file))continue;
    const shared=byId.get(record.plan.id),effective=shared.at(-1).plan;
    const target=resolve(effective.targetType,effective.targetSubtype,record,'target');
    const rules=effective.rules.map(rule=>({slot:rule.slot,sourceType:rule.sourceType,sourceSubtype:rule.sourceSubtype,
      source:rule.enabled?resolve(rule.sourceType,rule.sourceSubtype,record,'source:'+rule.slot):null,
      percentage:rule.percentage,xOffset:rule.xOffset}));
    const complete=target&&rules.every(rule=>rule.percentage<=0||rule.sourceType<0||rule.sourceSubtype<0||rule.source);
    ledger.push({file:record.file,sourceId:record.plan.id,sourceSha256:record.sha256,
      enabledBySource:effective.enabled,sourceTarget:{type:record.plan.targetType,subtype:record.plan.targetSubtype},
      effectiveTarget:{type:effective.targetType,subtype:effective.targetSubtype},
      sharedParametersFrom:shared.at(-1).file,functionMultiplicity:shared.length,identitiesComplete:Boolean(complete)});
    plans.push({sourceKey:record.file,parameterId:record.plan.id,targetSourceType:effective.targetType,
      targetSourceSubtype:effective.targetSubtype,target,enabled:effective.enabled,
      allowRandomMap:record.plan.conditions.randomMap!==false,functionMultiplicity:shared.length,rules});
  }
  const activate=admissionEvidence!==undefined;
  if(activate){
    if(selected)throw Error('A private selection cannot activate production replacements');
    if(missing.length)throw Error('Unclosed source replacement identities: '+JSON.stringify(missing));
    if(admissionEvidence.passed!==true||admissionEvidence.nativeValidated!==true
      ||admissionEvidence.sourceProgramSha256!==sourceProgramSha256
      ||!/^([a-f0-9]{64})$/.test(admissionEvidence.engineSha256??'')
      ||admissionEvidence.dayOneOnly!==true||admissionEvidence.saveReloadIdempotent!==true
      ||admissionEvidence.shared143NativeValidated!==true)
      throw Error('Complete matching native replacement validation required');
  }
  return {policy:{schemaVersion:1,contract:SOURCE_REPLACEMENT_CONTRACT,enabled:activate,
    sourceArchiveSha256:SOURCE_REPLACEMENT_ARCHIVE,plans},
    review:{sourceProgramSha256,sourceRecords:sourceRecords.map(({file,sha256})=>({file,sha256})),
      selectedPrivate:Boolean(selected),activation:activate,missing,ledger,
      shared143:{parameterOrder:collision.map(record=>record.file),effectiveSource:collision.at(-1).file,
        functionHandlers:2,dayOneHandlers:2,sourceEvidence:'ERA Erm.pas GetOrderedPrioritizedFileList/LoadScriptsFromDir and OptimizeFastAccessListAndRelinkTriggers',
        binaryEvidence:{sha256:'ced15e83ddab9b4edf8039cf337341b5810609fbe1f84f3bc1d8ec7d118ea451',
          loadDirectory:'0x48e528',orderedList:'0x48df18',linkEqualIdHandlers:'0x48f8c4',evidenceId:'ev_2e9964af9d7853bc5a79fc08de233e9829db9b2738998d1b1db78dfb82d1bdbe'}}}};
}
