import {battleCapabilities} from './battle-phase.mjs';
export function battleGuidance(state){
 const actor=state.activeStack===undefined?null:(state.battleUnits||[]).find(unit=>unit.stackId===state.activeStack);
 const cap=battleCapabilities(state),ready=!!actor&&!actor.enemy&&cap.move&&(!cap.tactics||cap.endTactics);
 const occupied=new Set((state.battleUnits||[]).flatMap(unit=>unit.occupied||[]));
 // Native reachability includes tactics, speed, obstacles, wide stacks and defended gates.
 const cells=ready?(state.battleCells||[]).filter(cell=>cell.reachable&&!occupied.has(cell.hex)):[];
 return {actor,ready,cells,label:cap.tactics?'À placer':'À jouer'};
}
export function paintActiveCreature(ctx,guidance,layout){
 const {actor,ready,label}=guidance;if(!ready||!actor)return;
 const x=layout.dx+(actor.x-layout.x)*layout.scale,y=layout.dy+(actor.y-layout.y)*layout.scale;
 const radius=24*layout.scale,foot=y+14*layout.scale;
 ctx.save();ctx.beginPath();ctx.ellipse(x,foot,radius,7*layout.scale,0,0,Math.PI*2);ctx.strokeStyle='#231606';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#ffe082';ctx.lineWidth=3;ctx.stroke();
 const size=Math.max(12,Math.min(16,14*layout.scale));ctx.font=`bold ${size}px Georgia, serif`;const width=ctx.measureText(label).width+16,height=size+10;
 const bodyRadius=(actor.occupied?.length>1?66:44)*layout.scale,right=x+bodyRadius+8;
 const left=Math.max(layout.dx+3,Math.min(layout.dx+layout.w*layout.scale-width-3,right+width<=layout.dx+layout.w*layout.scale-3?right:x-bodyRadius-width-8));
 const top=Math.max(layout.dy+3,Math.min(layout.dy+layout.h*layout.scale-height-3,y-56*layout.scale));
 ctx.fillStyle='#2d1b09';ctx.fillRect(left,top,width,height);ctx.strokeStyle='#ffe082';ctx.lineWidth=2;ctx.strokeRect(left,top,width,height);ctx.fillStyle='#fff0c2';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,left+width/2,top+height/2);ctx.restore();
}
