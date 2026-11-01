import {test} from 'node:test';
import assert from 'node:assert/strict';
import {battleSpriteOcclusion,paintBattleFloor} from '../web/battle-floor.mjs';
test('Native sprite bounds protect large bodies and corpses, including the final position of a moving stack',()=>{
 const boxes=battleSpriteOcclusion([{stackId:1,x:500,y:280}],[{stackId:1,x:180,y:150,w:160,h:130,renderX:300,renderY:280},{stackId:9,x:400,y:300,w:180,h:65}]);
 assert.deepEqual(boxes[0],{left:160,right:360,top:130,bottom:300});
 assert.deepEqual(boxes[1],{left:360,right:560,top:130,bottom:300});
 assert.deepEqual(boxes[2],{left:380,right:600,top:280,bottom:385});
});
test('No tactical grid is painted during movement, attacks, autoplay, or before native bounds are ready',()=>{
 for(const next of [{canAct:false},{autoCombat:true},{battleCamera:{active:true}}])assert.equal(paintBattleFloor({}, {canAct:true,...next},{},[{x:0,y:0,w:100,h:100}]),false);
 assert.equal(paintBattleFloor({}, {canAct:true},{},[]),false);
});
