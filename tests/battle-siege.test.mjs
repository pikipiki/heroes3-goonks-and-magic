import {test} from 'node:test';
import assert from 'node:assert/strict';
import {siegeTargets,paintVerticalFortifications} from '../web/battle-siege.mjs';
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
