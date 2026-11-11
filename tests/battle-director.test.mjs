import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBattleDirector} from '../web/battle-director.mjs';
import {fitBattleDetail} from '../web/battle-dual-view.mjs';
const ally={stackId:1,x:102,y:490,name:'Glouglou',enemy:false},enemy={stackId:2,x:718,y:196,name:'Adversaire',enemy:true};
const idle={mode:'battle',round:1,canAct:true,activeStack:1,battleUnits:[ally,enemy],battleCamera:{sequence:0,active:false}};
test('The camera follows native animated coordinates, including enemy moves',()=>{
 const d=createBattleDirector();d.frame(idle);
 const action={sequence:1,active:true,kind:'move',actor:{...enemy,x:500,y:280},destination:{x:300,y:364},path:[{x:718,y:196},{x:500,y:280},{x:300,y:364}]};
 const view=d.frame({...idle,canAct:false,battleCamera:action});assert.deepEqual(view.focus,{x:500,y:252});assert.equal(view.path.length,3);
 assert.deepEqual(d.frame({...idle,battleCamera:{...action,actor:{...enemy,x:420,y:322}}}).focus,{x:420,y:294});
});
test('Ranged attacks focus on the target hit, and allied spell targets retain their identity',()=>{
 const d=createBattleDirector();const shot={sequence:2,active:true,kind:'attack',actor:enemy,targets:[ally]};
 let view=d.frame({...idle,activeStack:undefined,battleCamera:shot});assert.deepEqual(view.focus,{x:102,y:462});assert.equal(view.points.length,1);assert.equal(view.targets[0].enemy,false);
 view=d.frame({...idle,battleCamera:{...shot,sequence:3,kind:'spell',actor:null,label:'Soin'}});assert.equal(view.actor,null);assert.equal(view.targets[0].stackId,1);assert(view.label.includes('Soin'));
});
test('Melee attacks frame both adjacent combatants',()=>{
 const d=createBattleDirector();
 const meleeEnemy={...enemy,x:146,y:490};
 const melee={sequence:10,active:true,kind:'attack',actor:ally,targets:[meleeEnemy]};
 const view=d.frame({...idle,battleUnits:[ally,meleeEnemy],battleCamera:melee});
 assert.deepEqual(view.focus,{x:124,y:462});assert.equal(view.points.length,2);
});
test('Area spells frame every affected unit and preserve native framebuffer geometry',()=>{
 const d=createBattleDirector();const view=d.frame({...idle,battleCamera:{sequence:4,active:true,kind:'spell',targets:[ally,enemy]}});
 const l=fitBattleDetail(390,240,view.focus,view.points);assert(l.scale<1);
 for(const p of [ally,enemy]){const x=l.dx+(p.x-l.x)*l.scale,y=l.dy+(p.y-l.y)*l.scale;assert(x>=0&&x<=390);assert(y>=0&&y<=240);}
 const empty=d.frame({...idle,battleCamera:{sequence:5,active:true,kind:'spell',destination:{x:500,y:280}}});assert.deepEqual(empty.focus,{x:500,y:252});
});
test('Manual exploration survives repeated snapshots; return and the next native action resume following',()=>{
 const d=createBattleDirector();d.frame(idle);d.explore({x:600,y:300});assert.equal(d.frame(idle).manual,true);assert.deepEqual(d.frame({...idle,canAct:false}).focus,{x:600,y:300});
 d.follow();assert.equal(d.frame(idle).manual,false);d.explore({x:600,y:300});const view=d.frame({...idle,battleCamera:{sequence:6,active:true,kind:'attack',actor:enemy,targets:[ally]}});assert.equal(view.manual,false);assert.deepEqual(view.focus,{x:102,y:462});
});
test('Confirmation releases exploration, previews the native path, and cannot retain an expired turn',()=>{
 let now=0;const d=createBattleDirector({clock:()=>now});d.frame(idle);d.explore({x:600,y:300});d.confirm(idle,{x:190,y:448});assert.equal(d.frame(idle).manual,false);assert.equal(d.frame(idle).kind,'move');
 assert.equal(d.frame({...idle,activeStack:2}).kind,undefined);d.confirm(idle,{x:190,y:448});now=6000;assert.equal(d.frame(idle).kind,undefined);
 const view=d.frame({...idle,battleCamera:{sequence:7,active:false,previewPath:[{x:146,y:490},{x:190,y:448}]}},{x:190,y:448});assert.equal(view.path.length,2);
 d.explore({x:600,y:300});d.frame({mode:'map'});assert.equal(d.frame(idle).manual,false);
});

test('A distant shot focuses on the hit target in close-up',()=>{
 const d=createBattleDirector(),view=d.frame({...idle,battleCamera:{sequence:20,active:true,kind:'attack',actor:ally,targets:[enemy]}});
 assert.equal(view.isRanged,true);
 assert.deepEqual(view.focus,{x:enemy.x,y:enemy.y-28});
 assert.equal(view.points.length,1);
 for(const [w,h] of [[390,240],[320,110],[430,300],[844,250]]){
  const l=fitBattleDetail(w,h,view.focus,view.points);
  assert(l.scale>=1);
  const x=l.dx+(enemy.x-l.x)*l.scale,y=l.dy+(enemy.y-l.y)*l.scale;
  assert(x>=0&&x<=w&&y>=0&&y<=h);
 }
});
test('Creature spells focus on the hit target, including self casts',()=>{
 const d=createBattleDirector(),spell={sequence:30,active:true,kind:'spell',actor:ally,targets:[enemy]};
 assert.deepEqual(d.frame({...idle,battleCamera:spell}).points,[enemy]);
 const self=d.frame({...idle,battleCamera:{...spell,sequence:31,targets:[ally]}});assert.equal(self.points.length,1);
});
