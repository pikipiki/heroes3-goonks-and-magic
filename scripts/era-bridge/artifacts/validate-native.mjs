import fs from 'node:fs';import path from 'node:path';import {parseJsonc} from './importer.mjs';import {fileURLToPath} from 'node:url';
// Evaluate the actual VCMI schemas for the emitted artifact/bonus subset.
// Native resource loading remains a separate required integration check.
export function validateSchema(value,schema,{load,document=schema,base='',location='$'}={}){
 const errors=[],fail=message=>errors.push(`${location}: ${message}`),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(typeof schema==='boolean')return schema?[]:[`${location}: rejected by false schema`];
 const sub=(v,s,loc=location,doc=document,b=base)=>validateSchema(v,s,{load,document:doc,base:b,location:loc});
 if(schema.$ref){const [file,pointer]=schema.$ref.split('#');const b=file?path.join(path.dirname(base),file):base,doc=file?load(b):document;let s=doc;if(pointer)for(const part of pointer.split('/').slice(1))s=s[part.replace(/~1/g,'/').replace(/~0/g,'~')];if(!s)throw new Error('Unresolved schema '+schema.$ref);return sub(value,s,location,doc,b);}
 if(schema.type){const types=Array.isArray(schema.type)?schema.type:[schema.type];if(!types.some(t=>t==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):t==='array'?Array.isArray(value):t==='integer'?Number.isInteger(value):t==='number'?typeof value==='number'&&Number.isFinite(value):t==='null'?value===null:typeof value===t))fail(`expected ${types.join('|')}`);}
 if(schema.enum&&!schema.enum.some(v=>same(value,v)))fail('outside enum');if('const' in schema&&!same(value,schema.const))fail('outside const');
 if(schema.allOf)for(const s of schema.allOf)errors.push(...sub(value,s));
 if(schema.anyOf&&!schema.anyOf.some(s=>sub(value,s).length===0))fail('no anyOf branch matches');
 if(schema.oneOf&&schema.oneOf.filter(s=>sub(value,s).length===0).length!==1)fail('not exactly one oneOf branch matches');
 if(schema.not&&sub(value,schema.not).length===0)fail('forbidden schema matches');
 if(schema.if){const branch=sub(value,schema.if).length===0?schema.then:schema.else;if(branch)errors.push(...sub(value,branch));}
 if(typeof value==='number'){if(schema.minimum!==undefined&&value<schema.minimum)fail('below minimum');if(schema.maximum!==undefined&&value>schema.maximum)fail('above maximum');}
 if(typeof value==='string'){if(schema.minLength!==undefined&&value.length<schema.minLength)fail('below minLength');if(schema.maxLength!==undefined&&value.length>schema.maxLength)fail('above maxLength');if(schema.pattern&&!new RegExp(schema.pattern).test(value))fail('outside pattern');}
 if(Array.isArray(value)){if(schema.minItems!==undefined&&value.length<schema.minItems)fail('below minItems');if(schema.maxItems!==undefined&&value.length>schema.maxItems)fail('above maxItems');if(schema.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)fail('duplicate items');if(schema.items)for(const [i,v]of value.entries())errors.push(...sub(v,Array.isArray(schema.items)?schema.items[i]??{}:schema.items,`${location}[${i}]`));}
 if(value!==null&&typeof value==='object'&&!Array.isArray(value)){
  for(const key of schema.required??[])if(!(key in value))fail('missing required '+key);
  for(const [key,v]of Object.entries(value)){const s=schema.properties?.[key];if(s)errors.push(...sub(v,s,`${location}.${key}`));else if(schema.additionalProperties===false)fail('unknown property '+key);else if(typeof schema.additionalProperties==='object')errors.push(...sub(v,schema.additionalProperties,`${location}.${key}`));}
 }
 return errors;
}
export function validateNativeLinks(definitions,{spellIds,artifactIds,namespace='tum-era',assetExists}={}) {
 const errors=[],spells=new Set(spellIds),artifacts=new Set(artifactIds);
 for(const [id,a]of Object.entries(definitions)){
  for(const [key,b]of Object.entries(a.bonuses??{})){
   if(['SPELL','SPELL_IMMUNITY','OPENING_BATTLE_SPELL'].includes(b.type)&&(!b.subtype?.startsWith('core:')||!spells.has(b.subtype.slice(5))))errors.push(`${id}.${key}: unresolved native spell ${b.subtype}`);
   if(b.type==='PRIMARY_SKILL'&&!['primarySkill.attack','primarySkill.defence','primarySkill.spellpower','primarySkill.knowledge'].includes(b.subtype))errors.push(`${id}.${key}: invalid primary skill ${b.subtype}`);
  }
  for(const c of a.components??[])if(!(c.startsWith('core:')&&artifacts.has(c.slice(5)))&&!(c.startsWith(namespace+':')&&Object.hasOwn(definitions,c.slice(namespace.length+1))))errors.push(`${id}: unresolved native component ${c}`);
  for(const [field,kind]of [['image','Data'],['scenarioBonus','Data'],['map','Sprites']])if(!assetExists(`Content/${kind}/${a.graphics?.[field]}`))errors.push(`${id}: missing ${field} asset`);
  if(!assetExists(`Content/Sprites/${a.graphics?.map?.replace(/\.def$/,'.msk')}`))errors.push(`${id}: missing map MSK`);
 }
 return errors;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const here=path.dirname(fileURLToPath(import.meta.url)),engine=process.argv[2]??path.resolve('work/vcmi-wasm'),output=process.argv[3]??path.join(here,'generated-native');
 const defs=JSON.parse(fs.readFileSync(path.join(output,'Content/config/native-artifacts.json'))),report=JSON.parse(fs.readFileSync(path.join(output,'artifact-import-report.json'))),cache=new Map();
 const load=p=>{if(!cache.has(p))cache.set(p,parseJsonc(fs.readFileSync(p,'utf8')));return cache.get(p);};
 const schemaPath=path.join(engine,'config/schemas/artifact.json'),schema=load(schemaPath);let errors=[];
 for(const [id,a]of Object.entries(defs))errors.push(...validateSchema(a,schema,{load,base:schemaPath,location:id}));
 errors.push(...validateNativeLinks(defs,{spellIds:Object.values(report.nativeIds),artifactIds:Object.values(report.coreArtifactIds),assetExists:p=>fs.existsSync(path.join(output,p))}));
 const result={artifacts:Object.keys(defs).length,engineSchemaFiles:[...cache.keys()].map(p=>path.basename(p)),schemaAndLinkErrors:errors,nativeEngineLoad:'Not performed by this validator; run engine integration checks separately.'};
 fs.writeFileSync(path.join(output,'artifact-validation-report.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(errors.length)process.exitCode=1;
}
