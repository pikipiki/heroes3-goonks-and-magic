import {battleCapabilities} from '../battle-phase.mjs';
import {battleLossEstimates} from '../battle-preferences.mjs';
import {uiText} from './primitives.mjs';

// This is a canvas annotation, not an interactive control. It consumes the
// shared theme and never changes native sprites, camera framing or hit areas.
let enabled=battleLossEstimates();
const refresh=()=>{enabled=battleLossEstimates();};
globalThis.addEventListener?.('goonk-battle-loss-preference',refresh);
globalThis.addEventListener?.('storage',refresh);

export function enemyLossEstimates(state,show=enabled){
 if(!show||state.mode!=='battle'||state.animating)return [];
 if(state.spellTargeting)return spellUnitEstimates(state);
 if(!battleCapabilities(state).combatReady)return [];
 const actor=(state.battleUnits||[]).find(u=>u.stackId===state.activeStack);
 if(!actor||(state.activeUnit?.controlled??!actor.enemy)===false)return [];
 return (state.battleUnits||[]).filter(u=>{
  const p=u.attackLosses;
  return u.enemy&&u.count>0&&(u.canShootAt||u.canMeleeAt)&&p?.actor===state.activeStack&&
   Number.isSafeInteger(p.min)&&Number.isSafeInteger(p.max)&&p.min>=0&&p.max>=p.min&&p.max<=u.count;
 }).map(unit=>({unit,label:formatEnemyLosses(unit.attackLosses),kind:'loss'}));
}
// The engine has already simulated each legal aim with its own spell mechanics.
// Ordinary cure restores HP, never dead creatures; show HP explicitly instead
// of inventing a positive unit count. Resurrection uses the real units delta.
export function spellUnitEstimates(state){
 if(!battleCapabilities(state).targeting)return [];
 return (state.battleUnits||[]).flatMap(unit=>{
  const p=unit.spellEstimate;
  if(!p||!Number.isSafeInteger(p.unitsDelta)||!Number.isSafeInteger(p.hpDelta)||p.spellId!==state.selectedSpellId)return [];
  if(p.unitsDelta<0&&-p.unitsDelta>unit.count)return [];
  const change=p.unitsDelta;
  if(change===0&&p.hpDelta===0)return [];
  const gain=change>0||change===0&&p.hpDelta>0;
  const label=change===0&&gain?`+${p.hpDelta} ${uiText('HP','PV')}`:change>0?`+${change}`:`−${Math.abs(change)}`;
  return [{unit,label,kind:gain?'gain':'loss'}];
 });
}
export function formatEnemyLosses({min,max}){return min===max?`−${min}`:`−${min}–${max}`;}
export function enemyLossDescription(state){
 const entries=enemyLossEstimates(state);
 return entries.length?(state.spellTargeting?uiText('Estimated spell effect on each target (random effects excluded): ','Effet du sort estimé sur chaque cible (hors effets aléatoires) : '):uiText('Estimated enemy casualties per strike (random effects excluded): ','Pertes ennemies estimées par frappe (hors effets aléatoires) : '))+entries.map(({unit,label})=>`${unit.name} : ${label}`).join('; '):'';
}
export function overlaps(a,b,gap=2){return a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;}
const styles=new WeakMap();
const layouts=new WeakMap();
function theme(ctx){
 const canvas=ctx.canvas;if(canvas&&styles.has(canvas))return styles.get(canvas);
 const css=canvas&&globalThis.getComputedStyle?.(canvas);
 const token=(name,fallback)=>css?.getPropertyValue('--ui-'+name).trim()||fallback;
 const font=token('font-body-small',ctx.font).replace(/\/[\d.]+(?:px)?/,'');
 const value={font,height:(parseFloat(font.match(/([\d.]+)px/)?.[1])||12)+6,
  background:token('surface','#1e140c'),loss:token('error','#ffb4ab'),gain:token('success','#b5f07a'),gutter:parseFloat(token('space-2','8px'))||8};
 if(canvas&&css)styles.set(canvas,value);return value;
}

// The estimate is part of the unit count, never a detached floating tooltip.
// Counter rectangles come from the native renderer (Classic) or its upright
// adapter (Vertical); neither depends on the animated creature's facing.
export function layoutCounterLosses(entries,bounds,counters,previous=[]){
 const history=new Map(previous.map(r=>[r.unit.stackId,r]));
 const inside=r=>r.x>=bounds.x&&r.y>=bounds.y&&r.x+r.w<=bounds.x+bounds.w&&r.y+r.h<=bounds.y+bounds.h;
 const pending=[...entries].sort((a,b)=>a.unit.stackId-b.unit.stackId).map(entry=>{
  const badge=counters.find(c=>c.stackId===entry.unit.stackId);if(!badge)return{entry,choices:[]};
  const candidates={right:{x:badge.x+badge.w+1,y:badge.y+(badge.h-entry.h)/2},left:{x:badge.x-entry.w-1,y:badge.y+(badge.h-entry.h)/2},below:{x:badge.x+(badge.w-entry.w)/2,y:badge.y+badge.h+1},above:{x:badge.x+(badge.w-entry.w)/2,y:badge.y-entry.h-1}};
  for(const side of ['below','above'])for(let offset=0;offset<=Math.ceil(entry.w+badge.w-2);offset+=2)candidates[side+'-'+offset]={...candidates[side],x:badge.x-entry.w+1+offset};
  const old=history.get(entry.unit.stackId),order=[...new Set([old?.side,...Object.keys(candidates)].filter(Boolean))];
  return{entry,choices:order.map(side=>({...entry,...candidates[side],side,badge})).filter(r=>inside(r)&&!counters.some(c=>overlaps(r,c,0)))};
 });
 // Solve the small local assignment together: a greedy first enemy must not
 // consume the only available slot beside its adjacent neighbour's counter.
 let best=[],budget=12000;
 const visit=(todo,placed)=>{if(placed.length>best.length)best=placed;if(!todo.length||!--budget||best.length===entries.length)return;
  const options=todo.map(item=>({...item,free:item.choices.filter(r=>!placed.some(c=>overlaps(r,c,0)))})).sort((a,b)=>a.free.length-b.free.length||a.entry.unit.stackId-b.entry.unit.stackId);
  const next=options[0],rest=options.slice(1);
  for(const r of next.free){visit(rest,[...placed,r]);if(best.length===entries.length||budget<=0)return;}
  if(placed.length+rest.length>best.length)visit(rest,placed);
 };
 visit(pending,[]);
 return{placed:best,hidden:entries.filter(e=>!best.some(r=>r.unit.stackId===e.unit.stackId))};
}

export function paintEnemyLosses(ctx,state,layout,{occlusion=[],counters=occlusion.filter(b=>b.kind==='count')}={}){
 const forecasts=enemyLossEstimates(state);if(!forecasts.length)return [];
 const project=layout.project||(({x,y})=>({x:layout.dx+(x-layout.x)*layout.scale,y:layout.dy+(y-layout.y)*layout.scale}));
 const t=theme(ctx);
 // Keep the same readable horizontal breathing room as other shared UI text.
 const bounds={x:layout.dx+t.gutter,y:layout.dy+1,w:Math.max(0,layout.w*layout.scale-2*t.gutter),h:layout.h*layout.scale-2};
 const nativeCounters=counters.length?counters:(state.battleUnits||[]).filter(u=>u.countBounds).map(u=>{const b=u.countBounds,p=project(b);return{stackId:u.stackId,x:p.x,y:p.y,w:b.w*layout.scale,h:b.h*layout.scale};});
 ctx.save();
 const transform=ctx.getTransform?.();
 if(transform&&(transform.a<0||transform.d<0||Math.abs(transform.b)>1e-6||Math.abs(transform.c)>1e-6))ctx.setTransform(ctx.canvas.clientWidth?ctx.canvas.width/ctx.canvas.clientWidth:Math.hypot(transform.a,transform.b),0,0,ctx.canvas.clientHeight?ctx.canvas.height/ctx.canvas.clientHeight:Math.hypot(transform.c,transform.d),0,0);
 const zoom=Math.min(1,(nativeCounters[0]?.h||13)/13);
 ctx.font=t.font.replace(/([\d.]+)px/,(whole,size)=>`${Number(size)*zoom}px`);ctx.direction='ltr';
 const entries=forecasts.map(e=>({...e,label:`(${e.label})`})).map(e=>({...e,w:Math.ceil(ctx.measureText(e.label).width)+2,h:(t.height-4)*zoom}));
 let cached=ctx.canvas&&layouts.get(ctx.canvas);
 const signature=JSON.stringify([bounds,nativeCounters,entries.map(e=>[e.unit.stackId,e.label,e.w,e.h])]);
 const result=cached?.signature===signature?cached.result:layoutCounterLosses(entries,bounds,nativeCounters,cached?.result?.placed);
 if(ctx.canvas)layouts.set(ctx.canvas,{signature,result});
 ctx.beginPath();ctx.rect(bounds.x,bounds.y,bounds.w,bounds.h);ctx.clip();ctx.textAlign='center';ctx.textBaseline='middle';
 for(const r of result.placed){ctx.globalAlpha=.94;ctx.fillStyle=t.background;ctx.fillRect(r.x,r.y,r.w,r.h);ctx.globalAlpha=1;ctx.fillStyle=r.kind==='gain'?t.gain:t.loss;ctx.fillText(r.label,r.x+r.w/2,r.y+r.h/2);}
 ctx.restore();return result.placed;
}
