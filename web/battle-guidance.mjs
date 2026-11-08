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
 const meleeTargets=ready&&cap.combatReady?(state.battleUnits||[]).filter(unit=>unit.enemy&&unit.canMeleeAt===true&&!unit.canShootAt):[];
 const spellCells=cap.targeting?(state.battleCells||[]).filter(cell=>cell.spellTarget===true):[];
 const spellPositions=new Set(spellCells.map(cell=>cell.x+','+cell.y));
 const spellTargets=spellCells.length?(state.battleUnits||[]).filter(unit=>spellPositions.has(unit.x+','+unit.y)):[];
 const canHealOrBuff=ready&&cap.combatReady&&(
  state.creatureCanCast===true||
  state.activeUnit?.canHealOrBuff===true||
  ['archangel','mastergenie','firstaidtent','ogremage'].some(k=>(state.activeUnit?.key||'').toLowerCase().includes(k))||
  (state.activeUnit?.abilities||[]).some(a=>/soin|soign|guér|heal|resurrect|résurrect|bénéfique|beneficial/i.test(a))
 );
 const beneficialTargets=canHealOrBuff?(state.battleUnits||[]).filter(unit=>!unit.enemy&&unit.stackId!==actor.stackId):[];
 return {actor,ready,cells,shotTargets,meleeTargets,spellTargets,beneficialTargets,label:cap.tactics?'À placer':'À jouer'};
}
export function paintActiveCreature(ctx,guidance,layout){
 const {actor,ready}=guidance,label=translate(guidance.label);if(!ready||!actor)return;
 const x=layout.dx+(actor.x-layout.x)*layout.scale,y=layout.dy+(actor.y-layout.y)*layout.scale;
 // Do not pin an offscreen actor label to the edge of a target's close-up.
 if(x+44*layout.scale<layout.dx||x-44*layout.scale>layout.dx+layout.w*layout.scale||y+16*layout.scale<layout.dy||y-88*layout.scale>layout.dy+layout.h*layout.scale)return;
 const radius=24*layout.scale,foot=y+14*layout.scale;
 ctx.save();ctx.beginPath();ctx.ellipse(x,foot,radius,7*layout.scale,0,0,Math.PI*2);ctx.strokeStyle='#231606';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#ffe082';ctx.lineWidth=3;ctx.stroke();

 // Floating downward-pointing golden arrowhead/chevron directly above the active creature
 const arrowTipY=y-34*layout.scale;
 const arrowW=8*layout.scale;
 const arrowH=10*layout.scale;
 ctx.beginPath();
 ctx.moveTo(x,arrowTipY);
 ctx.lineTo(x-arrowW,arrowTipY-arrowH);
 ctx.lineTo(x-arrowW*0.45,arrowTipY-arrowH);
 ctx.lineTo(x-arrowW*0.45,arrowTipY-arrowH-6*layout.scale);
 ctx.lineTo(x+arrowW*0.45,arrowTipY-arrowH-6*layout.scale);
 ctx.lineTo(x+arrowW*0.45,arrowTipY-arrowH);
 ctx.lineTo(x+arrowW,arrowTipY-arrowH);
 ctx.closePath();
 ctx.fillStyle='#ffd54f';ctx.fill();
 ctx.strokeStyle='#231606';ctx.lineWidth=2.5;ctx.stroke();

 const size=Math.max(12,Math.min(16,14*layout.scale));ctx.font=`bold ${size}px Georgia, serif`;const width=ctx.measureText(label).width+16,height=size+10;
 const bodyRadius=(actor.occupied?.length>1?66:44)*layout.scale,right=x+bodyRadius+8;
 const left=Math.max(layout.dx+3,Math.min(layout.dx+layout.w*layout.scale-width-3,right+width<=layout.dx+layout.w*layout.scale-3?right:x-bodyRadius-width-8));
 const top=Math.max(layout.dy+3,Math.min(layout.dy+layout.h*layout.scale-height-3,y-56*layout.scale));

 // Connecting leader line from the badge to the overhead pointer
 const anchorX=left<x?left+width:left;
 const anchorY=top+height/2;
 ctx.beginPath();
 ctx.moveTo(anchorX,anchorY);
 ctx.lineTo(x,arrowTipY-arrowH);
 ctx.strokeStyle='#ffd54f';ctx.lineWidth=2;ctx.stroke();

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

export function paintMeleeTargets(ctx,targets,layout){
 if(!targets.length)return;
 const {dx,dy,w,h,scale}=layout,s=Math.max(7,Math.min(12,10*scale));
 ctx.save();
 ctx.beginPath();
 ctx.rect(dx,dy,w*scale,h*scale);
 ctx.clip();
 for(const target of targets){
  const x=dx+(target.x-layout.x)*scale,y=dy+(target.y+14-layout.y)*scale;
  if(x<dx||x>dx+w*scale||y<dy||y>dy+h*scale)continue;
  ctx.save();
  ctx.translate(x,y);
  ctx.beginPath();
  ctx.arc(0,0,s+3,0,Math.PI*2);
  ctx.fillStyle='rgba(35,10,10,0.88)';
  ctx.fill();
  ctx.strokeStyle='#e53935';
  ctx.lineWidth=2;
  ctx.stroke();
  for(const angle of [-Math.PI/4,Math.PI/4]){
   ctx.save();
   ctx.rotate(angle);
   ctx.beginPath();
   ctx.moveTo(0,s);
   ctx.lineTo(-s*0.22,0);
   ctx.lineTo(-s*0.18,-s*0.35);
   ctx.lineTo(s*0.18,-s*0.35);
   ctx.lineTo(s*0.22,0);
   ctx.closePath();
   ctx.fillStyle='#f5f8fa';
   ctx.strokeStyle='#1a140e';
   ctx.lineWidth=0.8;
   ctx.fill();
   ctx.stroke();
   ctx.fillStyle='#d4af37';
   ctx.strokeStyle='#1a140e';
   ctx.beginPath();
   ctx.rect(-s*0.45,-s*0.45,s*0.9,s*0.16);
   ctx.fill();
   ctx.stroke();
   ctx.fillStyle='#6d1a10';
   ctx.fillRect(-s*0.1,-s*0.75,s*0.2,s*0.3);
   ctx.beginPath();
   ctx.arc(0,-s*0.85,s*0.14,0,Math.PI*2);
   ctx.fillStyle='#d4af37';
   ctx.fill();
   ctx.stroke();
   ctx.restore();
  }
  ctx.restore();
 }
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
