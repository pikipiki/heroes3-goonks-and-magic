import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {deduplicateAssetURLs,packSmallAssets} from '../scripts/asset-packs.mjs';
import {syncAssets,ROOT} from '../web/asset-cache.mjs';
import {createTemporaryAssetReader} from '../web/temporary-assets.mjs';
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const entry=(path,bytes)=>({path,size:bytes.length,hash:digest(bytes),url:'./individual/'+path,chunks:[{offset:0,size:bytes.length,hash:digest(bytes)}]});
const namespace=files=>files.map(({path,size,hash})=>({path,size,hash}));

test('canonical transport URLs preserve native paths and MIME extensions',()=>{
 const bytes=Buffer.from('same bytes'),files=['Mods/a/icon.png','Mods/b/icon.PNG','Mods/c/icon.bmp'].map(p=>entry(p,bytes)),before=namespace(files);
 const report=deduplicateAssetURLs(files);assert.equal(report.filesShared,1);assert.equal(files[0].url,files[1].url);assert.notEqual(files[0].url,files[2].url);assert.deepEqual(namespace(files),before);
});

test('small-pack aliases round-trip in both installer and bounded temporary reader',async()=>{
 const contents=new Map(),packs=new Map(),written=new Map(),files=[];
 for(let i=0;i<20;i++){const bytes=Buffer.from('asset-'+i),p='Mods/a/'+i+'.def';contents.set(p,bytes);files.push(entry(p,bytes));}
 for(let i=0;i<5;i++){const p='Mods/b/'+i+'.def',bytes=contents.get('Mods/a/'+i+'.def');contents.set(p,bytes);files.push(entry(p,bytes));}
 const before=namespace(files);deduplicateAssetURLs(files);packSmallAssets(files,f=>contents.get(f.path),(u,b)=>packs.set(u,b),{maxSize:1024});assert.deepEqual(namespace(files),before);
 assert.equal([...packs.values()].reduce((s,b)=>s+b.length,0),[...contents.entries()].filter(([p])=>p.startsWith('Mods/a/')).reduce((s,[p,b])=>s+b.length,0));
 let event;await syncAssets({manifest:{files},digest,storage:{getItem:()=>null,setItem:()=>{}},opfs:{list:async()=>({}),write:async(_,p,o,b)=>written.set(p,Buffer.from(b)),flush:async()=>{}},onProgress:p=>event=p,fetcher:async u=>new Response(packs.get(u))});
 assert.equal(event.received,[...packs.values()].reduce((s,b)=>s+b.length,0));for(const [p,b] of contents)assert.deepEqual(written.get(p),b);
 const reader=createTemporaryAssetReader({maxBytes:1024,read:(u,size,start,end)=>new Uint8Array(packs.get(u).subarray(start,end))});
 for(const file of files){const output=new Uint8Array(file.size);assert.equal(reader(file,output,0,output.length,0),output.length);assert.equal(digest(output),file.hash);}
});

test('an existing installation reuses every native file after transport deduplication',async()=>{
 const bytes=Buffer.alloc(65537,42),files=['Mods/a/x.def','Mods/b/x.def'].map(p=>entry(p,bytes)),index=Object.fromEntries(files.map(f=>[f.path,{hash:f.hash,size:f.size}]));
 deduplicateAssetURLs(files);
 const result=await syncAssets({manifest:{files},storage:{getItem:()=>JSON.stringify(index),setItem:()=>{}},fetcher:async()=>{throw Error('No redownload expected');},opfs:{list:async()=>Object.fromEntries(files.map(f=>[ROOT+'/'+f.path,{length:f.size}])),write:async()=>{throw Error('Existing files must remain untouched');},flush:async()=>{}}});assert.equal(result.reused,2);assert.equal(result.downloaded,0);
});

 test('small-pack deduplication preserves existing groups of neighbouring files',()=>{
 const a=Buffer.from('aaaaaaaa'),b=Buffer.from('bbbbbbbb'),c=Buffer.from('cccccccc'),bytes=[a,b,c,a],files=bytes.map((v,i)=>entry('Mods/test/'+i+'.def',v)),packs=new Map();
 packSmallAssets(files,f=>bytes[Number(f.path.match(/(\d+)\.def$/)[1])],(u,b)=>packs.set(u,b),{maxSize:16});
 assert.equal(packs.size,2);assert.equal(files[0].chunks[0].url,files[1].chunks[0].url);assert.equal(files[2].chunks[0].url,files[3].chunks[0].url);assert.notEqual(files[0].chunks[0].url,files[3].chunks[0].url);
 });
