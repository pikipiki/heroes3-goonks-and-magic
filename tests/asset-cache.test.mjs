import {test} from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {syncAssets,ROOT} from '../web/asset-cache.mjs';
const digest=async x=>crypto.createHash('sha256').update(x).digest('hex');
async function fixture(){const data=Buffer.from('abcdefgh'),chunks=[];for(let offset=0;offset<data.length;offset+=4)chunks.push({offset,size:4,hash:await digest(data.subarray(offset,offset+4))});const file={path:'Data/h3sprite.lod',size:8,hash:await digest(data),url:'/data/hash/file',chunks};let index='',network=0;const entries={},writes=[];const storage={getItem:()=>index,setItem:(_,v)=>index=v};const opfs={list:async()=>entries,write:async(_,p,o,b,size)=>{writes.push([p,o,b.length]);entries[ROOT+'/'+p]={length:size};},flush:async()=>{}};const fetcher=async(_,options)=>{network++;const [,a,b]=options.headers.Range.match(/bytes=(\d+)-(\d+)/);return new Response(data.subarray(+a,+b+1),{status:206});};return {file,manifest:{files:[file]},storage,opfs,fetcher,digest,writes,entries,network:()=>network};}
test('A cold install verifies chunks; a warm launch makes zero asset requests',async()=>{const f=await fixture();assert.equal((await syncAssets(f)).downloaded,8);assert.equal(f.network(),2);assert.equal((await syncAssets(f)).reused,1);assert.equal(f.network(),2);delete f.entries[ROOT+'/'+f.file.path];assert.equal((await syncAssets(f)).downloaded,8);});
test('An unchanged warm cache is not flushed, but obsolete files are still removed',async()=>{
 const f=await fixture(),removed=[];
 let flushes=0;f.opfs.flush=async()=>{flushes++;};
 f.opfs.unlink=async(_,path)=>removed.push(path);
 await syncAssets(f);flushes=0;
 await syncAssets(f);assert.equal(flushes,0);
 const prior=JSON.parse(f.storage.getItem());prior['Mods/old/file']={size:0,hash:'old'};f.storage.setItem('',JSON.stringify(prior));
 await syncAssets(f);assert.deepEqual(removed,['Mods/old/file']);assert(flushes>0);
});
test('Changed versions update only changed files',async()=>{const f=await fixture();await syncAssets(f);f.file.hash='new-version';await syncAssets(f);assert.equal(f.network(),4);});
test('Corrupt and interrupted downloads never validate an incomplete file',async()=>{const f=await fixture();await assert.rejects(syncAssets({...f,fetcher:async()=>new Response('xxxx',{status:206})}),/altérées/);assert.equal(f.writes.length,0);let call=0;await assert.rejects(syncAssets({...f,fetcher:async(...args)=>{if(++call===2)throw Error('offline');return f.fetcher(...args);}}),/offline/);assert.equal((await syncAssets(f)).downloaded,8);});
test('A server without range support downloads a large file once',async()=>{const f=await fixture();let calls=0;await syncAssets({...f,fetcher:async()=>{calls++;return new Response('abcdefgh');}});assert.equal(calls,1);assert.deepEqual(f.writes.map(x=>x[1]),[0,4]);});
test('Manifest paths cannot overwrite saves or escape the game root',async()=>{const f=await fixture();for(const path of ['Saves/test.vsgm1','Mods/../../save','/Data/file'])await assert.rejects(syncAssets({...f,manifest:{files:[{...f.file,path}]}}),/Chemin/);});
test('Transferred OPFS buffers retain accurate download accounting',async()=>{const f=await fixture(),write=f.opfs.write;f.opfs.write=async(root,path,offset,bytes,size)=>{await write(root,path,offset,bytes,size);structuredClone(bytes.buffer,{transfer:[bytes.buffer]});};assert.equal((await syncAssets(f)).downloaded,8);assert.equal((await syncAssets(f)).reused,1);});
test('Separate chunk URLs reassemble the original file without Range requests',async()=>{const f=await fixture();delete f.file.url;f.file.chunks.forEach((chunk,i)=>chunk.url='/chunks/'+i);const calls=[];const result=await syncAssets({...f,fetcher:async(url,options)=>{calls.push([url,options.headers]);const i=Number(url.split('/').at(-1));return new Response('abcdefgh'.slice(i*4,i*4+4));}});assert.equal(result.downloaded,8);assert.deepEqual(calls,[['/chunks/0',{}],['/chunks/1',{}]]);assert.deepEqual(f.writes.map(x=>x[1]),[0,4]);});

test('Downloads overlap with a bounded queue and report streamed per-file progress',async()=>{
 const data=Buffer.from('abcdefgh'),hash=await digest(data),files=Array.from({length:20},(_,i)=>({path:'Mods/test/'+i,size:8,hash,url:'/files/'+i,chunks:[{offset:0,size:8,hash}]}));
 let inFlight=0,peak=0;const events=[];const fetcher=async()=>{inFlight++;peak=Math.max(peak,inFlight);return new Response(new ReadableStream({async start(c){c.enqueue(data.subarray(0,4));await new Promise(r=>setTimeout(r,8));c.enqueue(data.subarray(4));c.close();inFlight--;}}));};
 const result=await syncAssets({manifest:{files},opfs:{list:async()=>({}),write:async()=>{},flush:async()=>{}},storage:{getItem:()=>null,setItem:()=>{}},fetcher,digest,onProgress:p=>events.push(p)});
 assert.equal(peak,8);assert.equal(result.downloaded,160);assert(events.some(p=>p.active.some(f=>f.loaded===4&&f.size===8)));assert(events.some(p=>p.speed>0&&p.active.some(f=>f.speed>0)));assert(events.slice(0,-1).every(p=>p.percent<100));assert.equal(events.at(-1).percent,100);assert.equal(events.at(-1).remaining,0);assert.equal(events.at(-1).loaded,160);
});
test('A failed concurrent install preserves completed files without validating interrupted ones',async()=>{
 const data=Buffer.from('okay'),hash=await digest(data);let index='',calls=[];const entries={},files=['good','bad','later'].map(name=>({path:'Mods/'+name,size:4,hash,url:'/'+name,chunks:[{offset:0,size:4,hash}]}));let failing=true;
 const args={manifest:{files},concurrency:2,digest,storage:{getItem:()=>index,setItem:(_,v)=>index=v},opfs:{list:async()=>entries,write:async(_,p)=>{entries[ROOT+'/'+p]={length:4};},flush:async()=>{}},fetcher:async url=>{calls.push(url);if(failing&&url==='/bad'){await new Promise(r=>setTimeout(r,10));throw Error('offline');}return new Response(data);}};
 await assert.rejects(syncAssets(args),/offline/);assert(JSON.parse(index)['Mods/good']);assert(!JSON.parse(index)['Mods/bad']);failing=false;calls=[];const result=await syncAssets(args);assert.equal(result.reused,2);assert.deepEqual(calls,['/bad']);
});
