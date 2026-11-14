import {test} from 'node:test';import assert from 'node:assert/strict';
import {battlePlan,battleResult} from '../public/battle.js';
const initial=()=>({battleId:17,stacks:[{id:0,side:0,count:12,name:'Archers',creature:'core:archer',shooter:true,health:10},{id:1,side:1,count:20,name:'Piquiers',creature:'core:pikeman',shooter:false,health:10}]});
test('actual Heroes quantities and identities survive unit mapping',()=>{const plan=battlePlan(initial());assert.deepEqual(plan.stacks.map(row=>[row.id,row.unit,row.count]),[[0,0,12],[1,37,20]]);assert.throws(()=>battlePlan({...initial(),stacks:[...initial().stacks,{...initial().stacks[0]}]}));assert.throws(()=>battlePlan({...initial(),stacks:initial().stacks.map(row=>({...row,count:129}))}));});
test('accepts only a completed battle with exact original cohort counts',()=>{
 const plan=battlePlan(initial()),state={battleId:17,frame:500,finished:true,groups:[{id:0,side:0,initial:12,survivors:8},{id:1,side:1,initial:20,survivors:0}]};
 assert.deepEqual(battleResult(plan,state),[[0,8],[1,0]]);
 for(const modified of [{...state,battleId:18},{...state,finished:false},{...state,groups:[state.groups[0],state.groups[0]]},{...state,groups:state.groups.map(row=>({...row,survivors:1}))},{...state,groups:state.groups.map(row=>({...row,initial:row.initial+1}))}])assert.throws(()=>battleResult(plan,modified));
});

test('Heroes remain Heroes while the registered Marine is a genuine StarCraft cohort',()=>{const input=initial();input.stacks[1]={...input.stacks[1],creature:'heroes-starcraft:marine',name:'Marines',shooter:true,health:40};const plan=battlePlan(input);assert.equal(plan.stacks[0].heroes,true);assert.equal(plan.stacks[0].creature,'core:archer');assert.equal(plan.stacks[0].health,10);assert.equal(plan.stacks[1].heroes,false);assert.equal(plan.stacks[1].unit,0);});
