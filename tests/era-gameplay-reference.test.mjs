import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inventoryPack} from '../scripts/era-bridge/gameplay/reference.mjs';
import {profileAdmission} from '../scripts/era-bridge/gameplay/profiles.mjs';
import {sha256} from '../scripts/era-bridge/compatibility/erm-inventory.mjs';

test('standalone source inventory excludes Git and macOS metadata, preserves disabled source and hashes plugins',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-gameplay-source-'));
 try{
  for(const directory of ['.git','Data/s/disabled','EraPlugins'])fs.mkdirSync(path.join(root,directory),{recursive:true});
  fs.writeFileSync(path.join(root,'.git/config'),'private checkout metadata');
  fs.writeFileSync(path.join(root,'._Data'),'macOS metadata');
  fs.writeFileSync(path.join(root,'Data/s/active.erm'),'!?FU(OnNewDay);\n!!VRv1:S1;');
  fs.writeFileSync(path.join(root,'Data/s/disabled/old.erm'),'!?FU(OnNewDay);\n!!VRv1:S2;');
  const plugin=Buffer.from([0,255,8,0]);fs.writeFileSync(path.join(root,'EraPlugins/behavior.era'),plugin);
  const pack=inventoryPack(root,{id:'example',directory:'Example',standalone:true});
  assert.equal(pack.files.length,3);
  assert.equal(pack.files.find(file=>file.file==='Data/s/active.erm').erm.triggers,1);
  assert.equal(pack.files.find(file=>file.file==='Data/s/disabled/old.erm').inactiveDirectory,true);
  const native=pack.files.find(file=>file.file.endsWith('.era'));
  assert.equal(native.requiresNativeReplacement,true);assert.equal(native.sha256,sha256(plugin));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('all six upstream source packs are locked and Reborn has no missing-source blocker',()=>{
 const inventory=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/reference-lock.json','utf8'));
 assert.equal(inventory.packs.length,6);
 assert.equal(inventory.reborn.commit,'a6ba42b24482a188775e4e4867ffe700dc59c85c');
 assert.equal(inventory.reborn.status,'official-source-locked');
 for(const pack of inventory.packs){
  assert.equal(sha256(JSON.stringify(pack.files)),pack.sha256);
  assert(pack.files.every(file=>!file.file.split('/').includes('.git')));
 }
 const profile=profileAdmission('reborn',inventory);
 assert.equal(profile.enabled,false);
 assert(profile.blockers.every(blocker=>blocker.reason==='native-system-not-validated'));
});
