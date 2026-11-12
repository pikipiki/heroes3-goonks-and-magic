import {getLanguage} from './i18n.mjs';
import {battleCapabilities} from './battle-phase.mjs';
import {BATTLE_HEX_VERTICES} from './battle-scene.mjs';
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
 const nativeActions=(state.battleCells||[]).some(cell=>Object.hasOwn(cell,'actionLabel'));
 const beneficialTargets=canHealOrBuff?(state.battleUnits||[]).filter(unit=>!unit.enemy&&(nativeActions?(state.battleCells||[]).some(cell=>cell.x===unit.x&&cell.y===unit.y&&/^(Cast |Heal)/.test(cell.actionLabel||'')):unit.stackId!==actor.stackId)):[];
 return {actor,ready,cells,shotTargets,meleeTargets,spellTargets,beneficialTargets,label:cap.tactics?'À placer':'À jouer'};
}
export function paintActiveCreature(ctx,guidance,layout){
 const {actor,ready}=guidance;if(!ready||!actor)return;
 const x=layout.dx+(actor.x-layout.x)*layout.scale,y=layout.dy+(actor.y-layout.y)*layout.scale;
 // Keep the marker at the actor's feet when the camera frames another target.
 if(x+44*layout.scale<layout.dx||x-44*layout.scale>layout.dx+layout.w*layout.scale||y+16*layout.scale<layout.dy||y-88*layout.scale>layout.dy+layout.h*layout.scale)return;
 const radius=24*layout.scale,foot=y+14*layout.scale;
 ctx.save();
 ctx.beginPath();
 ctx.ellipse(x,foot,radius,7.5*layout.scale,0,0,Math.PI*2);
 // Luminous electric cyan fill to contrast intensely against the yellow hex grid
 ctx.fillStyle='rgba(0,240,255,0.32)';
 ctx.fill();
 ctx.strokeStyle='#000000';ctx.lineWidth=6;ctx.stroke();
 ctx.strokeStyle='#00f0ff';ctx.lineWidth=3.5;ctx.stroke();
 ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.stroke();

 ctx.restore();
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

export function paintSelectedTile(ctx,selected,layout,state,isMove=true){
 if(!selected||state.mode!=='battle')return;
 const guidance=battleGuidance(state);
 const units=state.battleUnits||[];
 const targetUnit=units.find(u=>Math.hypot(u.x-selected.x,u.y-selected.y)<16);
 const isEnemy=targetUnit?.enemy===true;
 const isAlly=targetUnit&&!targetUnit.enemy;
 const isShot=(guidance.shotTargets||[]).some(u=>Math.hypot(u.x-selected.x,u.y-selected.y)<16);
 const isMelee=(guidance.meleeTargets||[]).some(u=>Math.hypot(u.x-selected.x,u.y-selected.y)<16);
 const isSpell=(guidance.spellTargets||[]).some(u=>Math.hypot(u.x-selected.x,u.y-selected.y)<16);
 const isBeneficial=(guidance.beneficialTargets||[]).some(u=>Math.hypot(u.x-selected.x,u.y-selected.y)<16);
 const px=layout.dx+(selected.x-layout.x)*layout.scale;
 const py=layout.dy+(selected.y-layout.y)*layout.scale;
 const fr=getLanguage()==='fr';

 const fillColor=isEnemy?'rgba(235,40,40,0.55)':(isAlly||isBeneficial)?'rgba(30,195,200,0.5)':'rgba(255,230,0,0.6)';
 const strokeColor=isEnemy?'#ff4d4d':(isAlly||isBeneficial)?'#50e6ff':'#ffffff';
 const shadowColor='#000000';

 ctx.save();

 if(guidance.actor&&((isMove&&!targetUnit)||(isMelee&&targetUnit))){
  const ax=layout.dx+(guidance.actor.x-layout.x)*layout.scale;
  const ay=layout.dy+(guidance.actor.y-layout.y)*layout.scale;
  const lineColor=isMelee?'#ff4d4d':'#ffe640';
  ctx.beginPath();ctx.moveTo(ax,ay);
  ctx.lineTo(px,py);
  ctx.strokeStyle='#000000';
  ctx.lineWidth=Math.max(3,5*layout.scale);
  ctx.stroke();
  ctx.strokeStyle=lineColor;
  ctx.lineWidth=Math.max(1.5,2.5*layout.scale);
  ctx.setLineDash([Math.max(4,6*layout.scale),Math.max(3,4*layout.scale)]);
  ctx.stroke();
  ctx.setLineDash([]);
  const angle=Math.atan2(py-ay,px-ax);
  const arrowLen=Math.max(8,12*layout.scale);
  ctx.beginPath();
  ctx.moveTo(px,py);
  ctx.lineTo(px-arrowLen*Math.cos(angle-0.45),py-arrowLen*Math.sin(angle-0.45));
  ctx.lineTo(px-arrowLen*Math.cos(angle+0.45),py-arrowLen*Math.sin(angle+0.45));
  ctx.closePath();
  ctx.fillStyle=lineColor;
  ctx.fill();
  ctx.strokeStyle='#000000';
  ctx.lineWidth=1;
  ctx.stroke();
 }

 ctx.beginPath();
 BATTLE_HEX_VERTICES.forEach(([vx,vy],i)=>{
  const hx=px+vx*layout.scale;
  const hy=py+vy*layout.scale;
  i?ctx.lineTo(hx,hy):ctx.moveTo(hx,hy);
 });
 ctx.closePath();
 ctx.fillStyle=fillColor;
 ctx.fill();
 ctx.strokeStyle=shadowColor;
 ctx.lineWidth=Math.max(4,5*layout.scale);
 ctx.lineJoin='round';
 ctx.stroke();
 ctx.strokeStyle=strokeColor;
 ctx.lineWidth=Math.max(2,2.5*layout.scale);
 ctx.stroke();

 const reticleR=Math.max(10,16*layout.scale);
 ctx.beginPath();
 ctx.arc(px,py,reticleR,0,Math.PI*2);
 ctx.strokeStyle=shadowColor;
 ctx.lineWidth=Math.max(2.5,4*layout.scale);
 ctx.stroke();
 ctx.strokeStyle=strokeColor;
 ctx.lineWidth=Math.max(1.5,2*layout.scale);
 ctx.stroke();

 ctx.beginPath();
 ctx.arc(px,py,Math.max(2.5,4*layout.scale),0,Math.PI*2);
 ctx.fillStyle=strokeColor;
 ctx.fill();

 const tickDist=reticleR+1;
 const tickLen=Math.max(4,7*layout.scale);
 ctx.strokeStyle=strokeColor;
 ctx.lineWidth=Math.max(1.5,2*layout.scale);
 ctx.beginPath();
 ctx.moveTo(px-tickDist-tickLen,py);ctx.lineTo(px-tickDist,py);
 ctx.moveTo(px+tickDist,py);ctx.lineTo(px+tickDist+tickLen,py);
 ctx.moveTo(px,py-tickDist-tickLen);ctx.lineTo(px,py-tickDist);
 ctx.moveTo(px,py+tickDist);ctx.lineTo(px,py+tickDist+tickLen);
 ctx.stroke();


 ctx.restore();
}
