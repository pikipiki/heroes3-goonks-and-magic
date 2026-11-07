import {test} from 'node:test';
import assert from 'node:assert/strict';
import {battleGuidance,paintActiveCreature,paintMeleeTargets} from '../web/battle-guidance.mjs';
import {paintMovementRange} from '../web/battle-scene.mjs';
const actor={stackId:0,id:1,name:'Picpique',count:10,x:102,y:196,occupied:[35,36],enemy:false};
const state={mode:'battle',activeStack:0,canAct:true,round:0,tacticsMode:true,canEndTactics:true,battleUnits:[actor,{stackId:2,id:1,occupied:[40],enemy:false},{stackId:3,occupied:[44],enemy:true}],battleCells:[{hex:35,kind:1,reachable:true},{hex:36,kind:1,reachable:true},{hex:37,kind:0,reachable:true},{hex:38,kind:0,reachable:false},{hex:39,kind:2,reachable:false},{hex:40,kind:1,reachable:true},{hex:41,kind:4,reachable:true},{hex:44,kind:1,reachable:false}]};
test('Initial placement exposes the actor and native legal destinations without a chosen square',()=>{const g=battleGuidance(state);assert.equal(g.actor,actor);assert.equal(g.label,'À placer');assert.equal(g.ready,true);assert.deepEqual(g.cells.map(c=>c.hex),[37,41]);});
test('First combat turn and a new stack of the same creature get their own guidance',()=>{const second={...actor,stackId:2,x:234,y:280,occupied:[40]};const g=battleGuidance({...state,tacticsMode:false,round:1,activeStack:2,battleUnits:[actor,second]});assert.equal(g.actor,second);assert.equal(g.label,'À jouer');assert(g.cells.length>0);});
test('No movement is advertised for enemy turns, animations, or pending placement validation',()=>{for(const next of [{activeStack:undefined},{activeStack:3},{canAct:false},{canEndTactics:false},{tacticsMode:false,round:0}]){const g=battleGuidance({...state,...next});assert.equal(g.ready,false);assert.deepEqual(g.cells,[]);}});
test('A hypnotized enemy stack shows its native movement range while locally controlled',()=>{
 const hypnotized={...actor,enemy:true};
 const combat={...state,tacticsMode:false,round:1,battleUnits:[hypnotized,...state.battleUnits.slice(1)],activeUnit:{controlled:true}};
 const guidance=battleGuidance(combat);
 assert.equal(guidance.actor,hypnotized);
 assert.deepEqual(guidance.cells.map(cell=>cell.hex),[37,41]);
 assert.deepEqual(battleGuidance({...combat,canAct:false}).cells,[]);
 assert.deepEqual(battleGuidance({...combat,activeUnit:{controlled:false}}).cells,[]);
 assert.deepEqual(battleGuidance({...combat,battleUnits:state.battleUnits,activeUnit:{controlled:false}}).cells,[]);
});
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


test('Spell markers classify native legal targets separately from ranged attacks',()=>{
 const ally={...actor,x:102,y:196},enemy={stackId:3,x:718,y:196,enemy:true,canShootAt:true};
 const cells=[{x:ally.x,y:ally.y},{x:enemy.x,y:enemy.y}];
 const battle={...state,tacticsMode:false,round:1,battleUnits:[ally,enemy],battleCells:cells};
 for(const [allowed,expected] of [[[true,false],[ally]],[[false,true],[enemy]],[[true,true],[ally,enemy]],[[undefined,undefined],[]]]){
  const targeting={...battle,spellTargeting:true,battleCells:cells.map((cell,i)=>({...cell,spellTarget:allowed[i]}))};
  assert.deepEqual(battleGuidance(targeting).spellTargets,expected);
  assert.deepEqual(battleGuidance(targeting).shotTargets,[]);
  assert.deepEqual(battleGuidance({...targeting,autoCombat:true}).spellTargets,[]);
 }
 assert.deepEqual(battleGuidance(battle).shotTargets,[enemy]);
 assert.deepEqual(battleGuidance(battle).spellTargets,[]);
});

test('Melee targets identify reachable enemies for monsters that can travel across the battlefield',()=>{
 const reachableMelee={stackId:3,enemy:true,canMeleeAt:true,canShootAt:false};
 const blockedMelee={stackId:4,enemy:true,canMeleeAt:false,canShootAt:false};
 const shooter={stackId:5,enemy:true,canMeleeAt:true,canShootAt:true};
 const ally={stackId:6,enemy:false,canMeleeAt:true};
 const combat={...state,tacticsMode:false,round:1,battleUnits:[actor,reachableMelee,blockedMelee,shooter,ally]};
 const guidance=battleGuidance(combat);
 assert.deepEqual(guidance.meleeTargets,[reachableMelee]);
 assert.deepEqual(guidance.shotTargets,[shooter]);
 for(const next of [{spellTargeting:true},{autoCombat:true},{manualControl:false},{canAct:false},{tacticsMode:true},{activeStack:3}]){
  assert.deepEqual(battleGuidance({...combat,...next}).meleeTargets,[]);
 }
});

test('Beneficial targets highlight allied troops when active unit can heal or cast beneficial magic',()=>{
 const woundedAlly={stackId:2,enemy:false,x:200,y:200};
 const enemy={stackId:3,enemy:true,x:600,y:200};
 const normalCombat={...state,tacticsMode:false,round:1,battleUnits:[actor,woundedAlly,enemy]};
 assert.deepEqual(battleGuidance(normalCombat).beneficialTargets,[]);
 const archangelCombat={...normalCombat,activeUnit:{key:'core:archangel',controlled:true},creatureCanCast:true};
 assert.deepEqual(battleGuidance(archangelCombat).beneficialTargets,[woundedAlly]);
 const genieCombat={...normalCombat,activeUnit:{key:'core:masterGenie',controlled:true}};
 assert.deepEqual(battleGuidance(genieCombat).beneficialTargets,[woundedAlly]);
 const healerCombat={...normalCombat,activeUnit:{abilities:['Peut soigner une troupe alliée'],controlled:true}};
 assert.deepEqual(battleGuidance(healerCombat).beneficialTargets,[woundedAlly]);
});

test('paintMeleeTargets renders crossed sword icons on reachable enemy positions with a red circle',()=>{
 let arcs=0,rects=0,strokeStyles=[];
 const ctx={save(){},restore(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},fill(){},stroke(){strokeStyles.push(ctx.strokeStyle);},rect(){rects++;},arc(){arcs++;},translate(){},rotate(){},fillRect(){},clip(){}};
 const layout={x:0,y:0,w:800,h:555,dx:0,dy:0,scale:1};
 const enemyTarget={stackId:3,enemy:true,x:400,y:200};
 paintMeleeTargets(ctx,[enemyTarget],layout);
 assert(arcs>0,'Must draw circular badge and pommels');
 assert(rects>0,'Must clip to battlefield and draw crossguards');
 assert(strokeStyles.includes('#e53935'),'Badge circle must be red (#e53935)');
});
