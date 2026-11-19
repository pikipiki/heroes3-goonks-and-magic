/** Bounded, read-only JsonNode subtree reader for native validation saves.
 * External interned strings stay opaque; this is not a full save decoder. */
import assert from 'node:assert/strict';
export function nativeJsonSubtree(bytes,name){
 const b=Buffer.from(bytes),word=Buffer.from(name),start=b.indexOf(word);
 assert(start>0&&b[start-1]===word.length,'Unique literal native JSON root');
 assert.equal(b.indexOf(word,start+word.length),-1,'Ambiguous native JSON root');
 let cursor=start+word.length,nodes=0;
 const byte=()=>{assert(cursor<b.length);return b[cursor++];};
 const integer=()=>{let value=0n,shift=0n;for(let i=0;i<10;++i){const x=byte();if(x&128){value|=BigInt(x&127)<<shift;shift+=7n;}else{value|=BigInt(x&63)<<shift;const result=(x&64)?-value:value;assert(result>=BigInt(Number.MIN_SAFE_INTEGER)&&result<=BigInt(Number.MAX_SAFE_INTEGER));return Number(result);}}throw Error('Malformed native integer');};
 const string=()=>{const length=integer();if(length<0)return{externalStringReference:-length-1};assert(length<=1e6&&cursor+length<=b.length);const result=b.subarray(cursor,cursor+length).toString('utf8');cursor+=length;return result;};
 const size=()=>{const n=integer();assert(n>=0&&n<=4096);return n;};
 const node=(depth=0)=>{
  assert(depth<30&&++nodes<10000);const scope=string(),override=byte();assert(override===0||override===1);
  const type=integer();let value;
  switch(type){
   case 0:value=null;break;
   case 1:{const x=byte();assert(x===0||x===1);value=!!x;break;}
   case 2:assert(cursor+8<=b.length);value=b.readDoubleLE(cursor);cursor+=8;break;
   case 3:value=string();break;
   case 4:value=Array.from({length:size()},()=>node(depth+1));break;
   case 5:value=Array.from({length:size()},()=>({key:string(),node:node(depth+1)}));break;
   case 6:value=integer();break;
   default:throw Error('Unknown native JsonNode variant '+type);
  }
  return{scope,override:!!override,type,value};
 };
 const result=node();return{node:result,offset:start,end:cursor,nodes};
}
export function nativeJsonField(node,name){assert.equal(node.type,5);const rows=node.value.filter(row=>row.key===name);assert.equal(rows.length,1,'Native JSON field '+name);return rows[0].node;}
export function nativeBannerRecords(bytes){
 const root=nativeJsonSubtree(bytes,'mapRules');const guards=nativeJsonField(root.node,'bannerGuards');assert.equal(guards.type,5);
 return guards.value.map(({key,node})=>{
  assert.equal(node.type,5);assert.equal(node.value.length,3);
  const values=node.value.map(row=>row.node);assert.deepEqual(values.map(n=>n.type),[6,3,1]);
  return{id:key,count:values[0].value,creature:values[1].value,enabled:values[2].value};
 });
}
