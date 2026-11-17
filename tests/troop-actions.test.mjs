import test from 'node:test';import assert from 'node:assert/strict';import {troopActionCapabilities} from '../web/troop-actions.mjs';
const unit={id:1,name:'Pikemen',count:4};
const state={mode:'hero',turn:true,heroWindow:{owned:true},armies:[{id:8,needsLastStack:true,slots:[unit,null,null,null,null,null,null]}]};
test('The only stack cannot be dismissed; another stack or a garrison allows dismissal',()=>{
 assert.equal(troopActionCapabilities(state,8,0).dismiss,false);
 assert.equal(troopActionCapabilities({...state,armies:[{...state.armies[0],slots:[unit,{...unit,id:2}]}]},8,0).dismiss,true);
 assert.equal(troopActionCapabilities({...state,armies:[{...state.armies[0],needsLastStack:false}]},8,0).dismiss,true);
});
test('Native creature restrictions, ownership and turn restrictions remain authoritative',()=>{
 for(const next of [{...state,turn:false},{...state,heroWindow:{owned:false}},{...state,armies:[{id:8,slots:[{...unit,canDismiss:false}],needsLastStack:false}]}])assert.equal(troopActionCapabilities(next,8,0).dismiss,false);
 assert.equal(troopActionCapabilities(state,8,6).dismiss,false);
});
test('Leaving requires a valid quantity and a free adjacent tile for the selected hero',()=>{
 const deploy={heroId:8,troops:[{slot:0,maximum:3}],targets:[{available:true}]};
 assert.equal(troopActionCapabilities({...state,troopDeployment:deploy},8,0).leave,true);
 for(const patch of [{heroId:9},{troops:[{slot:0,maximum:0}]},{targets:[{available:false}]}])assert.equal(troopActionCapabilities({...state,troopDeployment:{...deploy,...patch}},8,0).leave,false);
});
