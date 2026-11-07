import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTemporaryAssetReader} from '../web/temporary-assets.mjs';

test('Temporary reads resolve packed and split files across offsets and EOF',()=>{
 const calls=[];
 const sources={
  pack:Uint8Array.of(91,92,1,128,255,7,8),
  first:Uint8Array.of(11,12,13),
  last:Uint8Array.of(14,15),
 };
 const read=createTemporaryAssetReader({read:(url,size)=>{
  calls.push(url);
  assert.equal(size,sources[url].length);
  return sources[url];
 }});
 const out=new Uint8Array(8).fill(99);
 const packed={size:3,chunks:[{offset:0,size:3,url:'pack',packOffset:2,packSize:7}]};
 const sibling={size:2,chunks:[{offset:0,size:2,url:'pack',packOffset:5,packSize:7}]};
 const split={size:5,chunks:[{offset:0,size:3,url:'first'},{offset:3,size:2,url:'last'}]};
 assert.equal(read(packed,out,1,5,0),3);
 assert.deepEqual([...out],[99,1,128,255,99,99,99,99]);
 assert.equal(read(sibling,out,0,2,0),2);
 assert.deepEqual(calls,['pack']);
 assert.equal(read(split,out,2,7,1),4);
 assert.deepEqual([...out],[7,8,12,13,14,15,99,99]);
 assert.equal(read(split,out,0,1,5),0);
});

test('Temporary transport evicts old payloads and skips caching oversized ones',()=>{
 const calls=[];
 const read=createTemporaryAssetReader({maxBytes:4,read:(url,size)=>{
  calls.push(url);
  return new Uint8Array(size);
 }});
 const at=(url,size=2)=>read({url,size,chunks:[{offset:0,size}]},new Uint8Array(1),0,1,0);
 for(const name of ['a','b','a','c','a','b'])at(name);
 at('big',5);at('big',5);
 assert.deepEqual(calls,['a','b','c','b','big','big']);
});

test('Temporary reads reject truncated transports and gaps',()=>{
 const read=createTemporaryAssetReader({read:()=>Uint8Array.of(1)});
 const out=new Uint8Array(2);
 assert.throws(()=>read({url:'file',size:2,chunks:[{offset:0,size:2}]},out,0,2,0),/incomplet/);
 assert.throws(()=>read({size:2,chunks:[{offset:1,size:1,url:'part'}]},out,0,2,0),/incomplète/);
});

test('Sparse archive reads request aligned blocks and reuse overlapping reads',()=>{
 const payload=Uint8Array.of(10,11,12,13,14,15,16,17,18);
 const calls=[];
 const read=createTemporaryAssetReader({blockBytes:4,read:(url,size,start,end)=>{
  calls.push([url,size,start,end]);
  return payload.subarray(start,end);
 }});
 const file={path:'Data/H3bitmap.lod',size:9,chunks:[{offset:0,size:9,url:'archive'}]};
 const output=new Uint8Array(5);
 assert.equal(read(file,output,0,5,3),5);
 assert.deepEqual([...output],[13,14,15,16,17]);
 assert.equal(read(file,output,1,2,7),2);
 assert.deepEqual([...output],[13,17,18,16,17]);
 assert.deepEqual(calls,[['archive',9,0,4],['archive',9,4,8],['archive',9,8,9]]);
});

test('An archive host that ignores Range only transfers the full source once',()=>{
 let calls=0;
 const read=createTemporaryAssetReader({blockBytes:4,read:()=>{
  calls++;
  return Uint8Array.of(10,11,12,13,14,15,16,17);
 }});
 const file={path:'Data/Heroes3.snd',size:8,chunks:[{offset:0,size:8,url:'archive'}]};
 const output=new Uint8Array(5);
 assert.equal(read(file,output,0,5,3),5);
 assert.deepEqual([...output],[13,14,15,16,17]);
 assert.equal(calls,1);
});
