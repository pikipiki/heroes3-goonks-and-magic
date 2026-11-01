import {fitRegion} from './mobile-layout.mjs';
export const NATIVE_BATTLE_REGION={x:0,y:0,w:800,h:555};
// The native framebuffer is never rotated, flattened or rebuilt from unit icons.
export function fitNativeBattle(width,height,focus,view='auto'){
 const base=Math.min(width/800,height/555),close=view==='close'||(view==='auto'&&height>width),cover=Math.max(width/800,height/555);
 return fitRegion(width,height,NATIVE_BATTLE_REGION,close?cover/base:1,focus);
}
export function nativeBattleClose(width,height,view){return view==='close'||(view==='auto'&&height>width);}
export function paintMovementRange(ctx,cells,layout,units=[]){
 const boxes=units.map(u=>({left:u.x-44,right:u.x+44,top:u.y-88,bottom:u.y+16}));
 ctx.save();ctx.strokeStyle='#ffe082';ctx.fillStyle='#f7d77430';ctx.lineWidth=1.5;
 for(const cell of cells||[]){
  if(!cell.reachable||boxes.some(b=>cell.x+22>b.left&&cell.x-22<b.right&&cell.y+26>b.top&&cell.y-26<b.bottom))continue;
  ctx.beginPath();BATTLE_HEX_VERTICES.forEach(([x,y],i)=>{const xx=layout.dx+(cell.x+x-layout.x)*layout.scale,yy=layout.dy+(cell.y+y-layout.y)*layout.scale;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.closePath();ctx.fill();ctx.stroke();
 }
 ctx.restore();
}
export function battleFocus(state,manual,previous){return manual||state.focus||(state.battleUnits||[]).find(u=>state.activeStack!==undefined&&u.stackId===state.activeStack)||(state.battleUnits||[]).find(u=>state.activeUnit?.id!==undefined&&u.id===state.activeUnit.id&&!u.enemy)||(state.battleUnits||[]).find(u=>!u.enemy)||previous||{x:400,y:277};}
export const BATTLE_HEX_VERTICES=[[0,-26],[22,-16],[22,16],[0,26],[-22,16],[-22,-16]];
export function paintBattleGrid(ctx,cells,layout,units=[]){
 const boxes=units.map(u=>{const occupied=(cells||[]).filter(c=>u.occupied?.includes(c.hex)),xs=[u.x,...occupied.map(c=>c.x)];return {left:Math.min(...xs)-44,right:Math.max(...xs)+44,top:u.y-88,bottom:u.y+16};});
 ctx.save();ctx.beginPath();for(const cell of cells||[]){if(boxes.some(b=>cell.x+22>b.left&&cell.x-22<b.right&&cell.y+26>b.top&&cell.y-26<b.bottom))continue;BATTLE_HEX_VERTICES.forEach(([x,y],i)=>{const xx=layout.dx+(cell.x+x-layout.x)*layout.scale,yy=layout.dy+(cell.y+y-layout.y)*layout.scale;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.closePath();}
 ctx.strokeStyle='#16160ed9';ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='#f8e8af85';ctx.lineWidth=.8;ctx.stroke();ctx.restore();
}
export function configureMobileBattle(FS,enabled){if(!enabled)return;const path='/home/web_user/.config/vcmi/settings.json';let value={};try{const existing=FS.readFile(path,{encoding:'utf8'});if(existing.trim())value=JSON.parse(existing);}catch(error){if(FS.analyzePath(path).exists)throw error;}
 value.battle={...value.battle,cellBorders:false,stackRange:false,movementHighlightOnHover:false,rangeLimitHighlightOnHover:false,stickyHeroInfoWindows:false,showQueue:false,queueSize:'small',queueSmallSlots:8};FS.writeFile(path,JSON.stringify(value));}

export function drawUnit(ctx,unit,atlas,ids,x,y,size){
 const index=ids?.get(unit.stackId);if(atlas&&index!==undefined){ctx.drawImage(atlas,index%8*128+8,Math.floor(index/8)*128+8,112,112,x-size/2,y-size/2,size,size);return true;}return false;
}
