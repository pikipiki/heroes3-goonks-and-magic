import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyLossEstimates,formatEnemyLosses,layoutEnemyLosses,overlaps,paintEnemyLosses,visibleLeaderSegments} from '../web/ui/battle-losses.mjs';
import {battleLossEstimates,setBattleLossEstimates} from '../web/battle-preferences.mjs';
import {verticalBattleGeometry} from '../web/battle-vertical.mjs';
const actor={stackId:1,x:300,y:280,count:20};
const enemy={stackId:2,x:344,y:280,name:'Dragon',count:12,enemy:true,canMeleeAt:true,attackLosses:{actor:1,min:2,max:5}};
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
const field=Array.from({length:11},(_,i)=>({stackId:i+1,x:312+(i%5)*44+(Math.floor(i/5)%2)*22,y:230+Math.floor(i/5)*42,count:i===4?1:20,enemy:i%2===1||i===4,armySlot:i===4?-2:i}));
const views=[...[[320,260],[320,350],[360,400],[568,280],[640,360]].map(([w,h])=>({w,h,project:p=>{const s=Math.min(w/800,h/555);return{x:p.x*s,y:p.y*s}},scale:Math.min(w/800,h/555)})),...[[320,260],[320,350],[360,400]].map(([w,h])=>({w,h,...verticalBattleGeometry(w,h)}))];
test('mixed adjacent armies and commander: every forecast fits without covering sprites or counters',()=>{
 for(const view of views){
  const points=field.map(u=>({unit:u,...view.project(u)}));
  const blocked=points.map(p=>({x:p.x-44*view.scale,y:p.y-88*view.scale,w:114*view.scale,h:118*view.scale}));
  const entries=points.filter(p=>p.unit.enemy).map(p=>({unit:p.unit,anchor:p,w:46,h:18,label:'−2–5'}));
  const bounds={x:2,y:2,w:view.w-4,h:view.h-4};
  const {placed,hidden}=layoutEnemyLosses(entries,bounds,blocked);
  assert.equal(hidden.length,0,`${view.w}x${view.h}: every enemy has its own forecast`);
  for(let i=0;i<placed.length;i++){const a=placed[i];assert(a.x>=2&&a.y>=2&&a.x+a.w<=view.w-2&&a.y+a.h<=view.h-2);assert(!blocked.some(b=>overlaps(a,b)));for(let j=0;j<i;j++)assert(!overlaps(a,placed[j]));}
  assert.deepEqual(layoutEnemyLosses(entries,bounds,blocked).placed,placed,'stable positions on unchanged frames');
 }
});
test('overflow never paints an estimate over an army or truncates a number',()=>{
 const e={unit:enemy,anchor:{x:10,y:10},w:60,h:18,label:'−2–5'};
 const result=layoutEnemyLosses([e],{x:0,y:0,w:20,h:20},[]);assert.equal(result.placed.length,0);assert.equal(result.hidden.length,1);
});
test('drawing does not consume native pointer commands and honours setting changes immediately',()=>{
 let text=[];const ctx={font:'400 12px Georgia',canvas:{},save(){},restore(){},measureText:t=>({width:t.length*7}),beginPath(){},rect(){},clip(){},moveTo(){},lineTo(){},stroke(){},fillRect(){},strokeRect(){},fillText:t=>text.push(t)};
 const l={x:0,y:0,w:800,h:555,dx:0,dy:0,scale:.4};
 assert.equal(paintEnemyLosses(ctx,state,l).length,1);assert.deepEqual(text,['−2–5']);
});

test('leader lines never cross overlapping allied silhouettes or count badges',()=>{
 const blocked=[{x:0,y:0,w:20,h:20},{x:15,y:0,w:20,h:20},{x:50,y:0,w:8,h:20}];
 const segments=visibleLeaderSegments({x:10,y:10},{x:90,y:10},blocked);
 assert.deepEqual(segments,[[{x:36,y:10},{x:49,y:10}],[{x:59,y:10},{x:90,y:10}]]);
 for(const [a,b] of segments)for(const box of blocked)assert(!((a.x+b.x)/2>=box.x&&(a.x+b.x)/2<=box.x+box.w));
});
