import {test} from 'node:test';
import assert from 'node:assert/strict';
import {siegeTargets,siegePickerTargets,paintVerticalFortifications} from '../web/battle-siege.mjs';
test('wall-capable troops retain creature targets and keep walls out of ally and spell choices',()=>{
 const enemy={key:'core:gnoll',enemy:true},state={activeUnit:{key:'tum-era:eraCreature314'},battleCells:[{hex:12,siegeTarget:true,actionLabel:'Attack'}]};
 assert.deepEqual(siegePickerTargets(state,[enemy]).map(t=>t.siege?'wall':t.key),['core:gnoll','wall']);
 assert.deepEqual(siegePickerTargets({...state,activeUnit:{key:'core:catapult'}},[enemy]).map(t=>t.hex),[12]);
 for(const flags of[{spellTargeting:true},{creatureSpellTargeting:true}])assert.deepEqual(siegePickerTargets({...state,...flags},[enemy]),[enemy]);
 assert.deepEqual(siegePickerTargets(state,[enemy],{allies:true}),[enemy]);
});
test('catapult targets include only wall sections with a native legal attack',()=>{
 const cells=[{hex:12,siegeTarget:true,actionLabel:'Attack'},{hex:62,siegeTarget:true},{hex:94,actionLabel:'Attack'}];
 assert.deepEqual(siegeTargets({battleCells:cells}).map(c=>c.hex),[12]);
});
test('destroyed wall sections leave breaches in the portrait fortification',()=>{
 const drawn=[];const ctx=new Proxy({}, {set:()=>true,get:(_,key)=>(...args)=>drawn.push([key,...args])});
 const cell=(x,state)=>({x,y:0,siegeWall:true,wallPart:2,wallState:state});
 paintVerticalFortifications(ctx,{battleCells:[cell(0,2),cell(30,0),cell(60,2)]},c=>c,1,null,[]);
 assert.equal(drawn.filter(c=>c[0]==='fill').length,0);
 paintVerticalFortifications(ctx,{battleCells:[cell(0,2),cell(30,2)]},c=>c,1,null,[]);
 assert(drawn.some(c=>c[0]==='fill'));
});
