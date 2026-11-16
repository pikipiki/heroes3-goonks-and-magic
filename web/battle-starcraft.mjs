// Actual StarCraft weapons replace the generic action-preview beam during fire.
export function starcraftAttackActive(state){const camera=state.battleCamera;return !!(camera?.active&&camera.kind==='attack'&&(state.battleUnits||[]).some(u=>u.stackId===camera.actor?.stackId&&u.key?.startsWith('heroes-starcraft:')));}
// Preserve native animation playback. Only lift living silhouettes above idle
// target overlays; the vertical compositor already draws its interpolated bodies.
export function paintStarcraftUnits(ctx,state,layout,atlas=globalThis.goonkBattleAtlas,ids=globalThis.goonkBattleAtlasIds,bounds=globalThis.goonkBattleSpriteBounds){
 const drawn=[];ctx.save();ctx.beginPath();ctx.rect(layout.dx,layout.dy,layout.w*layout.scale,layout.h*layout.scale);ctx.clip();
 const replaying=state.canAct===false||state.autoCombat||state.battleCamera?.active||layout.nativeBodies;
 for(const unit of [...(state.battleUnits||[]),...(state.battleCasualties||[])]){if(!unit.key?.startsWith('heroes-starcraft:'))continue;
  // Native corpses already sit on the battlefield. Do not cover living units
  // with another casualty badge in the presentation overlay.
  if(unit.count<=0)continue;
  if(replaying||!atlas||!ids||!bounds)continue;const b=bounds.find(row=>row.stackId===unit.stackId),index=ids.get(unit.stackId);if(!b||!b.w||!b.h||index===undefined)continue;
  if(Number.isFinite(unit.x)&&Number.isFinite(unit.y)&&Math.hypot(b.renderX-unit.x,b.renderY-unit.y)>4)continue;
  const p=layout.project?layout.project({x:b.renderX,y:b.renderY}):{x:layout.dx+(b.renderX-layout.x)*layout.scale,y:layout.dy+(b.renderY-layout.y)*layout.scale};
  const x=p.x+(b.x+b.w/2-b.renderX)*layout.scale,y=p.y+(b.y+b.h/2-b.renderY)*layout.scale,size=Math.max(b.w,b.h)*layout.scale*112/110;
  ctx.drawImage(atlas,index%8*128+8,Math.floor(index/8)*128+8,112,112,x-size/2,y-size/2,size,size);drawn.push(unit.stackId);
 }ctx.restore();return drawn;
}
