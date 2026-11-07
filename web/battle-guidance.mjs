import {translate} from './i18n.mjs';
import {battleCapabilities} from './battle-phase.mjs';
export function battleGuidance(state){
 const actor=state.activeStack===undefined?null:(state.battleUnits||[]).find(unit=>unit.stackId===state.activeStack);
 const cap=battleCapabilities(state),controlled=state.activeUnit?.controlled??!actor?.enemy;
 const ready=!!actor&&controlled&&!state.spellTargeting&&cap.move&&(!cap.tactics||cap.endTactics);
 const occupied=new Set((state.battleUnits||[]).flatMap(unit=>unit.occupied||[]));
 // Native reachability includes tactics, speed, obstacles, wide stacks and defended gates.
 const cells=ready?(state.battleCells||[]).filter(cell=>cell.reachable&&!occupied.has(cell.hex)):[];
 const shotTargets=ready&&cap.combatReady?(state.battleUnits||[]).filter(unit=>unit.enemy&&unit.canShootAt===true):[];
 const spellCells=cap.targeting?(state.battleCells||[]).filter(cell=>cell.spellTarget===true):[];
 const spellPositions=new Set(spellCells.map(cell=>cell.x+','+cell.y));
 const spellTargets=spellCells.length?(state.battleUnits||[]).filter(unit=>spellPositions.has(unit.x+','+unit.y)):[];
 return {actor,ready,cells,shotTargets,spellTargets,label:cap.tactics?'À placer':'À jouer'};
}
export function paintActiveCreature(ctx,guidance,layout){
 const {actor,ready}=guidance,label=translate(guidance.label);if(!ready||!actor)return;
 const x=layout.dx+(actor.x-layout.x)*layout.scale,y=layout.dy+(actor.y-layout.y)*layout.scale;
 // Do not pin an offscreen actor label to the edge of a target's close-up.
 if(x+44*layout.scale<layout.dx||x-44*layout.scale>layout.dx+layout.w*layout.scale||y+16*layout.scale<layout.dy||y-88*layout.scale>layout.dy+layout.h*layout.scale)return;
 const radius=24*layout.scale,foot=y+14*layout.scale;
 ctx.save();ctx.beginPath();ctx.ellipse(x,foot,radius,7*layout.scale,0,0,Math.PI*2);ctx.strokeStyle='#231606';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#ffe082';ctx.lineWidth=3;ctx.stroke();
 const size=Math.max(12,Math.min(16,14*layout.scale));ctx.font=`bold ${size}px Georgia, serif`;const width=ctx.measureText(label).width+16,height=size+10;
 const bodyRadius=(actor.occupied?.length>1?66:44)*layout.scale,right=x+bodyRadius+8;
 const left=Math.max(layout.dx+3,Math.min(layout.dx+layout.w*layout.scale-width-3,right+width<=layout.dx+layout.w*layout.scale-3?right:x-bodyRadius-width-8));
 const top=Math.max(layout.dy+3,Math.min(layout.dy+layout.h*layout.scale-height-3,y-56*layout.scale));
 ctx.fillStyle='#2d1b09';ctx.fillRect(left,top,width,height);ctx.strokeStyle='#ffe082';ctx.lineWidth=2;ctx.strokeRect(left,top,width,height);ctx.fillStyle='#fff0c2';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,left+width/2,top+height/2);ctx.restore();
}

export function paintShotTargets(ctx,targets,layout){
 if(!targets.length)return;
 const {dx,dy,w,h,scale}=layout,radius=Math.max(6,Math.min(10,9*scale));
 ctx.save();
 ctx.beginPath();
 ctx.rect(dx,dy,w*scale,h*scale);
 ctx.clip();
 ctx.beginPath();
 for(const target of targets){
  const x=dx+(target.x-layout.x)*scale,y=dy+(target.y+14-layout.y)*scale;
  if(x<dx||x>dx+w*scale||y<dy||y>dy+h*scale)continue;
  ctx.moveTo(x+radius,y);
  ctx.arc(x,y,radius,0,Math.PI*2);
  ctx.moveTo(x-radius-3,y);
  ctx.lineTo(x-radius+3,y);
  ctx.moveTo(x+radius-3,y);
  ctx.lineTo(x+radius+3,y);
  ctx.moveTo(x,y-radius-3);
  ctx.lineTo(x,y-radius+3);
  ctx.moveTo(x,y+radius-3);
  ctx.lineTo(x,y+radius+3);
 }
 ctx.strokeStyle='#102735';
 ctx.lineWidth=4;
 ctx.stroke();
 ctx.strokeStyle='#b2f5ff';
 ctx.lineWidth=2;
 ctx.stroke();
 ctx.restore();
}

export function paintSpellTargets(ctx,targets,layout){
 if(!targets.length)return;
 const {dx,dy,w,h,scale}=layout,radius=Math.max(6,Math.min(10,9*scale));
 ctx.save();
 ctx.beginPath();
 ctx.rect(dx,dy,w*scale,h*scale);
 ctx.clip();
 for(const target of targets){
  const x=dx+(target.x-layout.x)*scale,y=dy+(target.y+14-layout.y)*scale;
  if(x<dx||x>dx+w*scale||y<dy||y>dy+h*scale)continue;
  ctx.beginPath();
  if(target.enemy){
   ctx.moveTo(x,y-radius);
   ctx.lineTo(x+radius,y);
   ctx.lineTo(x,y+radius);
   ctx.lineTo(x-radius,y);
   ctx.closePath();
  }else{
   ctx.moveTo(x-radius,y);
   ctx.lineTo(x+radius,y);
   ctx.moveTo(x,y-radius);
   ctx.lineTo(x,y+radius);
  }
  ctx.lineJoin='round';
  ctx.strokeStyle='#23162b';
  ctx.lineWidth=5;
  ctx.stroke();
  ctx.strokeStyle=target.enemy?'#ffc0ff':'#b9ff9a';
  ctx.lineWidth=2.5;
  ctx.stroke();
 }
 ctx.restore();
}
