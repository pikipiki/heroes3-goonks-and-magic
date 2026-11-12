import {paintSiegeTargets,paintVerticalFortifications} from './battle-siege.mjs';
import {BATTLE_HEX_VERTICES} from './battle-scene.mjs';
import {battleGuidance} from './battle-guidance.mjs';

// Project the native board while retaining native legality and upright artwork.
export function verticalBattleGeometry(width,height){
 const scale=Math.min((width-8)/492,(height-12)/800);
 const left=(width-492*scale)/2,top=(height-800*scale)/2;
 return {scale,left,top,project:({x,y})=>({x:left+(y-66)*scale,y:top+(800-x)*scale}),unproject:({x,y})=>({x:800-(y-top)/scale,y:66+(x-left)/scale})};
}
// Interpolate native animation positions, never game state or target coordinates.
export function animatedBattlePosition(previous,next,elapsed,duration=50){
 const t=Math.max(0,Math.min(1,elapsed/duration));
 return {x:previous.x+(next.x-previous.x)*t,y:previous.y+(next.y-previous.y)*t};
}
let previousBounds=null,previousAtlas=null,poses=new Map(),lastTime=0;
export function resetVerticalBattle(){previousBounds=null;previousAtlas=null;poses.clear();lastTime=0;}
export function paintVerticalBattle(ctx,width,height,state,selected,planes,atlas,ids,bounds){
 if(!planes?.ground||!atlas||!ids||!bounds?.length)return null;
 const now=performance.now();
 if(atlas!==previousAtlas){poses.clear();previousBounds=null;previousAtlas=atlas;}
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
 const occupied=new Set((state.battleUnits||[]).flatMap(u=>u.occupied||[]));
 for(const cell of state.battleCells||[]){cellPath(cell);const reachable=cell.reachable&&!occupied.has(cell.hex);ctx.fillStyle=reachable?'#f7d77430':'#00000008';ctx.fill();ctx.strokeStyle=reachable?'#ffe082':'#e6d89975';ctx.lineWidth=reachable?1.5:.7;ctx.stroke();}
 const active=(state.battleUnits||[]).find(u=>u.stackId===state.activeStack),target=(state.battleUnits||[]).find(u=>selected&&Math.hypot(u.x-selected.x,u.y-selected.y)<18);
 const targetColor=target?.enemy?'#ff5757':target?'#b4a3ff':'#00f0ff';
 if(selected&&active){const a=project(active),b=project(selected);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#080c0f';ctx.lineWidth=5;ctx.stroke();ctx.setLineDash([6,4]);ctx.strokeStyle=targetColor;ctx.lineWidth=2.5;ctx.stroke();ctx.setLineDash([]);}
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
   const label=String(unit.count??unit.amount??1),bw=Math.max(20,label.length*7+8),by=p.y+9;ctx.fillStyle=unit.enemy?'#671b26':'#3b2675';ctx.fillRect(p.x-bw/2,by,bw,13);ctx.strokeStyle='#ebd993';ctx.lineWidth=.8;ctx.strokeRect(p.x-bw/2,by,bw,13);ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff4cd';ctx.fillText(label,p.x,by+6.5);
  }
 }
 if(planes.effects)plane(planes.effects);
 // The same target categories as the classic field, above sprites and effects.
 const marker=(unit,kind,color)=>{const p=project(unit),r=Math.max(7,10*scale),x=p.x+18*scale,y=p.y-8*scale;ctx.save();ctx.beginPath();ctx.arc(x,y,r+2,0,Math.PI*2);ctx.fillStyle='#101418e8';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();if(kind==='heal'){ctx.moveTo(x-r*.6,y);ctx.lineTo(x+r*.6,y);ctx.moveTo(x,y-r*.6);ctx.lineTo(x,y+r*.6);}else if(kind==='shot'){ctx.arc(x,y,r*.45,0,Math.PI*2);ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);}else{ctx.moveTo(x-r*.5,y+r*.5);ctx.lineTo(x+r*.5,y-r*.5);ctx.moveTo(x-r*.5,y-r*.5);ctx.lineTo(x+r*.5,y+r*.5);}ctx.stroke();ctx.restore();};
 for(const unit of guidance.shotTargets)marker(unit,'shot','#b2f5ff');for(const unit of guidance.meleeTargets)marker(unit,'melee','#ff6969');for(const unit of guidance.beneficialTargets)marker(unit,'heal','#b5f07a');for(const unit of guidance.spellTargets)marker(unit,unit.enemy?'shot':'heal','#b3a1ff');
 paintSiegeTargets(ctx,state,project);
 geometry.pick=point=>geometry.units.slice().reverse().find(r=>point.x>=r.left&&point.x<=r.right&&point.y>=r.top&&point.y<=r.bottom)?.unit;
 ctx.restore();return geometry;
}
