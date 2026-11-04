import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

test('Archived path definitions remain available for old saves, without default activation',()=>{
 const mod=JSON.parse(fs.readFileSync('mod/hero-paths/mod.json'));
 assert.equal(mod.keepDisabled,true);
 assert.equal(mod.version,'1.0.0');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('mod/hero-paths/content/config/hero-paths.json')).digest('hex'),'39ca77e9a50e42fd8fde2a7c7e2d9da3559c394c80fc990a86de767159cbb15d');
 const page=fs.readFileSync('scripts/page.mjs','utf8');
 assert(!page.includes("'tum-era','hero-paths'"));
 assert(!page.includes("settings['hero-paths']=true"));
 assert(!page.includes("settings['hero-paths']=false"),'Do not disable a mod required by an existing save');
});
test('Bundled new-game maps and their generator no longer include paths or their dependency',()=>{
 const maps=JSON.parse(execFileSync('python3',['-c',`import json,zipfile
result=[]
for name in ['000-Goonk.vmap','001-Goonks.vmap']:
 with zipfile.ZipFile('maps/'+name)as z:result.append({'header':json.loads(z.read('header.json')),'objects':json.loads(z.read('objects.json'))})
print(json.dumps(result))`],{encoding:'utf8',maxBuffer:8*1024*1024}));
 for(const {header,objects}of maps){
  assert(!header.mods.some(m=>m.modId==='hero-paths'));
  assert(!header.description.includes('Sanctuaire des voies'));
  assert(!objects.some(o=>o.type.startsWith('hero-paths:')));
 }
 assert.equal(maps[0].objects.length,5);assert.equal(maps[1].objects.length,554);
 assert(!fs.readFileSync('scripts/build-goonks-map.py','utf8').includes('hero_paths'));
});
test('Public map normalization preserves mainHero references and is idempotent without changing source maps',()=>{
 const result=JSON.parse(execFileSync('python3',['-c',`
import importlib.util,zipfile,json
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
result=[]
for filename in ['000-Goonk.vmap','001-Goonks.vmap']:
 with zipfile.ZipFile('maps/'+filename)as z:original={n:z.read(n)for n in z.namelist()}
 normalized=mod.normalize(dict(original));assert mod.normalize(dict(normalized))==normalized
 objects=json.loads(normalized['objects.json']);assert all(o.get('options',{}).get('owner')!='neutral'for o in objects);names={o['instanceName']for o in objects}
 assert len(names)==len(objects)
 assert all('_'in n and n.rsplit('_',1)[-1].isdigit()for n in names)
 for player in json.loads(normalized['header.json'])['players'].values():
  if 'mainHero'in player:assert player['mainHero']in names
 assert len(objects)==len(json.loads(original['objects.json']))
 for n in original:
  if n not in ['objects.json','header.json']:assert original[n]==normalized[n]
 result.append(filename)
print(json.dumps(result))
`],{encoding:'utf8'}));assert.equal(result.length,2);
});
