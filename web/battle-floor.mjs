import {paintBattleGrid,paintMovementRange} from './battle-scene.mjs';
import {battleGuidance} from './battle-guidance.mjs';
export function battleSpriteOcclusion(units,bounds){
 const boxes=[];
 for(const b of bounds||[]){
  if(!(b.w>0&&b.h>0))continue;
  const box={left:b.x-20,right:b.x+b.w+20,top:b.y-20,bottom:b.y+b.h+20};boxes.push(box);
  const unit=(units||[]).find(u=>u.stackId===b.stackId);
  if(unit&&Number.isFinite(b.renderX)&&Number.isFinite(b.renderY)){
   const dx=unit.x-b.renderX,dy=unit.y-b.renderY;
   boxes.push({left:box.left+dx,right:box.right+dx,top:box.top+dy,bottom:box.bottom+dy});
  }
 }
 return boxes;
}
export function paintBattleFloor(ctx,state,layout,bounds=globalThis.goonkBattleSpriteBounds){
 // Tactical ground marks are useful for choosing orders, not during playback.
 if(!Array.isArray(bounds)||!bounds.length||globalThis.goonkBattleSpriteBoundsComplete===false||!state.canAct||state.autoCombat||state.battleCamera?.active)return false;
 const units=state.battleUnits||[],boxes=battleSpriteOcclusion(units,bounds);
 paintBattleGrid(ctx,state.battleCells,layout,units,boxes);
 paintMovementRange(ctx,battleGuidance(state).cells,layout,units,boxes);
 return true;
}
