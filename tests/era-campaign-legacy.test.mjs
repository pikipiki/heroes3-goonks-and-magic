import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import zlib from 'node:zlib';
import {readLegacyCampaign,decodeLegacyCampaign,readGzipMembers,mapLegacyPrerequisites,extractLegacySources} from '../scripts/era-bridge/campaigns/legacy-importer.mjs';
import {readOriginalCampaign} from '../scripts/era-bridge/campaigns/importer.mjs';
const file=n=>`tests/fixtures/wog-campaigns/original358f/${n}.h3c`;
test('original H3C regions retain empty slots before remapping the eleven converted maps',()=>{
 const expected={zc1:[[2],[],[1]],zc2:[[],[0],[1]],zc3:[[]],zc4:[[],[0],[3],[1]]};
 for(const [name,requires]of Object.entries(expected)){
  const legacy=readLegacyCampaign(file(name)),converted=readOriginalCampaign(`mod/wake-of-gods/Mods/maps/content/maps/${name}.vcmp`);
  assert.equal(legacy.header.maskBytes,1);assert.equal(legacy.maps.length,requires.length);
  assert.deepEqual(mapLegacyPrerequisites(legacy,converted.header).map(s=>s.requires),requires);
  if(name==='zc1'){assert.equal(legacy.header.scenarios.length,5);assert.deepEqual(legacy.header.scenarios.filter(s=>!s.map).map(s=>s.physicalIndex),[0,4]);}
  else assert.deepEqual(converted.header.scenarios.map(s=>s.preconditions||[]),requires,'Other campaign graphs were already correct');
 }
});
test('legacy gzip members require their original data, CRC and complete bounded headers',()=>{
 const original=fs.readFileSync(file('zc1'));assert.equal(readGzipMembers(original).length,4);
 const corrupt=Buffer.from(original);corrupt[corrupt.length-8]^=1;assert.throws(()=>decodeLegacyCampaign(corrupt));
 assert.throws(()=>decodeLegacyCampaign(original.subarray(0,-1)));
 assert.throws(()=>decodeLegacyCampaign(Buffer.concat([original,Buffer.from([1])])));
 const reserved=Buffer.from(original);reserved[3]|=128;assert.throws(()=>readGzipMembers(reserved));
 const members=readGzipMembers(original),header=Buffer.from(members[0].bytes);header.writeUInt32LE(0x7fffffff,5);
 assert.throws(()=>decodeLegacyCampaign(Buffer.concat([zlib.gzipSync(header),...members.slice(1).map(m=>zlib.gzipSync(m.bytes))])));
});
test('legacy dependency mapping rejects missing, repeated or void scenario references',()=>{
 const legacy=readLegacyCampaign(file('zc1')),header=readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').header;
 const wrong=structuredClone(header);wrong.scenarios[0].map=wrong.scenarios[1].map;assert.throws(()=>mapLegacyPrerequisites(legacy,wrong));
 const voidDependency={...legacy,maps:legacy.maps.map(s=>({...s}))};voidDependency.maps[0].requires=[0];assert.throws(()=>mapLegacyPrerequisites(voidDependency,header));
});
test('all137 converted campaign sources retain original text after codepage and newline decoding',()=>{
 let total=0;
 for(const name of ['zc1','zc2','zc3','zc4']){
  const legacy=readLegacyCampaign(file(name)),converted=readOriginalCampaign(`mod/wake-of-gods/Mods/maps/content/maps/${name}.vcmp`);
  for(const map of legacy.maps){const target=converted.maps.find(m=>m.member===map.map.toLowerCase().replace('.h3m','.vmap'));assert(target);
   const original=extractLegacySources(map.bytes).map(s=>s.text.replace(/\r\n/g,'\n')).sort(),ported=target.sources.map(s=>s.bytes.toString('utf8').replace(/\r\n/g,'\n')).sort();
   assert.deepEqual(ported,original,map.map);total+=original.length;
  }
 }
 assert.equal(total,137);
});
