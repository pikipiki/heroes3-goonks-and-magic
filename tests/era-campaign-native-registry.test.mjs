import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {buildNativeCampaignRegistry} from '../scripts/era-bridge/campaigns/build-native-registry.mjs';
import {compileCaveFile,extractCaveScripts} from '../scripts/era-bridge/campaigns/importer.mjs';
const folder='mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns';
test('native Cave registry is reproducible, bound to all original scripts and dormant until gameplay validation',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-campaign-registry-'));
 try{
  const registry=buildNativeCampaignRegistry(temp);
  assert.deepEqual(fs.readdirSync(temp).sort(),fs.readdirSync(folder).filter(file=>!['media.json','metadata.json'].includes(file)).sort());
  for(const file of fs.readdirSync(temp))assert.deepEqual(fs.readFileSync(path.join(temp,file)),fs.readFileSync(path.join(folder,file)),file);
  assert.equal(registry.programs.length,1);assert.equal(registry.programs[0].enabled,false);
  const bundle=JSON.parse(fs.readFileSync(path.join(temp,'cave-gerfrex.json'))),expected=compileCaveFile();
  assert.equal(bundle.sha256,expected.sha256);assert.equal(registry.programs[0].programSha256,expected.sha256);
  const scripts=extractCaveScripts(fs.readFileSync('mod/wake-of-gods/Mods/maps/content/maps/Cave of Gerfrex.h3m'));
  assert.equal(scripts.length,22);
  assert.deepEqual(bundle.originalMessages,scripts.map(source=>new TextDecoder(source.encoding).decode(source.bytes)));
  assert.equal(JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/maps/mod.json')).keepDisabled,true);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
