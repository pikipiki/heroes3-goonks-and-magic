import {test} from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {packSmallAssets} from '../scripts/asset-packs.mjs';import {syncAssets,ROOT} from '../web/asset-cache.mjs';
const digest=async b=>crypto.createHash('sha256').update(b).digest('hex');
test('Small files share a streamed request, retain individual URLs, and round-trip verified bytes',async()=>{
 const contents=new Map(),packs=new Map(),written=new Map(),events=[];const files=[];
 for(let i=0;i<20;i++){const bytes=Buffer.from('file-'+i),hash=await digest(bytes),path='Mods/test/'+i;contents.set(path,bytes);files.push({path,size:bytes.length,hash,url:'/individual/'+i,chunks:[{offset:0,size:bytes.length,hash}]});}
 assert.equal(packSmallAssets(files,f=>contents.get(f.path),(url,bytes)=>packs.set(url,bytes)),1);assert.equal(files[0].url,'/individual/0');let calls=0;
 const result=await syncAssets({manifest:{files},digest,storage:{getItem:()=>null,setItem:()=>{}},opfs:{list:async()=>({}),write:async(_,p,o,b)=>written.set(p,Buffer.from(b)),flush:async()=>{}},onProgress:p=>events.push(p),fetcher:async url=>{calls++;const data=packs.get(url);return new Response(new ReadableStream({async start(c){c.enqueue(data.subarray(0,8));await new Promise(r=>setTimeout(r,10));c.enqueue(data.subarray(8));c.close();}}));}});
 assert.equal(calls,1);for(const [path,bytes] of contents)assert.deepEqual(written.get(path),bytes);assert.equal(result.downloaded,[...contents.values()].reduce((s,b)=>s+b.length,0));assert.equal(events.at(-1).received,result.downloaded);assert(events.some(p=>p.active.some(f=>f.loaded>0&&f.loaded<f.size)));assert.equal(events.at(-1).remaining,0);
});
test('A changed file is validated independently when its pack contains cached neighbours',async()=>{
 const original=Buffer.from('goodbad!'),goodHash=await digest(original.subarray(0,4)),badHash=await digest(Buffer.from('okay'));let index=JSON.stringify({'Mods/good':{hash:goodHash}});
 const files=[{path:'Mods/good',hash:goodHash},{path:'Mods/bad',hash:badHash}].map((f,i)=>({...f,size:4,chunks:[{offset:0,size:4,hash:f.hash,url:'/pack',packOffset:i*4,packSize:8}]}));
 const args={manifest:{files},digest,storage:{getItem:()=>index,setItem:(_,v)=>index=v},opfs:{list:async()=>({[ROOT+'/Mods/good']:{length:4}}),write:async()=>{throw Error('Unverified bytes must not be written');},flush:async()=>{}},fetcher:async()=>new Response(original)};
 await assert.rejects(syncAssets(args),/altérées/);assert(!JSON.parse(index)['Mods/bad']);assert(JSON.parse(index)['Mods/good']);
});
