import {fitRegion} from './mobile-layout.mjs';
export const NATIVE_BATTLE_REGION={x:0,y:0,w:800,h:555};
// The native framebuffer is never rotated, flattened or rebuilt from unit icons.
export function fitNativeBattle(width,height,focus,view='auto'){
 const base=Math.min(width/800,height/555),close=view==='close'||(view==='auto'&&height>width),cover=Math.max(width/800,height/555);
 return fitRegion(width,height,NATIVE_BATTLE_REGION,close?cover/base:1,focus);
}
export function nativeBattleClose(width,height,view){return view==='close'||(view==='auto'&&height>width);}
export function paintMovementRange(ctx,cells,layout){ctx.save();ctx.strokeStyle='#ffde8b99';ctx.lineWidth=1;for(const cell of cells||[]){if(!cell.reachable||cell.kind>=2)continue;const vertices=[[0,-23],[20,-12],[20,12],[0,23],[-20,12],[-20,-12]];ctx.beginPath();vertices.forEach(([x,y],i)=>{const xx=layout.dx+(cell.x+x-layout.x)*layout.scale,yy=layout.dy+(cell.y+y-layout.y)*layout.scale;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.closePath();ctx.stroke();}ctx.restore();}
export function configureMobileBattle(FS,enabled){if(!enabled)return;const path='/home/web_user/.config/vcmi/settings.json';let value={};try{const existing=FS.readFile(path,{encoding:'utf8'});if(existing.trim())value=JSON.parse(existing);}catch(error){if(FS.analyzePath(path).exists)throw error;}
 value.battle={...value.battle,cellBorders:false,stackRange:false,movementHighlightOnHover:false,rangeLimitHighlightOnHover:false,stickyHeroInfoWindows:false,showQueue:false,queueSize:'small',queueSmallSlots:8};FS.writeFile(path,JSON.stringify(value));}

export function drawUnit(ctx,unit,atlas,ids,x,y,size){
 const index=ids?.get(unit.stackId);if(atlas&&index!==undefined){ctx.drawImage(atlas,index%8*128+8,Math.floor(index/8)*128+8,112,112,x-size/2,y-size/2,size,size);return true;}return false;
}
