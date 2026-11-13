import {paintSiegeTargets,paintVerticalFortifications} from './battle-siege.mjs';
import {BATTLE_HEX_VERTICES} from './battle-scene.mjs';
import {paintBattleAction} from './battle-director.mjs';
import {battleGuidance} from './battle-guidance.mjs';

// Project the native board while retaining native legality and upright artwork.
export function verticalBattleGeometry(width,height){
 const scale=Math.min((width-8)/492,(height-12)/800);
 const left=(width-492*scale)/2,centeredTop=(height-800*scale)/2;
 // Use the lower grass margin, reserving room for the last stack's counter.
 const spare=height-8-(centeredTop+(800-58)*scale+22);
 const top=centeredTop+Math.max(0,Math.min(32,spare));
 return {scale,left,top,project:({x,y})=>({x:left+(y-66)*scale,y:top+(800-x)*scale}),unproject:({x,y})=>({x:800-(y-top)/scale,y:66+(x-left)/scale})};
}
// Interpolate native animation positions, never game state or target coordinates.
export function animatedBattlePosition(previous,next,elapsed,duration=50){
 const t=Math.max(0,Math.min(1,elapsed/duration));
 return {x:previous.x+(next.x-previous.x)*t,y:previous.y+(next.y-previous.y)*t};
}
let previousBounds=null,poses=new Map(),lastTime=0,gridLayer=null,gridCells=null,gridUnits=null,gridSignature='';
export function resetVerticalBattle(){previousBounds=null;poses.clear();lastTime=0;gridLayer=null;gridCells=null;gridUnits=null;}
// Hex geometry is static between native legality/occupancy updates. Reuse its
// transparent raster at the exact backing resolution; sprites and effects stay live.
function paintVerticalGrid(ctx,width,height,state,geometry,cellPath){
 const cells=state.battleCells||[],units=state.battleUnits||[];
 const occupied=new Set(units.flatMap(u=>u.occupied||[]));
 const draw=(target,path)=>{for(const cell of cells){path(target,cell);const reachable=cell.reachable&&!occupied.has(cell.hex);target.fillStyle=reachable?'#f7d77430':'#00000008';target.fill();target.strokeStyle=reachable?'#ffe082':'#e6d89975';target.lineWidth=reachable?1.5:.7;target.stroke();}};
 const doc=ctx.canvas?.ownerDocument;
 if(!doc){draw(ctx,(target,cell)=>cellPath(cell));return;}
 if(cells!==gridCells||units!==gridUnits){
  const signature=JSON.stringify([cells.map(c=>[c.hex,c.x,c.y,!!c.reachable]),[...occupied].sort((a,b)=>a-b)]);
  gridSignature=signature;
  gridCells=cells;gridUnits=units;
 }
 const density=ctx.getTransform(),w=Math.max(1,Math.round(width*density.a)),h=Math.max(1,Math.round(height*density.d));
 const key=[width,height,w,h].join(':');
 if(!gridLayer||gridLayer.key!==key||gridLayer.signature!==gridSignature){
  const canvas=gridLayer?.canvas||doc.createElement('canvas');if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
  const target=canvas.getContext('2d');target.setTransform(density.a,0,0,density.d,0,0);target.clearRect(0,0,width,height);
  draw(target,(target,cell)=>{target.beginPath();for(const [i,[dx,dy]]of BATTLE_HEX_VERTICES.entries()){const p=geometry.project({x:cell.x+dx,y:cell.y+dy});i?target.lineTo(p.x,p.y):target.moveTo(p.x,p.y);}target.closePath();});
  gridLayer={canvas,key,signature:gridSignature};
 }
 ctx.drawImage(gridLayer.canvas,0,0,width,height);
}
export function paintVerticalBattle(ctx,width,height,state,selected,planes,atlas,ids,bounds,tracking){
 if(!planes?.ground||!atlas||!ids||!bounds?.length)return null;
 const now=performance.now();
 // Each atlas is an immutable RGBA frame; interpolate positions across frames.
 // A new battle explicitly resets the pose history through resetVerticalBattle().
 if(bounds!==previousBounds){
  const present=new Set(bounds.map(b=>b.stackId));for(const id of poses.keys())if(!present.has(id))poses.delete(id);
  for(const b of bounds){if(b.w<=0||b.h<=0||!ids.has(b.stackId))continue;const old=poses.get(b.stackId),target={x:b.renderX,y:b.renderY};
   const from=old?animatedBattlePosition(old.from,old.target,now-old.time,old.duration):target;
   poses.set(b.stackId,{b,from,target,time:now,duration:Math.max(25,Math.min(100,now-lastTime||50))});
  }previousBounds=bounds;lastTime=now;
 }
 const geometry=verticalBattleGeometry(width,height),{scale,project}=geometry,guidance=battleGuidance(state);
 ctx.save();ctx.fillStyle='#26351b';ctx.fillRect(0,0,width,height);
 const backdrop=planes.background;if(backdrop){const ratio=Math.max(width/backdrop.width,height/backdrop.height),bw=backdrop.width*ratio,bh=backdrop.height*ratio;ctx.drawImage(backdrop,(width-bw)/2,(height-bh)/2,bw,bh);}
 const plane=image=>{ctx.save();ctx.transform(0,-scale,scale,0,geometry.left-66*scale,geometry.top+800*scale);ctx.drawImage(image,0,0,800,600);ctx.restore();};
 plane(planes.ground);
 const siege=globalThis.window?.goonkSiegeAtlas,pieces=globalThis.window?.goonkSiegePieces||[];
 paintVerticalFortifications(ctx,state,project,scale,siege,pieces);

 const cellPath=cell=>{ctx.beginPath();for(const [index,[dx,dy]] of BATTLE_HEX_VERTICES.entries()){const p=project({x:cell.x+dx,y:cell.y+dy});index?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.closePath();};
 paintVerticalGrid(ctx,width,height,state,geometry,cellPath);
 const active=(state.battleUnits||[]).find(u=>u.stackId===state.activeStack),target=(state.battleUnits||[]).find(u=>selected&&Math.hypot(u.x-selected.x,u.y-selected.y)<18);
 const targetColor=target?.enemy?'#ff5757':target?'#b4a3ff':'#00f0ff';

 if(selected){const cell=(state.battleCells||[]).find(c=>Math.hypot(c.x-selected.x,c.y-selected.y)<18);if(cell){cellPath(cell);ctx.fillStyle=target?.enemy?'#ff575755':'#00f0ff66';ctx.fill();ctx.strokeStyle='#080c0f';ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle=targetColor;ctx.lineWidth=3;ctx.stroke();}}
 const units=new Map((state.battleUnits||[]).map(u=>[u.stackId,u]));geometry.units=[];
 const records=[...poses.values()].filter(({b})=>ids.has(b.stackId)).map(record=>({...record,p:project(animatedBattlePosition(record.from,record.target,now-record.time,record.duration))})).sort((a,b)=>a.p.y-b.p.y);
 for(const {b,p} of records){
  const unit=units.get(b.stackId),index=ids.get(b.stackId),size=Math.max(b.w,b.h)*scale*112/110;
  const x=p.x+(b.x+b.w/2-b.renderX)*scale,y=p.y+(b.y+b.h/2-b.renderY)*scale;
  if(unit)geometry.units.push({unit,left:x-b.w*scale/2,right:x+b.w*scale/2,top:y-b.h*scale/2,bottom:y+b.h*scale/2});
  ctx.drawImage(atlas,(index%8)*128+8,Math.floor(index/8)*128+8,112,112,x-size/2,y-size/2,size,size);
  if(unit){
   if(unit.stackId===state.activeStack){ctx.beginPath();ctx.ellipse(p.x,p.y,24*scale,7.5*scale,0,0,Math.PI*2);ctx.fillStyle='#00f0ff55';ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle='#00f0ff';ctx.lineWidth=3.5;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();}

  }
 }
 if(planes.effects)plane(planes.effects);
 // Project action paths into the upright field, keeping arrows and labels upright.
 paintBattleAction(ctx,tracking,{project,scale,dx:0,dy:0,w:width/scale,h:height/scale});
 // The same target categories as the classic field, above sprites and effects.
 geometry.markers=[];
 const marker=(unit,kind,color)=>{const p=project(unit),r=Math.max(7,10*scale),x=p.x+18*scale,y=p.y-8*scale;geometry.markers.push({unit,x,y,r:Math.max(14,r+4)});ctx.save();ctx.beginPath();ctx.arc(x,y,r+2,0,Math.PI*2);ctx.fillStyle='#101418e8';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();if(kind==='heal'){ctx.moveTo(x-r*.6,y);ctx.lineTo(x+r*.6,y);ctx.moveTo(x,y-r*.6);ctx.lineTo(x,y+r*.6);}else if(kind==='shot'){ctx.arc(x,y,r*.45,0,Math.PI*2);ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);}else{ctx.moveTo(x-r*.5,y+r*.5);ctx.lineTo(x+r*.5,y-r*.5);ctx.moveTo(x-r*.5,y-r*.5);ctx.lineTo(x+r*.5,y+r*.5);}ctx.stroke();ctx.restore();};
 for(const unit of guidance.shotTargets)marker(unit,'shot','#b2f5ff');for(const unit of guidance.meleeTargets)marker(unit,'melee','#ff6969');for(const unit of guidance.beneficialTargets)marker(unit,'heal','#b5f07a');for(const unit of guidance.spellTargets)marker(unit,unit.enemy?'shot':'heal','#b3a1ff');
 paintSiegeTargets(ctx,state,project);
 // Counters are the final overlay: sprites and spell effects cannot cover them.
 for(const {b,p} of records){const unit=units.get(b.stackId);if(!unit)continue;
  const label=String(unit.count??unit.amount??1),bw=Math.max(20,label.length*7+8),by=Math.max(2,Math.min(height-16,p.y+9));
  const bx=Math.max(1,Math.min(width-bw-1,p.x-bw/2));
  ctx.fillStyle=unit.enemy?'#671b26':'#3b2675';ctx.fillRect(bx,by,bw,13);ctx.strokeStyle='#ebd993';ctx.lineWidth=.8;ctx.strokeRect(bx,by,bw,13);ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff4cd';ctx.fillText(label,bx+bw/2,by+6.5);
 }
 geometry.pick=point=>pickVerticalUnit(point,geometry.units,geometry.markers);
 ctx.restore();return geometry;
}

export function pickVerticalUnit(point,units,markers=[]){
 const marker=markers.map(m=>({...m,d:Math.hypot(point.x-m.x,point.y-m.y)})).filter(m=>m.d<=m.r).sort((a,b)=>a.d-b.d)[0];
 if(marker)return marker.unit;
 return units.slice().reverse().find(r=>point.x>=r.left&&point.x<=r.right&&point.y>=r.top&&point.y<=r.bottom)?.unit;
}
