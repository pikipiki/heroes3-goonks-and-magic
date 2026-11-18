import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const file='web/scenario-previews.json',data=JSON.parse(fs.readFileSync(file));
test('The complete scenario catalogue has compact precomputed previews and an explicit unavailable entry',()=>{
 assert(fs.readFileSync('web/scenario-preview.mjs','utf8').includes("const catalogueRevision='"+createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,16)+"';"),'Catalogue changes must invalidate the preload URL');
 assert.equal(data.schema,2);assert.equal(data.count,357);assert.equal(Object.keys(data.previews).length,357);assert.equal(data.size,128);
 assert.deepEqual(data.unavailable,['MAPS/XL_WARZONE_A']);assert(data.images.length>100);assert(fs.statSync(file).size<2000000);
 for(const [key,ids]of Object.entries(data.previews)){
  assert.equal(key,key.toUpperCase());assert(ids.length<=2);assert(ids.length>0||data.unavailable.includes(key),key);
  for(const id of ids)assert(Number.isInteger(id)&&id>=0&&id<data.images.length,key);
 }
 for(const image of data.images){
  assert(image.startsWith('data:image/png;base64,'));const bytes=Buffer.from(image.split(',')[1],'base64');assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),128);assert.equal(bytes.readUInt32BE(20),128);assert.equal(bytes[25],3,'Lossless indexed PNG palette');
 }
});
