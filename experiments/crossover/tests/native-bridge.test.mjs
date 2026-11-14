import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installNativeBridge} from '../public/native-bridge.js';
import {StarCraftObserver} from '../public/bridge.js';
// Contract fixture only. This is NOT an OpenBW simulation.
function fixture(){
  const target=new EventTarget(),memory=new WebAssembly.Memory({initial:1});
  const messages=[];
  const exports={openbw_frame:()=>24,openbw_checksum:()=>123456,openbw_outcome:()=>0,
    openbw_in_ptr:()=>64,openbw_post_message:n=>messages.push(new TextDecoder().decode(new Uint8Array(memory.buffer,64,n)))};
  return {target,memory,exports,messages};
}
test('Heroes observation reaches native post_message and correlates its native sample',()=>{
  const f=fixture(),events=[];
  f.target.addEventListener('openbw-state',e=>events.push(e.detail));
  const api=installNativeBridge(f.exports,f.memory,f.target);
  try{
    const observer=new StarCraftObserver();observer.attach(f.target);
    const sample=observer.forwardHeroes({version:1,session:'session-1',sequence:1,mode:'battle'});
    assert.deepEqual(sample,{frame:24,checksum:123456,outcome:0});
    assert.deepEqual(f.messages,['Heroes: battle (#1)']);
    assert.equal(events.at(-1).kind,'heroes.received');
    assert.equal(events.at(-1).heroesSequence,1);
    assert.equal(events.at(-1).session,'session-1');
    assert.equal(observer.status().native.frame,24);
    observer.dispose();
    assert.equal(observer.status().state,'waiting');
  }finally{api.close();}
});
test('duplicates, stale sessions and malformed messages never call the native export',()=>{
  const f=fixture(),api=installNativeBridge(f.exports,f.memory,f.target);
  const event={version:1,session:'session-1',sequence:4,mode:'map'};
  try{
    api.receiveHeroes(event);
    for(const bad of [null,{}, {...event,version:2},{...event,sequence:3},{...event,session:'old-session'},{...event,sequence:5,mode:'bad\nmessage'}]){
      assert.throws(()=>api.receiveHeroes(bad));
    }
    assert.equal(f.messages.length,1);
    api.close();api.close();
    assert.throws(()=>api.sample(),/fermé/);
    assert.equal(f.target.openbwCrossover,undefined);
  }finally{api.close();}
});
test('replacing a bridge closes the previous lifetime and removes stale handlers',()=>{
  const f=fixture(),old=installNativeBridge(f.exports,f.memory,f.target);
  const current=installNativeBridge(f.exports,f.memory,f.target);
  try{assert.throws(()=>old.sample(),/fermé/);assert.deepEqual(current.sample(),{frame:24,checksum:123456,outcome:0});}
  finally{current.close();}
});
test('native census returns typed copied data and rejects malformed native records',()=>{
  const f=fixture();
  let state={frame:24,view:{x:0,y:0,width:800,height:600},units:[{id:1,type:7,owner:0,completed:true,hp:60,x:320,y:240}]};
  f.exports.openbw_crossover_census=()=>{
    const bytes=new TextEncoder().encode(JSON.stringify(state)+'\0');new Uint8Array(f.memory.buffer,256,bytes.length).set(bytes);return 256;
  };
  const api=installNativeBridge(f.exports,f.memory,f.target);
  try{
    const snapshot=api.census();assert.deepEqual(snapshot,state);
    snapshot.units[0].hp=0;assert.equal(api.census().units[0].hp,60);
    const original=state;
    state={...state,units:[{...state.units[0],id:2}]};
    assert.deepEqual(api.sample().cohort,{initial:1,present:0,missing:1,missingIds:[1]},'A newly created unit does not conceal an initial loss');
    state=original;
    state={...state,units:[{...state.units[0],owner:9}]};assert.throws(()=>api.census(),/invalide/);
    state={...original,view:{width:800,height:600}};assert.throws(()=>api.census(),/invalide/);
    state=null;assert.throws(()=>api.census(),/invalide/);
  }finally{api.close();}
});
