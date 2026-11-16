import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {buildAdmittedCampaignCatalog} from '../scripts/era-bridge/campaigns/build-admitted-catalog.mjs';
test('active campaign catalogue includes only completely admitted unchanged archives',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-admitted-'));
 try{
  const registry=JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/registry.json'));
  assert.deepEqual(buildAdmittedCampaignCatalog(temp,registry),['zc1']);
  const set=JSON.parse(fs.readFileSync(temp+'/config/campaignSets.json'));assert.deepEqual(set.wog.items.map(i=>i.file),['Maps/zc1']);
  assert.deepEqual(fs.readFileSync(temp+'/maps/zc1.vcmp'),fs.readFileSync('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp'));
  assert.deepEqual(fs.readFileSync(temp+'/config/campaignSets.json'),fs.readFileSync('mod/wake-of-gods/Mods/mapSupport/Content/config/campaignSets.json'));
  assert.deepEqual(fs.readdirSync(temp+'/maps'),['zc1.vcmp']);
  registry.programs.find(p=>p.id==='zc1-0').enabled=false;
  assert.deepEqual(buildAdmittedCampaignCatalog(temp,registry),[]);assert.deepEqual(fs.readdirSync(temp+'/maps'),[]);
  assert.deepEqual(JSON.parse(fs.readFileSync(temp+'/config/campaignSets.json')),{});
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
