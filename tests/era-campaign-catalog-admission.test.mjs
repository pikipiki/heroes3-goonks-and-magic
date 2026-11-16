import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {buildAdmittedCampaignCatalog} from '../scripts/era-bridge/campaigns/build-admitted-catalog.mjs';
test('active campaign catalogue includes only completely admitted unchanged archives',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-admitted-'));
 try{
  const registry=JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/registry.json'));
  const admitted=['zc1','zc2','zc3'];
  assert.deepEqual(buildAdmittedCampaignCatalog(temp,registry),admitted);
  const set=JSON.parse(fs.readFileSync(temp+'/config/campaignSets.json'));assert.deepEqual(set.wog.items.map(i=>i.file),admitted.map(id=>'Maps/'+id));
  for(const id of admitted)assert.deepEqual(fs.readFileSync(temp+'/maps/'+id+'.vcmp'),fs.readFileSync('mod/wake-of-gods/Mods/maps/content/maps/'+id+'.vcmp'));
  assert.deepEqual(fs.readFileSync(temp+'/config/campaignSets.json'),fs.readFileSync('mod/wake-of-gods/Mods/mapSupport/Content/config/campaignSets.json'));
  for(const [index,id]of admitted.entries()){
   registry.programs.find(p=>p.id===id+'-0').enabled=false;
   const remaining=admitted.slice(index+1);assert.deepEqual(buildAdmittedCampaignCatalog(temp,registry),remaining);assert.deepEqual(fs.readdirSync(temp+'/maps'),remaining.map(id=>id+'.vcmp'));
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(temp+'/config/campaignSets.json')),{});
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
