// Small crossover silhouettes must stay legible when giant Heroes overlap them.
// Redraw their real native atlas pose above body/target overlays; never invent units.
export function paintStarcraftUnits(ctx,state,layout,atlas=globalThis.goonkBattleAtlas,ids=globalThis.goonkBattleAtlasIds,bounds=globalThis.goonkBattleSpriteBounds){
 if(!atlas||!ids||!bounds)return [];
 const drawn=[];ctx.save();ctx.beginPath();ctx.rect(layout.dx,layout.dy,layout.w*layout.scale,layout.h*layout.scale);ctx.clip();
 for(const unit of state.battleUnits||[]){if(!unit.key?.startsWith('heroes-starcraft:')||unit.count<=0)continue;const b=bounds.find(row=>row.stackId===unit.stackId),index=ids.get(unit.stackId);if(!b||!b.w||!b.h||index===undefined)continue;
  const p=layout.project?layout.project({x:b.renderX,y:b.renderY}):{x:layout.dx+(b.renderX-layout.x)*layout.scale,y:layout.dy+(b.renderY-layout.y)*layout.scale};
  const x=p.x+(b.x+b.w/2-b.renderX)*layout.scale,y=p.y+(b.y+b.h/2-b.renderY)*layout.scale,size=Math.max(b.w,b.h)*layout.scale*112/110;
  ctx.drawImage(atlas,index%8*128+8,Math.floor(index/8)*128+8,112,112,x-size/2,y-size/2,size,size);
  ctx.strokeStyle=unit.enemy?'#ff9a7b':'#91e4ff';ctx.lineWidth=1;ctx.strokeRect(x-b.w*layout.scale/2-1,y-b.h*layout.scale/2-1,b.w*layout.scale+2,b.h*layout.scale+2);drawn.push(unit.stackId);
 }ctx.restore();return drawn;
}
