import {test} from 'node:test';
import assert from 'node:assert/strict';
import {battleGuidance,paintActiveCreature} from '../web/battle-guidance.mjs';
import {paintMovementRange} from '../web/battle-scene.mjs';
const actor={stackId:0,id:1,name:'Picpique',count:10,x:102,y:196,occupied:[35,36],enemy:false};
const state={mode:'battle',activeStack:0,canAct:true,round:0,tacticsMode:true,canEndTactics:true,battleUnits:[actor,{stackId:2,id:1,occupied:[40],enemy:false},{stackId:3,occupied:[44],enemy:true}],battleCells:[{hex:35,kind:1,reachable:true},{hex:36,kind:1,reachable:true},{hex:37,kind:0,reachable:true},{hex:38,kind:0,reachable:false},{hex:39,kind:2,reachable:false},{hex:40,kind:1,reachable:true},{hex:41,kind:4,reachable:true},{hex:44,kind:1,reachable:false}]};
test('Initial placement exposes the actor and native legal destinations without a chosen square',()=>{const g=battleGuidance(state);assert.equal(g.actor,actor);assert.equal(g.label,'À placer');assert.equal(g.ready,true);assert.deepEqual(g.cells.map(c=>c.hex),[37,41]);});
test('First combat turn and a new stack of the same creature get their own guidance',()=>{const second={...actor,stackId:2,x:234,y:280,occupied:[40]};const g=battleGuidance({...state,tacticsMode:false,round:1,activeStack:2,battleUnits:[actor,second]});assert.equal(g.actor,second);assert.equal(g.label,'À jouer');assert(g.cells.length>0);});
test('No movement is advertised for enemy turns, animations, or pending placement validation',()=>{for(const next of [{activeStack:undefined},{activeStack:3},{canAct:false},{canEndTactics:false},{tacticsMode:false,round:0}]){const g=battleGuidance({...state,...next});assert.equal(g.ready,false);assert.deepEqual(g.cells,[]);}});
test('Guidance paints legal gates and a gold actor marker while protecting creature bodies',()=>{let fills=0,labels=[],rings=0,badge;const ctx={save(){},restore(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},fill(){fills++;},stroke(){},ellipse(){rings++;},fillRect(x,y,w,h){badge={x,y,w,h};},strokeRect(){},measureText(){return{width:48};},fillText(text){labels.push(text);}};const layout={x:0,y:0,w:800,h:555,dx:0,dy:0,scale:1};paintMovementRange(ctx,[{x:102,y:180,kind:0,reachable:true},{x:300,y:280,kind:4,reachable:true},{x:350,y:280,reachable:false}],layout,[actor]);assert.equal(fills,1);paintActiveCreature(ctx,battleGuidance(state),layout);assert.equal(rings,1);assert.deepEqual(labels,['À placer']);assert(badge.x>=actor.x+44||badge.x+badge.w<=actor.x-44,'Badge must sit beside the active body');assert(badge.y>actor.y-88&&badge.y<actor.y,'Badge must identify this row, not the creature above');paintActiveCreature(ctx,battleGuidance({...state,canAct:false}),layout);assert.equal(rings,1);});

test('Shot guidance follows native legality and disappears outside manual attack selection',()=>{
 const legal={stackId:3,enemy:true,canShootAt:true};
 const blocked={stackId:4,enemy:true,canShootAt:false};
 const ally={stackId:5,enemy:false,canShootAt:true};
 const combat={...state,tacticsMode:false,round:1,battleUnits:[actor,legal,blocked,ally]};
 assert.deepEqual(battleGuidance(combat).shotTargets,[legal]);
 for(const next of [{spellTargeting:true},{autoCombat:true},{manualControl:false},{canAct:false},{tacticsMode:true},{activeStack:3}]){
  assert.deepEqual(battleGuidance({...combat,...next}).shotTargets,[]);
 }
});
