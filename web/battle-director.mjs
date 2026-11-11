import {translate} from './i18n.mjs';
import {BATTLE_HEX_VERTICES} from './battle-scene.mjs';
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const center=points=>({x:(Math.min(...points.map(p=>p.x))+Math.max(...points.map(p=>p.x)))/2,y:(Math.min(...points.map(p=>p.y))+Math.max(...points.map(p=>p.y)))/2-28});
export function createBattleDirector({clock=()=>performance.now()}={}){
 let manual=null,pending=null,sequence=null,wasBattle=false,nativeActive=false,lastActor=null;
 function actor(state){return (state.battleUnits||[]).find(u=>u.stackId===state.activeStack)||state.focus||{x:400,y:277};}
 function reset(){manual=null;pending=null;sequence=null;wasBattle=false;nativeActive=false;lastActor=null;}
 function describe(state,point){
  const a=actor(state),unit=(state.battleUnits||[]).find(u=>point&&Math.hypot(u.x-point.x,u.y-point.y)<18);
  const isAttack=unit&&unit.stackId!==state.activeStack;
  const shot=isAttack&&(unit.canShootAt===true||(a&&valid(unit)&&Math.hypot(unit.x-a.x,unit.y-a.y)>65));
  return {kind:state.spellTargeting?'spell':isAttack?'attack':'move',shot,actor:a,targets:isAttack?[unit]:[],destination:point,path:state.battleCamera?.previewPath||[],preview:true};
 }
 return {
  explore(point){manual={...point};},follow(){manual=null;},reset,
  confirm(state,point){manual=null;pending={...describe(state,point),until:clock()+5000};},
  frame(state,selected){
   if(state.mode!=='battle'){reset();return {focus:{x:400,y:277},points:[],manual:false};}
   if(!wasBattle){reset();wasBattle=true;}
   const native=state.battleCamera,live=native?.active&&['move','attack','spell'].includes(native.kind);
   if(native&&native.sequence!==sequence){sequence=native.sequence;if(live)manual=null;pending=null;}
   nativeActive=!!live;lastActor=native?.actor?.stackId;
   if(pending&&state.activeStack!==undefined&&state.activeStack!==pending.actor?.stackId)pending=null;
   if(pending&&clock()>pending.until)pending=null;
   let event=(live||(native?.kind&&state.activeStack===undefined))?native:pending||(selected?describe(state,selected):null);
   if(event){event={...event,actor:valid(event.actor)?event.actor:(live&&event.kind==='spell'?null:actor(state)),targets:(event.targets||[]).filter(valid).map(t=>({...state.battleUnits?.find(u=>u.stackId===t.stackId),...t})),path:(event.path||[]).filter(valid)};}
   const a=event?.actor||actor(state),targets=event?.targets||[];
   const isRanged=event?.kind==='attack'&&Boolean(event.shot||event.isRanged||(targets[0]&&(targets[0].canShootAt||(valid(a)&&Math.hypot(targets[0].x-a.x,targets[0].y-a.y)>65))));
   let points=targets.length?targets:valid(event?.destination)&&event.kind!=='move'?[event.destination]:[a];
   if(!points.length)points=[a];
   if(!isRanged&&event?.kind==='attack'&&valid(a)&&!points.some(p=>(a.stackId!=null&&p.stackId===a.stackId)||Math.hypot(p.x-a.x,p.y-a.y)<1))points=[a,...points];
   const actionPoints=isRanged?(targets.length?targets:[a]):(event?.kind==='move'?[a]:points);
   const focus=manual||center(actionPoints);
   const label=manual?'Exploration manuelle':event?.kind==='spell'?(event.label||'Sort')+' · '+(targets.length>1?targets.length+' cibles':'Cible du sort'):event?.kind==='attack'?(isRanged?'Tir · ':'Attaque · ')+(targets[0]?.name||'Cible'):event?.kind==='move'?(event.preview?'Destination préparée':'Déplacement en cours'):'À jouer · '+(a.name||state.activeUnit?.name||'Créature active');
   return {...event,focus,points:manual?[]:actionPoints,manual:!!manual,label,isRanged};
  }
 };
}

export function paintBattleAction(ctx,view,layout){
 if(!view?.kind)return;
 const pos=p=>({x:layout.dx+(p.x-layout.x)*layout.scale,y:layout.dy+(p.y-layout.y)*layout.scale});
 const targets=view.targets||[],actor=valid(view.actor)?view.actor:null;
 ctx.save();
 if(view.kind==='spell')for(const target of targets)for(const cell of target.cells||[target]){
  ctx.beginPath();BATTLE_HEX_VERTICES.forEach(([x,y],i)=>{const p=pos({x:cell.x+x,y:cell.y+y});i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fillStyle='#d8b3ff55';ctx.fill();ctx.strokeStyle='#e4caff';ctx.lineWidth=1.5;ctx.stroke();
 }
 function mark(point,color,label){if(label)label=translate(label);const p=pos(point),r=Math.max(8,22*layout.scale);if(p.x+r<layout.dx||p.x-r>layout.dx+layout.w*layout.scale||p.y+r<layout.dy||p.y-r>layout.dy+layout.h*layout.scale)return;ctx.beginPath();ctx.ellipse(p.x,p.y+8*layout.scale,r,r*.45,0,0,Math.PI*2);ctx.strokeStyle='#21170d';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.stroke();if(!label)return;ctx.font='12px Georgia';const width=ctx.measureText(label).width+10,left=Math.max(layout.dx+2,Math.min(layout.dx+layout.w*layout.scale-width-2,p.x+12)),top=Math.max(layout.dy+2,Math.min(layout.dy+layout.h*layout.scale-20,p.y-30*layout.scale));ctx.fillStyle='#231b12';ctx.fillRect(left,top,width,18);ctx.fillStyle=color;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(label,left+5,top+9);}
 const destination=targets[0]||view.destination;
 if(actor&&valid(destination)){
  const path=[actor,destination];
  ctx.beginPath();path.forEach((p,i)=>{const q=pos(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=view.kind==='move'?'#ffe19a':'#ffad91';ctx.lineWidth=2;ctx.setLineDash(view.preview?[4,4]:[]);ctx.stroke();ctx.setLineDash([]);
  const from=pos(actor),to=pos(destination),angle=Math.atan2(to.y-from.y,to.x-from.x);ctx.beginPath();ctx.moveTo(to.x,to.y);ctx.lineTo(to.x-9*Math.cos(angle-.5),to.y-9*Math.sin(angle-.5));ctx.lineTo(to.x-9*Math.cos(angle+.5),to.y-9*Math.sin(angle+.5));ctx.closePath();ctx.fillStyle=view.kind==='move'?'#ffe19a':'#ffad91';ctx.fill();
 }
 if(actor)mark(actor,'#ffe19a',view.kind==='move'?'Déplacement':'Attaquant');
 targets.forEach((target,index)=>mark(target,target.enemy===false?'#91e4e5':'#ffad91',index===0?(target.enemy===false?'Cible alliée':'Cible'):null));
 if(!targets.length&&valid(view.destination))mark(view.destination,'#ffe19a',view.kind==='spell'?'Zone du sort':'Destination');
 ctx.restore();
}
