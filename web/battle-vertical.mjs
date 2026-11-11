import {BATTLE_HEX_VERTICES} from './battle-scene.mjs';

// Rotate the board coordinates, never the creature artwork. The engine remains
// authoritative for positions, animation frames, available cells and actions.
export function verticalBattleGeometry(width,height){
 const scale=Math.min((width-8)/492,(height-12)/800);
 const left=(width-492*scale)/2,top=(height-800*scale)/2;
 return {scale,left,top,project:({x,y})=>({x:left+(y-66)*scale,y:top+(800-x)*scale}),unproject:({x,y})=>({x:800-(y-top)/scale,y:66+(x-left)/scale})};
}
export function paintVerticalBattle(ctx,width,height,state,selected,planes,atlas,ids,bounds){
 if(!planes?.ground||!atlas||!ids||!bounds?.length)return null;
 const geometry=verticalBattleGeometry(width,height),{scale,project}=geometry;
 ctx.save();ctx.fillStyle='#26351b';ctx.fillRect(0,0,width,height);
 // Fill the backdrop before fitting the playable board. Extra screen area is
 // terrain rather than another status bar or an enlarged duplicate camera.
 ctx.save();ctx.globalAlpha=.65;ctx.drawImage(planes.ground,0,0,400,278,0,0,width,height);ctx.restore();
 const plane=image=>{ctx.save();ctx.transform(0,-scale,scale,0,geometry.left-66*scale,geometry.top+800*scale);ctx.drawImage(image,0,0,800,600);ctx.restore();};
 plane(planes.ground);
 const cellPath=cell=>{ctx.beginPath();for(const [index,[dx,dy]] of BATTLE_HEX_VERTICES.entries()){const p=project({x:cell.x+dx,y:cell.y+dy});index?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.closePath();};
 for(const cell of state.battleCells||[]){cellPath(cell);ctx.fillStyle=cell.reachable?'#e8c76235':'#00000008';ctx.fill();ctx.strokeStyle=cell.reachable?'#ffe082':'#e6d89975';ctx.lineWidth=cell.reachable?1.5:.7;ctx.stroke();}
 const active=(state.battleUnits||[]).find(u=>u.stackId===state.activeStack);
 if(selected&&active){const a=project(active),b=project(selected);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#15130c';ctx.lineWidth=4;ctx.stroke();ctx.setLineDash([6,4]);ctx.strokeStyle='#ffe683';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);}
 if(selected){const cell=(state.battleCells||[]).find(c=>Math.hypot(c.x-selected.x,c.y-selected.y)<18);if(cell){cellPath(cell);ctx.strokeStyle='#fff2a3';ctx.lineWidth=3;ctx.stroke();}}
 const units=new Map((state.battleUnits||[]).map(u=>[u.stackId,u]));
 geometry.units=[];
 const records=bounds.filter(b=>b.w>0&&b.h>0&&ids.has(b.stackId)).map(b=>({b,p:project({x:b.renderX,y:b.renderY})})).sort((a,b)=>a.p.y-b.p.y);
 for(const {b,p} of records){
  const unit=units.get(b.stackId),index=ids.get(b.stackId),size=Math.max(b.w,b.h)*scale*112/110;
  const x=p.x+(b.x+b.w/2-b.renderX)*scale,y=p.y+(b.y+b.h/2-b.renderY)*scale;
  if(unit)geometry.units.push({unit,left:x-size/2,right:x+size/2,top:y-size/2,bottom:y+size/2});
  if(unit?.stackId===state.activeStack){ctx.beginPath();ctx.ellipse(p.x,p.y,15*scale,7*scale,0,0,Math.PI*2);ctx.strokeStyle='#001b22';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#55f6ff';ctx.lineWidth=2;ctx.stroke();}
  ctx.drawImage(atlas,(index%8)*128+8,Math.floor(index/8)*128+8,112,112,x-size/2,y-size/2,size,size);
  if(unit){const label=String(unit.count??unit.amount??1),bw=Math.max(20,label.length*7+8),by=p.y+5;ctx.fillStyle=unit.enemy?'#671b26':'#3b2675';ctx.fillRect(p.x-bw/2,by,bw,13);ctx.strokeStyle='#ebd993';ctx.lineWidth=.8;ctx.strokeRect(p.x-bw/2,by,bw,13);ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff4cd';ctx.fillText(label,p.x,by+6.5);}
 }
 if(planes.effects)plane(planes.effects);
 geometry.pick=point=>geometry.units.slice().reverse().find(r=>point.x>=r.left&&point.x<=r.right&&point.y>=r.top&&point.y<=r.bottom)?.unit;
 ctx.restore();return geometry;
}
