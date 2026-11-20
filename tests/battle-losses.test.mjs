import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyLossEstimates,formatEnemyLosses,overlaps,paintEnemyLosses,layoutCounterLosses,spellUnitEstimates} from '../web/ui/battle-losses.mjs';
import {battleLossEstimates,setBattleLossEstimates} from '../web/battle-preferences.mjs';
import {verticalBattleGeometry} from '../web/battle-vertical.mjs';
const actor={stackId:1,x:300,y:280,count:20};
const enemy={countBounds:{x:360,y:290,w:30,h:13},stackId:2,x:344,y:280,name:'Dragon',count:12,enemy:true,canMeleeAt:true,attackLosses:{actor:1,min:2,max:5}};
const state={mode:'battle',round:1,canAct:true,activeStack:1,battleUnits:[actor,enemy]};
test('casualties come exclusively from current actor native estimates and legality',()=>{
 assert.equal(enemyLossEstimates(state,true)[0].label,'−2–5');
 assert.equal(formatEnemyLosses({min:0,max:0}),'−0');
 assert.equal(formatEnemyLosses({min:12,max:12}),'−12');
 for(const patch of [{mode:'map'},{round:0},{canAct:false},{spellTargeting:true},{animating:true},{autoCombat:true},{tacticsMode:true},{manualControl:false},{activeUnit:{controlled:false}},{activeStack:2}])assert.deepEqual(enemyLossEstimates({...state,...patch},true),[],JSON.stringify(patch));
 for(const unit of [{...enemy,enemy:false},{...enemy,canMeleeAt:false},{...enemy,count:0},{...enemy,attackLosses:{actor:3,min:2,max:5}},{...enemy,attackLosses:{actor:1,min:7,max:5}},{...enemy,attackLosses:{actor:1,min:0,max:13}},{...enemy,attackLosses:{actor:1,min:0,max:NaN}},{...enemy,attackLosses:undefined}])assert.deepEqual(enemyLossEstimates({...state,battleUnits:[actor,unit]},true),[]);
 assert.deepEqual(enemyLossEstimates(state,false),[]);
});
test('loss preference defaults on, persists, and tolerates unavailable storage',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 assert.equal(battleLossEstimates(storage),true);setBattleLossEstimates(false,storage);assert.equal(battleLossEstimates(storage),false);setBattleLossEstimates(true,storage);assert.equal(battleLossEstimates(storage),true);
 const blocked={getItem(){throw Error('private')},setItem(){throw Error('private')}};setBattleLossEstimates(false,blocked);assert.equal(battleLossEstimates(blocked),false);setBattleLossEstimates(true,blocked);assert.equal(battleLossEstimates(blocked),true);
});
test('drawing does not consume native pointer commands and honours setting changes immediately',()=>{
 let text=[];const ctx={font:'400 12px Georgia',canvas:{},save(){},restore(){},measureText:t=>({width:t.length*7}),beginPath(){},rect(){},clip(){},moveTo(){},lineTo(){},stroke(){},fillRect(){},strokeRect(){},fillText:t=>text.push(t)};
 const l={x:0,y:0,w:800,h:555,dx:0,dy:0,scale:.4};
 assert.equal(paintEnemyLosses(ctx,state,l).length,1);assert.deepEqual(text,['(−2–5)']);
});

test('parenthesized forecasts stay attached to the same count through facing, animation, and turn changes',()=>{
 const counters=Array.from({length:16},(_,i)=>({stackId:i+1,x:40+(i%4)*66,y:30+Math.floor(i/4)*44,w:20,h:13}));
 const entries=counters.filter(c=>c.stackId%2===0).map(c=>({unit:{stackId:c.stackId},label:'(−1)',w:27,h:14}));
 const bounds={x:0,y:0,w:320,h:260};let previous=[];
 for(let frame=0;frame<30;frame++){
  const shuffled=frame%2?[...counters].reverse():counters;
  const result=layoutCounterLosses(entries,bounds,shuffled,previous);
  assert.equal(result.placed.length,entries.length);
  for(const r of result.placed){const old=previous.find(o=>o.unit.stackId===r.unit.stackId);if(old){assert.equal(r.side,old.side);assert.equal(r.x,old.x);assert.equal(r.y,old.y);}assert.equal(r.badge.stackId,r.unit.stackId);assert(!counters.some(c=>overlaps(r,c,0)));assert(Math.min(Math.abs(r.x-r.badge.x-r.badge.w),Math.abs(r.x+r.w-r.badge.x),Math.abs(r.y-r.badge.y-r.badge.h),Math.abs(r.y+r.h-r.badge.y))<=1);}
  previous=result.placed;
 }
});

test('loss text remains left-to-right and upright when a sprite left a mirrored transform',()=>{
 let text,transform;const ctx={font:'400 12px Georgia',canvas:{width:640,height:520,clientWidth:320,clientHeight:260},save(){},restore(){},getTransform:()=>({a:-2,b:0,c:0,d:2}),setTransform:(...v)=>{transform=v},measureText:t=>({width:t.length*7}),beginPath(){},rect(){},clip(){},fillRect(){},fillText:t=>{text=t}};
 paintEnemyLosses(ctx,state,{x:0,y:0,w:800,h:555,dx:0,dy:0,scale:.4});
 assert.deepEqual(transform,[2,0,0,2,0,0]);assert.equal(ctx.direction,'ltr');assert.equal(text,'(−2–5)');
});

test('spell annotations use signed native units, capped native healing and selected-spell identity',()=>{
 const units=[{...enemy,spellEstimate:{spellId:15,unitsDelta:-3,hpDelta:-30}},{...actor,name:'Ally',spellEstimate:{spellId:15,unitsDelta:0,hpDelta:7}},{...actor,stackId:3,count:0,spellCorpse:true,name:'Fallen ally',spellEstimate:{spellId:15,unitsDelta:5,hpDelta:45}}];
 const casting={...state,selectedSpellId:15,selectedSpell:'Native spell',spellTargeting:true,battleUnits:units};
 assert.deepEqual(spellUnitEstimates(casting).map(({label,kind})=>({label,kind})),[{label:'−3',kind:'loss'},{label:'+7 HP',kind:'gain'},{label:'+5',kind:'gain'}]);
 assert.equal(enemyLossEstimates(casting,true).length,3);
 assert.deepEqual(enemyLossEstimates(casting,false),[]);
 for(const patch of [{selectedSpellId:16},{autoCombat:true},{tacticsMode:true},{round:0},{manualControl:false}])assert.deepEqual(spellUnitEstimates({...casting,...patch}),[]);
 const invalid=[{...units[0],spellEstimate:{spellId:15,unitsDelta:-100,hpDelta:-1}},{...units[0],spellEstimate:{spellId:15,unitsDelta:NaN,hpDelta:1}},{...units[1],spellEstimate:{spellId:15,unitsDelta:0,hpDelta:0}}];
 assert.deepEqual(spellUnitEstimates({...casting,battleUnits:invalid}),[]);
});

test('spell gains and losses share the same upright attached counter layout and distinct theme colors',()=>{
 const text=[],ctx={font:'400 12px Georgia',canvas:{},save(){},restore(){},measureText:t=>({width:t.length*5}),beginPath(){},rect(){},clip(){},fillRect(){},fillText(t){text.push([t,this.fillStyle]);}};
 const units=[{...enemy,spellEstimate:{spellId:15,unitsDelta:-3,hpDelta:-30}},{...actor,countBounds:{x:260,y:290,w:30,h:13},name:'Ally',spellEstimate:{spellId:15,unitsDelta:5,hpDelta:45}}];
 paintEnemyLosses(ctx,{...state,spellTargeting:true,selectedSpellId:15,battleUnits:units},{x:0,y:0,w:800,h:555,dx:0,dy:0,scale:.4});
 assert.deepEqual(new Map(text),new Map([['(−3)','#ffb4ab'],['(+5)','#b5f07a']]));
});


test('Classic loss labels retain the shared horizontal gutter at the field edge',()=>{
 const ctx={font:'400 12px Georgia',canvas:{},save(){},restore(){},measureText:text=>({width:text.length*7}),beginPath(){},rect(){},clip(){},fillRect(){},fillText(){}};
 const edgeEnemy={...enemy,count:100,countBounds:{x:250,y:100,w:30,h:13},attackLosses:{actor:1,min:48,max:48}};
 const placed=paintEnemyLosses(ctx,{...state,battleUnits:[actor,edgeEnemy]},{x:0,y:0,w:320,h:260,dx:0,dy:0,scale:1});
 assert.equal(placed.length,1);assert.equal(placed[0].label,'(−48)');
 assert(placed[0].x>=8&&placed[0].x+placed[0].w<=312,'The label must breathe inside both field edges');
 assert.equal(placed[0].badge.stackId,edgeEnemy.stackId,'The loss remains attached to its own native count');
 assert(!overlaps(placed[0],placed[0].badge,0));
});
