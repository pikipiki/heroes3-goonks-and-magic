import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {parseJsonc} from '../scripts/era-bridge/artifacts/importer.mjs';
test('every active TUM object template names a registered native terrain',()=>{
 const terrainIds=new Set(Object.keys(parseJsonc(fs.readFileSync('work/vcmi-wasm/config/terrains.json','utf8'))));
 const manifest=JSON.parse(fs.readFileSync('mod/tum-era/mod.json'));
 let checked=0;
 for(const file of manifest.objects){
  const document=JSON.parse(fs.readFileSync(path.join('mod/tum-era/content',file)));
  for(const group of Object.values(document))for(const [key,type]of Object.entries(group.types||{}))for(const template of Object.values(type.templates||{}))for(const terrain of template.allowedTerrains||[]){
   assert(terrainIds.has(terrain.replace(/^core:/,'')),`${file}/${key}: unresolved terrain ${terrain}`);checked++;
  }
 }
 assert(checked>0,'Active templates must be checked, not an empty fixture list');
});
