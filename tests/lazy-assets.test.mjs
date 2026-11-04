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
