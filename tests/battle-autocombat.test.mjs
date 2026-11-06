import test from 'node:test';import assert from 'node:assert/strict';
import{createBattleAutocombat}from'../web/battle-autocombat.mjs';
function fixture(){let now=0;const calls=[],changes=[],errors=[],controller=createBattleAutocombat({command:(...a)=>calls.push(a),onChange:x=>changes.push(x),onError:x=>errors.push(x),clock:()=>now});const state={mode:'battle',round:1,canAutoCombat:true,autoCombat:false};return{controller,state,calls,changes,errors,time:v=>now=v};}
test('A single press survives a native transition and retries the same desired state until acknowledged',()=>{const f=fixture();assert(f.controller.request(f.state,true));assert(!f.controller.request(f.state,true));f.time(600);f.controller.update({...f.state,canAutoCombat:false});assert(f.controller.pending);assert.deepEqual(f.calls,[[44,1]]);f.time(900);f.controller.update(f.state);assert.deepEqual(f.calls,[[44,1],[44,1]]);f.controller.update({...f.state,autoCombat:true});assert.equal(f.controller.pending,null);f.time(2000);f.controller.update(f.state);assert.equal(f.calls.length,2);assert.deepEqual(f.changes,[true,null]);});
test('Stopping autocombat is also idempotent and survives temporarily unavailable controls',()=>{const f=fixture(),state={...f.state,autoCombat:true};f.controller.request(state,false);f.time(700);f.controller.update({...state,canAutoCombat:false});assert.equal(f.controller.pending.enabled,false);f.controller.update(state);assert.deepEqual(f.calls,[[44,0],[44,0]]);f.controller.update(f.state);assert.equal(f.controller.pending,null);});
test('A stuck request times out, releases the button and never retries in another window or battle',()=>{for(const state of[{mode:'dialog'}, {mode:'map'},{mode:'battle',round:0}]){const f=fixture();f.controller.request(f.state,true);f.time(600);f.controller.update({...f.state,...state});assert.equal(f.controller.pending,null);assert.equal(f.calls.length,1);}const f=fixture();f.controller.request(f.state,true);f.time(8000);f.controller.update(f.state);assert.equal(f.controller.pending,null);assert.equal(f.errors.length,1);assert.equal(f.calls.length,1);});

test('An intro tap queues autocombat until the first playable stack', () => {
 const f = fixture();
 const intro = {...f.state, round: 0, canAutoCombat: false, canQueueAutoCombat: true};
 assert(f.controller.request(intro, true));
 assert(!f.controller.request(intro, true));
 f.time(600);
 f.controller.update({...intro, round: 1, canQueueAutoCombat: false});
 assert.deepEqual(f.calls, []);
 f.controller.update(f.state);
 assert.deepEqual(f.calls, [[44, 1]]);
 f.controller.update({...f.state, autoCombat: true});
 assert.equal(f.controller.pending, null);
});
