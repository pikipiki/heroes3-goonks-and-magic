import{test}from'node:test';import assert from'node:assert/strict';
import{createSpellScroll}from'../web/spell-scroll.mjs';
const tick=()=>new Promise(resolve=>queueMicrotask(resolve));
test('all native pages become one ordered scroll list, casting resolves its original page',async()=>{
 const calls=[],scroll=createSpellScroll((...args)=>calls.push(args)),base={inCombat:false,pages:3,school:-1,combatSpells:true};
 const send=page=>scroll.accept({...base,page,spells:[{id:page+10}]},'hero');
 send(0);await tick();assert.deepEqual(calls,[[50,1]]);
 send(0);await tick();assert.equal(calls.length,1,'duplicate snapshots do not turn the page twice');
 send(1);await tick();const book=send(2);await tick();assert.deepEqual(book.spells.map(s=>s.id),[10,11,12]);assert.equal(calls.length,2);
 scroll.choose(book.spells[0],()=>calls.push([49,10]));assert.deepEqual(calls.at(-1),[50,-1]);
 send(1);await tick();assert.deepEqual(calls.at(-1),[50,-1]);send(0);await tick();assert.deepEqual(calls.at(-1),[49,10]);
 const other=scroll.accept({...base,page:0,school:3,spells:[{id:20}]},'hero');assert.deepEqual(other.spells.map(s=>s.id),[20],'school changes clear accumulated spells');
 scroll.reset();
});
test('combat scrolling never sends native page commands',async()=>{
 const calls=[],scroll=createSpellScroll((...args)=>calls.push(args));const book=scroll.accept({inCombat:true,scrollable:true,pages:1,page:0,spells:[{id:1}]},'hero');await tick();assert.deepEqual(calls,[]);scroll.choose(book.spells[0],()=>calls.push([49,1]));assert.deepEqual(calls,[[49,1]]);
});
