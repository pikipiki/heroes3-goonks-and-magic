import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {buildNativeCampaignRegistry} from '../scripts/era-bridge/campaigns/build-native-registry.mjs';
import {compileCaveFile,extractCaveScripts,readOriginalCampaign} from '../scripts/era-bridge/campaigns/importer.mjs';
const folder='mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns';
test('native original campaign registry is reproducible, bound to all original scripts and dormant until gameplay validation',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-campaign-registry-'));
 try{
  const registry=buildNativeCampaignRegistry(temp);
  assert.deepEqual(fs.readdirSync(temp).sort(),fs.readdirSync(folder).filter(file=>!['media.json','metadata.json','movies.json'].includes(file)).sort());
  for(const file of fs.readdirSync(temp))assert.deepEqual(fs.readFileSync(path.join(temp,file)),fs.readFileSync(path.join(folder,file)),file);
  assert.equal(registry.programs.length,12);assert.deepEqual(registry.programs.filter(entry=>entry.enabled).map(entry=>entry.id),['zc1-0','zc1-1','zc1-2','zc2-0','zc2-1','zc2-2','zc3-0','zc4-0','zc4-1','zc4-2','zc4-3']);assert.equal(registry.programs.find(entry=>entry.id==='cave-gerfrex').enabled,false);
  const bundle=JSON.parse(fs.readFileSync(path.join(temp,'cave-gerfrex.json'))),expected=compileCaveFile();
  assert.equal(bundle.sha256,expected.sha256);assert.equal(registry.programs[0].programSha256,expected.sha256);
  const scripts=extractCaveScripts(fs.readFileSync('mod/wake-of-gods/Mods/maps/content/maps/Cave of Gerfrex.h3m'));
  assert.equal(scripts.length,22);
  assert.deepEqual(bundle.originalMessages,scripts.map(source=>new TextDecoder(source.encoding).decode(source.bytes)));
  for(const id of ['zc1','zc2','zc3','zc4']){
   const original=readOriginalCampaign(`mod/wake-of-gods/Mods/maps/content/maps/${id}.vcmp`);
   for(const [index,map] of original.maps.entries()){
    const entry=registry.programs.find(entry=>entry.id===id+'-'+index),program=JSON.parse(fs.readFileSync(path.join(temp,id+'-'+index+'.json')));
    assert.equal(entry.programSha256,program.sha256);assert.equal(entry.sourceArchiveSha256,original.sha256);assert.equal(entry.scenarioMember,map.member);
    assert.deepEqual(program.originalMessages,map.sources.map(source=>source.bytes.toString('utf8')));
   }
  }
  assert.equal(JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/maps/mod.json')).keepDisabled,true);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
