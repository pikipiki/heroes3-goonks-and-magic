import {createCanvasSizer} from './mobile-render.mjs';
import {paintBattleFloor} from './battle-floor.mjs';
import {paintBattleAction} from './battle-director.mjs';
import {fitRegion,scenePoint} from './mobile-layout.mjs';
import {localPointer,sameTouchGeometry,touchGeometry} from './touch-geometry.mjs';
import {NATIVE_BATTLE_REGION,fitNativeBattle,paintBattleGrid,paintMovementRange} from './battle-scene.mjs';
import {battleGuidance,paintActiveCreature,paintShotTargets,paintMeleeTargets,paintSpellTargets} from './battle-guidance.mjs';

// Keep native pixel geometry: one CSS pixel per engine coordinate makes a hex
// 44 pixels wide even when the portrait detail pane is short.
export function fitBattleDetail(width,height,focus,points=[],scaleOverride=null){
 const base=Math.min(width/800,height/555),normal=Math.max(1,width/800,height/555);
 const framed=points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
 const bounds=framed.length>1?{left:Math.max(0,Math.min(...framed.map(p=>p.x))-60),right:Math.min(800,Math.max(...framed.map(p=>p.x))+60),top:Math.max(0,Math.min(...framed.map(p=>p.y))-96),bottom:Math.min(555,Math.max(...framed.map(p=>p.y))+24)}:null;
 const limit=bounds?Math.min(normal,width/(bounds.right-bounds.left),height/(bounds.bottom-bounds.top)):normal;
 // Zoom out immediately when a shot starts; easing must never crop either end.
 const scale=Math.max(base,Math.min(scaleOverride??limit,limit));
 const layout={...fitRegion(width,height,NATIVE_BATTLE_REGION,scale/base,focus),scale};
 if(bounds){
  // A camera still panning from the previous action must also contain both units.
  layout.x=Math.max(Math.max(0,bounds.right-layout.w),Math.min(Math.min(800-layout.w,bounds.left),layout.x));
  layout.y=Math.max(Math.max(0,bounds.bottom-layout.h),Math.min(Math.min(555-layout.h,bounds.top),layout.y));
 }
 return layout;
}
export function battleOverviewPoint(x,y,width,height,clampToField=false){
 const layout=fitNativeBattle(width,height,null,'whole');
 if(clampToField){
  x=Math.max(layout.dx,Math.min(layout.dx+layout.w*layout.scale,x));
  y=Math.max(layout.dy,Math.min(layout.dy+layout.h*layout.scale,y));
 }
 return scenePoint(x,y,layout);
}
export function overviewCreature(point,units,scale){
 if(!point)return null;
 // Compare sprite centers, rather than the feet, to disambiguate adjacent rows.
 return (units||[]).map(unit=>({unit,distance:Math.hypot((unit.x-point.x)*scale,(unit.y-30-point.y)*scale)}))
  .filter(item=>item.distance<=Math.max(12,36*scale)).sort((a,b)=>a.distance-b.distance)[0]?.unit||null;
}
export function createBattleDualView({root,scene,getState,getView=()=>'whole',onFocus}){
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=new URL('./battle-dual-view.css',import.meta.url).href;document.head.append(stylesheet);
 const strategic=document.createElement('section');strategic.className='battle-strategic-view';strategic.setAttribute('aria-label','Vue stratégique du combat');strategic.hidden=true;
 const canvas=document.createElement('canvas');canvas.id='battle-strategic-scene';canvas.setAttribute('aria-label','Terrain entier. Touchez une troupe ou une zone pour la voir en grand.');canvas.tabIndex=0;canvas.setAttribute('role','group');
 strategic.append(canvas);scene.before(strategic);
 const detailDescription=document.createElement('div');detailDescription.id='battle-detail-description';detailDescription.hidden=true;scene.before(detailDescription);
 const ctx=canvas.getContext('2d'),surfaceSize=createCanvasSizer();let active=false,press=null,currentLayout=null;
 function sync(){
  const isPortrait=(root.clientWidth>0&&root.clientHeight>0)?(root.clientWidth<=root.clientHeight):(typeof window!=='undefined'&&(window.matchMedia?.('(orientation: portrait)')?.matches??true));
  const next=getState().mode==='battle'&&isPortrait&&getView()==='whole';
  if(next!==active||root.dataset.battleLayout!==(next?'dual':'native')){
   active=next;press=null;root.dataset.battleLayout=active?'dual':'native';
   strategic.hidden=!active;
   if(active)scene.setAttribute('aria-describedby',detailDescription.id);
   else{scene.removeAttribute('aria-describedby');surfaceSize.release(canvas);}
  }
  return active;
 }
 canvas.addEventListener('pointerdown',event=>{if(!active||event.isPrimary===false||event.button!==0)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);press={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false,geometry:touchGeometry(canvas)};});
 canvas.addEventListener('pointermove',event=>{if(press?.id!==event.pointerId)return;if(Math.hypot(event.clientX-press.x,event.clientY-press.y)>9)press.moved=true;});
 canvas.addEventListener('pointerup',event=>{
  if(press?.id!==event.pointerId)return;
  const {moved,geometry}=press;press=null;
  if(moved||!active||!sameTouchGeometry(canvas,geometry))return;
  const local=localPointer(canvas,event);
  if(!local)return;
  const {x,y}=local,w=canvas.clientWidth,h=canvas.clientHeight;
  const inside=battleOverviewPoint(x,y,w,h);
  const point=inside||battleOverviewPoint(x,y,w,h,true);
  if(point)onFocus(point,overviewCreature(inside,getState().battleUnits,currentLayout?.scale||1));
 });
 const cancel=()=>{press=null;};canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);
 canvas.addEventListener('keydown',event=>{const delta={ArrowLeft:[-88,0],ArrowRight:[88,0],ArrowUp:[0,-84],ArrowDown:[0,84]}[event.key];if(!active||!delta||!currentLayout)return;event.preventDefault();const view=lastDetail||{x:0,y:0,w:800,h:555};onFocus({x:Math.max(0,Math.min(800,view.x+view.w/2+delta[0])),y:Math.max(0,Math.min(555,view.y+view.h/2+delta[1]))});});
 let lastDetail=null;
 function paint(original,detail,selected,view){if(!sync())return;const text=view?.label||'Vue rapprochée · Choisissez une case ou une cible';if(detailDescription.textContent!==text)detailDescription.textContent=text;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const pixels=surfaceSize.fit(canvas,w,h,Math.min(devicePixelRatio||1,2));ctx.setTransform(pixels.x,0,0,pixels.y,0,0);ctx.clearRect(0,0,w,h);currentLayout=fitNativeBattle(w,h,null,'whole');const l=currentLayout;ctx.drawImage(original,0,0,original.width,original.height*555/600,l.dx,l.dy,l.w*l.scale,l.h*l.scale);
  const state=getState(),guidance=battleGuidance(state);paintBattleFloor(ctx,state,l);paintShotTargets(ctx,guidance.shotTargets,l);paintMeleeTargets(ctx,guidance.meleeTargets,l);paintActiveCreature(ctx,guidance,l);paintBattleAction(ctx,view,l);paintSpellTargets(ctx,[...new Set([...guidance.spellTargets,...(guidance.beneficialTargets||[])])],l);
  if(selected){const isMeleeTarget=(guidance.meleeTargets||[]).some(u=>Math.hypot(u.x-selected.x,u.y-selected.y)<16);ctx.strokeStyle=isMeleeTarget?'#e53935':'#fff0ae';ctx.lineWidth=2;ctx.beginPath();ctx.arc(l.dx+selected.x*l.scale,l.dy+selected.y*l.scale,10,0,Math.PI*2);ctx.stroke();}
  if(detail){lastDetail=detail;ctx.save();ctx.strokeStyle='#fff0ae';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.strokeRect(l.dx+detail.x*l.scale,l.dy+detail.y*l.scale,detail.w*l.scale,detail.h*l.scale);ctx.restore();}
 }
 return {sync,paint,get active(){return active;}};
}
