import{test}from'node:test';import assert from'node:assert/strict';
import{createAssetBlockCache}from'../web/lazy-assets.mjs';
function fixture(size=513){const data=Uint8Array.from({length:size},(_,i)=>i%256),file={size,slice:(a,b)=>data.slice(a,b)};let reads=0;const cache=createAssetBlockCache({maxBytes:128,blockBytes:64,read:part=>{reads++;return part;}});return{data,file,cache,reads:()=>reads};}
test('Random and unaligned archive reads are byte exact across blocks and EOF',()=>{
 const{data,file,cache}=fixture();
 for(const[position,length]of[[0,12],[59,139],[200,255],[509,30],[513,12],[900,20],[0,0]]){const out=new Uint8Array(length+10).fill(7),n=cache.read(file,out,5,length,position);assert.equal(n,Math.max(0,Math.min(length,data.length-position)));assert.deepEqual(out.subarray(5,5+n),data.subarray(position,position+n));assert.equal(out[0],7);assert.equal(out[5+n],7);}
 assert(cache.stats.peakBytes<=128);
});
test('LRU reuses hot blocks, evicts cold blocks, and never caches the whole archive',()=>{
 const{file,cache,reads}=fixture(1024);const out=new Uint8Array(64);const at=p=>cache.read(file,out,0,64,p);
 at(0);at(64);at(0);assert.equal(reads(),2);at(128);at(0);assert.equal(reads(),3);at(64);assert.equal(reads(),4);
 for(let p=0;p<1024;p+=64)at(p);assert.equal(cache.stats.residentBytes,128);assert.equal(cache.stats.peakBytes,128);
});
test('Two files never share cached blocks and each final partial block has its real length',()=>{
 const{file,cache}=fixture(65),second={size:65,slice:(a,b)=>new Uint8Array(b-a).fill(99)},out=new Uint8Array(4);
 assert.equal(cache.read(file,out,0,4,64),1);assert.equal(out[0],64);assert.equal(cache.read(second,out,0,4,64),1);assert.equal(out[0],99);
});
test('Prefetched file arrayBuffer satisfies reads with zero synchronous block reads',async()=>{
 const data=new Uint8Array([10,20,30,40,50]);
 let reads=0;
 const file={size:5,arrayBuffer:async()=>data.buffer,slice:(a,b)=>{reads++;return data.slice(a,b);}};
 const cache=createAssetBlockCache({maxBytes:128,blockBytes:64,read:p=>{reads++;return p;}});
 await cache.prefetch(file);
 const out=new Uint8Array(5);
 const n=cache.read(file,out,0,5,0);
 assert.equal(n,5);
 assert.deepEqual(out,data);
 assert.equal(reads,0);
});

test('Prefetched complete files share the bounded LRU with ordinary blocks',async()=>{
 let reads=0;const file=value=>({size:64,arrayBuffer:async()=>new Uint8Array(64).fill(value).buffer,slice:(a,b)=>new Uint8Array(b-a).fill(value)}),[a,b,c]=[file(11),file(22),file(33)];
 const cache=createAssetBlockCache({maxBytes:128,blockBytes:16,read:p=>{reads++;return p;}}),out=new Uint8Array(64);
 await cache.prefetch(a);await cache.prefetch(b);assert.equal(cache.stats.residentBytes,128);
 await cache.prefetch(c);assert(cache.stats.peakBytes<=128);cache.read(b,out,0,64,0);assert.equal(reads,0);assert(out.every(v=>v===22));
 cache.read(a,out,0,64,0);assert.equal(reads,1,'The evicted whole file is read again');assert(out.every(v=>v===11));assert(cache.stats.residentBytes<=128);
});
test('Whole files cached by large synchronous reads are accounted and evicted',()=>{
 let reads=0;const file=value=>({size:96,slice:(a,b)=>new Uint8Array(b-a).fill(value)}),a=file(4),b=file(5),out=new Uint8Array(96),cache=createAssetBlockCache({maxBytes:128,blockBytes:16,read:p=>{reads++;return p;}});
 cache.read(a,out,0,96,0);assert.equal(cache.stats.residentBytes,96);cache.read(b,out,0,96,0);cache.read(a,out,0,96,0);assert.equal(reads,3);assert(out.every(v=>v===4));assert(cache.stats.peakBytes<=128);
});
test('Oversized prefetches allocate no complete file buffer and duplicate requests coalesce',async()=>{
 let loads=0;const cache=createAssetBlockCache({maxBytes:128,blockBytes:16,read:p=>p});
 await cache.prefetch({size:129,arrayBuffer:async()=>{loads++;return new ArrayBuffer(129);}});assert.equal(loads,0);
 const file={size:64,arrayBuffer:async()=>{loads++;await new Promise(r=>setTimeout(r,5));return new ArrayBuffer(64);}};
 await Promise.all([cache.prefetch(file),cache.prefetch(file)]);assert.equal(loads,1);assert.equal(cache.stats.residentBytes,64);
});

test('Distinct audio prefetches do not allocate several complete buffers concurrently',async()=>{
 let active=0,peak=0;const cache=createAssetBlockCache({maxBytes:128,blockBytes:16,read:p=>p});
 const files=Array.from({length:4},()=>({size:64,arrayBuffer:async()=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,5));active--;return new ArrayBuffer(64);}}));
 await Promise.all(files.map(f=>cache.prefetch(f)));assert.equal(peak,1);assert(cache.stats.peakBytes<=128);
});
