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
 if(!show||state.mode!=='battle'||!battleCapabilities(state).combatReady||state.spellTargeting||state.animating)return [];
 const actor=(state.battleUnits||[]).find(u=>u.stackId===state.activeStack);
 if(!actor||(state.activeUnit?.controlled??!actor.enemy)===false)return [];
 return (state.battleUnits||[]).filter(u=>{
  const p=u.attackLosses;
  return u.enemy&&u.count>0&&(u.canShootAt||u.canMeleeAt)&&p?.actor===state.activeStack&&
   Number.isSafeInteger(p.min)&&Number.isSafeInteger(p.max)&&p.min>=0&&p.max>=p.min&&p.max<=u.count;
 }).map(unit=>({unit,label:formatEnemyLosses(unit.attackLosses)}));
}
export function formatEnemyLosses({min,max}){return min===max?`−${min}`:`−${min}–${max}`;}
export function enemyLossDescription(state){
 const entries=enemyLossEstimates(state);
 return entries.length?uiText('Estimated enemy casualties per strike (random effects excluded): ','Pertes ennemies estimées par frappe (hors effets aléatoires) : ')+entries.map(({unit,label})=>`${unit.name} : ${label}`).join('; '):'';
}
export function overlaps(a,b,gap=2){return a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;}
const edge=(rect,point)=>({x:Math.max(rect.x,Math.min(rect.x+rect.w,point.x)),y:Math.max(rect.y,Math.min(rect.y+rect.h,point.y))});
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const crosses=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<0&&orient(c,d,a)*orient(c,d,b)<0;

// Deterministic screen-space placement: reserve *both* armies and all counters,
// then look for the nearest free rectangle. Text never shrinks to fit a hex.
export function layoutEnemyLosses(entries,bounds,occlusion=[]){
 const placed=[],hidden=[];
 const inside=r=>r.x>=bounds.x&&r.y>=bounds.y&&r.x+r.w<=bounds.x+bounds.w&&r.y+r.h<=bounds.y+bounds.h;
 for(const e of [...entries].sort((a,b)=>a.anchor.y-b.anchor.y||a.anchor.x-b.anchor.x||a.unit.stackId-b.unit.stackId)){
  const candidates=[];
  const add=(x,y)=>{const r={x:Math.round(x),y:Math.round(y),w:e.w,h:e.h};if(!inside(r)||occlusion.some(o=>overlaps(r,o))||placed.some(o=>overlaps(r,o)))return;
   const end=edge(r,e.anchor),length=Math.hypot(end.x-e.anchor.x,end.y-e.anchor.y);
   const crossings=placed.filter(o=>crosses(e.anchor,end,o.anchor,o.end)).length;
   candidates.push({...r,end,score:length+crossings*bounds.w*4});};
  for(const dy of [-e.h-6,8,-e.h-28,30])for(const dx of [-e.w/2,-e.w-8,8])add(e.anchor.x+dx,e.anchor.y+dy);
  // Search only when close placements fail; a melee scrum may occupy every
  // neighbouring hex, but usually leaves clear grass around the group.
  if(!candidates.some(c=>c.score<e.h*3))for(let y=bounds.y;y<=bounds.y+bounds.h-e.h;y+=4)for(let x=bounds.x;x<=bounds.x+bounds.w-e.w;x+=4)add(x,y);
  candidates.sort((a,b)=>a.score-b.score||a.y-b.y||a.x-b.x);
  if(candidates.length)placed.push({...e,...candidates[0]});
  else hidden.push(e); // Never cover a creature or another counter to force a label.
 }
 return {placed,hidden};
}

// Clip leaders against the union of both armies and their count badges.
// A thin guide must never run through a number or a creature silhouette.
export function visibleLeaderSegments(start,end,blocked){
 const dx=end.x-start.x,dy=end.y-start.y,hidden=[];
 for(const box of blocked){let lo=0,hi=1,intersects=true;
  for(const [origin,delta,min,max] of [[start.x,dx,box.x-1,box.x+box.w+1],[start.y,dy,box.y-1,box.y+box.h+1]]){
   if(!delta){if(origin<min||origin>max){intersects=false;break;}continue;}
   const a=(min-origin)/delta,b=(max-origin)/delta;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi){intersects=false;break;}
  }
  if(intersects&&hi>=0&&lo<=1)hidden.push([Math.max(0,lo),Math.min(1,hi)]);
 }
 hidden.sort((a,b)=>a[0]-b[0]);const visible=[];let cursor=0;
 for(const [lo,hi] of hidden){if(lo>cursor)visible.push([cursor,lo]);cursor=Math.max(cursor,hi);}
 if(cursor<1)visible.push([cursor,1]);
 return visible.map(([a,b])=>[{x:start.x+a*dx,y:start.y+a*dy},{x:start.x+b*dx,y:start.y+b*dy}]);
}

const styles=new WeakMap();
const layouts=new WeakMap();
function theme(ctx){
 const canvas=ctx.canvas;if(canvas&&styles.has(canvas))return styles.get(canvas);
 const css=canvas&&globalThis.getComputedStyle?.(canvas);
 const token=(name,fallback)=>css?.getPropertyValue('--ui-'+name).trim()||fallback;
 const font=token('font-body-small',ctx.font).replace(/\/[\d.]+(?:px)?/,'');
 const value={font,height:(parseFloat(font.match(/([\d.]+)px/)?.[1])||12)+6,
  background:token('surface','#1e140c'),foreground:token('on-surface','#ffedc8'),outline:token('outline','#c5a15f')};
 if(canvas&&css)styles.set(canvas,value);return value;
}

export function paintEnemyLosses(ctx,state,layout,{occlusion,positions}={}){
 const forecasts=enemyLossEstimates(state);if(!forecasts.length)return [];
 const project=layout.project||(({x,y})=>({x:layout.dx+(x-layout.x)*layout.scale,y:layout.dy+(y-layout.y)*layout.scale}));
 const bounds={x:layout.dx+2,y:layout.dy+2,w:layout.w*layout.scale-4,h:layout.h*layout.scale-4};
 const t=theme(ctx);ctx.save();ctx.font=t.font;
 const units=(state.battleUnits||[]).map(unit=>({unit,...project(unit)}));
 const spriteBounds=(globalThis.goonkBattleSpriteBounds||[]).filter(b=>units.some(p=>p.unit.stackId===b.stackId)&&b.w>0&&b.h>0).map(b=>{const p=project(b);return{x:p.x-2,y:p.y-2,w:b.w*layout.scale+4,h:b.h*layout.scale+4};});
 const blocked=occlusion||[...units.map(p=>({x:p.x-44*layout.scale,y:p.y-88*layout.scale,w:114*layout.scale,h:118*layout.scale})),...spriteBounds];
 const entries=forecasts.map(e=>{const anchor=project(positions?.get(e.unit.stackId)||e.unit);return {...e,anchor,w:Math.ceil(ctx.measureText(e.label).width)+8,h:t.height};})
  .filter(e=>e.anchor.x>=bounds.x&&e.anchor.x<=bounds.x+bounds.w&&e.anchor.y>=bounds.y&&e.anchor.y<=bounds.y+bounds.h);
 const signature=JSON.stringify([bounds,blocked,entries.map(e=>[e.unit.stackId,e.label,e.anchor,e.w,e.h])]);
 const cached=ctx.canvas&&layouts.get(ctx.canvas);
 const result=cached?.signature===signature?cached.result:layoutEnemyLosses(entries,bounds,blocked);
 if(ctx.canvas&&cached?.signature!==signature)layouts.set(ctx.canvas,{signature,result});
 const {placed}=result;
 ctx.beginPath();ctx.rect(bounds.x,bounds.y,bounds.w,bounds.h);ctx.clip();
 // Leaders first, with a dot at the exact destination hex, so even identical
 // creatures on adjacent hexes cannot exchange their labels visually.
 for(const r of placed){ctx.beginPath();for(const [a,b] of visibleLeaderSegments(r.anchor,r.end,blocked)){ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}ctx.strokeStyle=t.outline;ctx.lineWidth=1;ctx.stroke();if(!blocked.some(o=>r.anchor.x>=o.x&&r.anchor.x<=o.x+o.w&&r.anchor.y>=o.y&&r.anchor.y<=o.y+o.h)){ctx.fillStyle=t.outline;ctx.fillRect(r.anchor.x-1,r.anchor.y-1,2,2);}}
 ctx.textAlign='center';ctx.textBaseline='middle';
 for(const r of placed){ctx.globalAlpha=.92;ctx.fillStyle=t.background;ctx.fillRect(r.x,r.y,r.w,r.h);ctx.globalAlpha=1;ctx.strokeStyle=t.outline;ctx.lineWidth=1;ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);ctx.fillStyle=t.foreground;ctx.fillText(r.label,r.x+r.w/2,r.y+r.h/2);}
 ctx.restore();return placed;
}
