import test from 'node:test';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync}from'node:child_process';
test('Original fire destination delays, daily progression, reload and infection boundaries',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-fire-'));
 try{const binary=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/EraCampaignFire.test.cpp','-o',binary]);execFileSync(binary);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

import assert from 'node:assert/strict';import zlib from 'node:zlib';import {readDefFrame}from '../scripts/era-bridge/def-frame.mjs';import {fireArt,fireDef}from '../scripts/era-bridge/campaigns/generate-fire-art.mjs';
test('Delivered fire images select the native right-indexed tile in every original frame',()=>{
 const bytes=fs.readFileSync(fireDef);
 for(let phase=0;phase<6;phase++)for(let frame=0;frame<4;frame++){
  const source=readDefFrame(bytes,frame),png=fs.readFileSync(`${fireArt}/phase${phase}-${frame}.png`);assert.equal(png.readUInt32BE(16),32);assert.equal(png.readUInt32BE(20),32);
  const idat=[];for(let at=8;at<png.length;){const n=png.readUInt32BE(at),kind=png.toString('ascii',at+4,at+8);if(kind==='IDAT')idat.push(png.subarray(at+8,at+8+n));at+=n+12;}
  const scan=zlib.inflateSync(Buffer.concat(idat)),tile=phase===5?0:phase;
  for(let y=0;y<32;y++){assert.equal(scan[y*129],0);assert.deepEqual(scan.subarray(y*129+1,(y+1)*129),source.rgba.subarray((y*192+160-tile*32)*4,(y*192+192-tile*32)*4));}
 }
});
