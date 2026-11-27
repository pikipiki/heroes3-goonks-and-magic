export function siegeTargets(state){return (state.battleCells||[]).filter(c=>c.siegeTarget&&c.actionLabel==='Attack').map((cell,index)=>({...cell,enemy:true,name:'Wall section '+(index+1),count:'',siege:true}));}
export function siegePickerTargets(state,units,{allies=false}={}){const walls=allies||state.spellTargeting||state.creatureSpellTargeting?[]:siegeTargets(state);return !walls.length?units:state.activeUnit?.key==='core:catapult'?walls:[...units,...walls];}
export function paintSiegeTargets(ctx,state,project){
 for(const target of siegeTargets(state)){const p=project(target);ctx.save();ctx.strokeStyle='#05090c';ctx.lineWidth=6;ctx.beginPath();ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#ff7465';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-16,p.y);ctx.lineTo(p.x+16,p.y);ctx.moveTo(p.x,p.y-16);ctx.lineTo(p.x,p.y+16);ctx.stroke();ctx.restore();}
}

function paintVerticalGate(ctx,gate,cells,scale,height,depth){
 const left=cells.filter(c=>c.wallPart!==7&&c.p.x<gate.p.x).at(-1);
 const right=cells.find(c=>c.wallPart!==7&&c.p.x>gate.p.x);
 const halfSpan=26*scale;
 const lx=left&&Math.abs(gate.p.x-left.p.x)<95*scale?left.p.x:gate.p.x-halfSpan;
 const ly=left&&Math.abs(gate.p.x-left.p.x)<95*scale?left.p.y:gate.p.y;
 const rx=right&&Math.abs(right.p.x-gate.p.x)<95*scale?right.p.x:gate.p.x+halfSpan;
 const ry=right&&Math.abs(right.p.x-gate.p.x)<95*scale?right.p.y:gate.p.y;
 const dx=rx-lx,dy=ry-ly;
 const destroyed=gate.wallState<=0;
 const opened=!destroyed&&gate.kind===0;
 const damaged=gate.wallState===1;
 const gateH=height+2*scale;
 const pillarW=7*scale;
 const pillarH=height+depth+4*scale;

 // 1. Fallen or lowered drawbridge lies forward on the ground (+y toward attackers).
 if(destroyed||opened){
  const bridgeLen=(destroyed?30:26)*scale;
  const inset=0.1;
  const bx1=lx+dx*inset,by1=ly+dy*inset;
  const bx2=lx+dx*(1-inset),by2=ly+dy*(1-inset);
  // Shadow underneath fallen bridge
  ctx.fillStyle='rgba(12,8,4,0.45)';
  ctx.beginPath();ctx.moveTo(bx1-2*scale,by1+2*scale);ctx.lineTo(bx2+2*scale,by2+2*scale);ctx.lineTo(bx2+4*scale,by2+bridgeLen+4*scale);ctx.lineTo(bx1-4*scale,by1+bridgeLen+4*scale);ctx.closePath();ctx.fill();
  // Fallen wooden bridge deck
  ctx.fillStyle=destroyed?'#4a2c16':'#6b4222';
  ctx.beginPath();ctx.moveTo(bx1,by1);ctx.lineTo(bx2,by2);ctx.lineTo(bx2+2*scale,by2+bridgeLen);ctx.lineTo(bx1-2*scale,by1+bridgeLen);ctx.closePath();ctx.fill();
  // Horizontal planks on the fallen bridge
  ctx.strokeStyle='#261408';ctx.lineWidth=Math.max(1,scale);
  for(let r=1;r<=5;r++){
   const f=r/6;
   ctx.beginPath();ctx.moveTo(bx1-2*scale*f,by1+bridgeLen*f);ctx.lineTo(bx2+2*scale*f,by2+bridgeLen*f);ctx.stroke();
  }
  // Iron reinforcement straps
  ctx.strokeStyle=destroyed?'#5d6469':'#8d98a1';ctx.lineWidth=Math.max(1.5,2*scale);
  for(const f of [0.25,0.75]){
   ctx.beginPath();ctx.moveTo(bx1-2*scale*f,by1+bridgeLen*f);ctx.lineTo(bx2+2*scale*f,by2+bridgeLen*f);ctx.stroke();
  }
  if(destroyed){
   // Jagged break crack & wood/stone debris to show the gate was smashed down
   ctx.strokeStyle='#180c05';ctx.lineWidth=Math.max(1.5,2*scale);
   ctx.beginPath();
   ctx.moveTo(bx1+(bx2-bx1)*0.25,by1+bridgeLen*0.35);
   ctx.lineTo(bx1+(bx2-bx1)*0.52,by1+bridgeLen*0.52);
   ctx.lineTo(bx1+(bx2-bx1)*0.78,by1+bridgeLen*0.42);
   ctx.stroke();
   const rubble=[[0.15,0.85,5,3,'#6f5d47'],[0.45,1.06,6,3,'#3e2412'],[0.75,0.92,5,3,'#8a7558'],[0.3,0.18,4,3,'#5c4a35'],[0.68,0.15,5,3,'#3e2412']];
   for(const [u,v,rw,rh,color] of rubble){
    ctx.fillStyle=color;
    ctx.fillRect(bx1+(bx2-bx1)*u-rw*scale/2,by1+bridgeLen*v-rh*scale/2,rw*scale,rh*scale);
   }
  }
 }

 // 2. Flanking stone gateposts (left and right pillars).
 for(const [px,py] of [[lx,ly],[rx,ry]]){
  ctx.fillStyle='#3a2e24';
  ctx.fillRect(px-pillarW/2,py-pillarH,pillarW,pillarH);
  ctx.strokeStyle='#b39b72';ctx.lineWidth=1;
  ctx.strokeRect(px-pillarW/2,py-pillarH,pillarW,pillarH);
  ctx.fillStyle='#a08d67';
  ctx.fillRect(px-pillarW/2-1*scale,py-pillarH-4*scale,pillarW+2*scale,5*scale);
 }

 // 3. Upright wooden gate & iron portcullis when standing (intact or damaged).
 if(!destroyed&&!opened){
  // Heavy wooden door face
  ctx.fillStyle=damaged?'#4e2e16':'#623b1c';
  ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(rx,ry);ctx.lineTo(rx,ry-gateH);ctx.lineTo(lx,ly-gateH);ctx.closePath();ctx.fill();
  // Vertical timber planks
  ctx.strokeStyle='#291609';ctx.lineWidth=Math.max(1,scale);
  for(let k=1;k<6;k++){
   const t=k/6;
   ctx.beginPath();ctx.moveTo(lx+dx*t,ly+dy*t);ctx.lineTo(lx+dx*t,ly+dy*t-gateH);ctx.stroke();
  }
  // Iron horizontal bands & rivets
  ctx.strokeStyle='#8e99a2';ctx.lineWidth=Math.max(1.5,2.2*scale);
  for(const band of [0.28,0.72]){
   const yy=-gateH*band;
   ctx.beginPath();ctx.moveTo(lx,ly+yy);ctx.lineTo(rx,ry+yy);ctx.stroke();
  }
  // Stone arch lintel across the top of the gate
  ctx.fillStyle='#8b7857';
  ctx.beginPath();ctx.moveTo(lx,ly-gateH);ctx.lineTo(rx,ry-gateH);ctx.lineTo(rx,ry-gateH-depth*0.75);ctx.lineTo(lx,ly-gateH-depth*0.75);ctx.closePath();ctx.fill();
  // Drawbridge chains from pillar caps
  ctx.strokeStyle='#aeb7be';ctx.lineWidth=Math.max(1,1.2*scale);
  ctx.beginPath();ctx.moveTo(lx+2*scale,ly-pillarH+3*scale);ctx.lineTo(lx+dx*0.18,ly+dy*0.18-gateH*0.55);ctx.stroke();
  if(!damaged){
   ctx.beginPath();ctx.moveTo(rx-2*scale,ry-pillarH+3*scale);ctx.lineTo(lx+dx*0.82,ly+dy*0.82-gateH*0.55);ctx.stroke();
  }else{
   // Cracks and splinters when damaged (1 hit from falling)
   ctx.strokeStyle='#140a04';ctx.lineWidth=Math.max(1.8,2.4*scale);
   ctx.beginPath();
   ctx.moveTo(lx+dx*0.25,ly+dy*0.25-gateH*0.88);
   ctx.lineTo(lx+dx*0.48,ly+dy*0.48-gateH*0.5);
   ctx.lineTo(lx+dx*0.36,ly+dy*0.36-gateH*0.15);
   ctx.moveTo(lx+dx*0.72,ly+dy*0.72-gateH*0.78);
   ctx.lineTo(lx+dx*0.55,ly+dy*0.55-gateH*0.32);
   ctx.stroke();
  }
 }else if(opened){
  // Taut chains holding the lowered drawbridge
  ctx.strokeStyle='#aeb7be';ctx.lineWidth=Math.max(1,1.2*scale);
  const bridgeLen=26*scale;
  ctx.beginPath();ctx.moveTo(lx+2*scale,ly-pillarH+4*scale);ctx.lineTo(lx+dx*0.1,ly+dy*0.1+bridgeLen*0.85);ctx.stroke();
  ctx.beginPath();ctx.moveTo(rx-2*scale,ry-pillarH+4*scale);ctx.lineTo(lx+dx*0.9,ly+dy*0.9+bridgeLen*0.85);ctx.stroke();
 }
}

// Keep fortifications upright on the reprojected board. Native wall states
// determine breaches; native tower artwork retains each town's identity.
export function paintVerticalFortifications(ctx,state,project,scale,atlas,pieces){
 const cells=(state.battleCells||[]).filter(c=>c.siegeWall).map(c=>({...c,p:project(c)})).sort((a,b)=>a.p.x-b.p.x);
 if(!cells.length)return;
 const height=25*scale,depth=9*scale;
 ctx.save();
 for(let i=1;i<cells.length;i++){
  const a=cells[i-1],b=cells[i];
  if(a.wallState<=0||b.wallState<=0||a.wallPart===7||b.wallPart===7)continue;
  const x=a.p.x,y=a.p.y,dx=b.p.x-x,dy=b.p.y-y;
  if(Math.hypot(dx,dy)>85*scale)continue;
  ctx.fillStyle='#2b221b';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);ctx.lineTo(x+dx,y+dy-height);ctx.lineTo(x,y-height);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#b39b72';ctx.lineWidth=1;
  for(let row=0;row<3;row++){
   const yy=-height+row*height/3;ctx.beginPath();ctx.moveTo(x,y+yy);ctx.lineTo(x+dx,y+dy+yy);ctx.stroke();
   for(let t=(row%2)*.16;t<1;t+=.33){ctx.beginPath();ctx.moveTo(x+dx*t,y+dy*t+yy);ctx.lineTo(x+dx*t,y+dy*t+yy+height/3);ctx.stroke();}
  }
  ctx.fillStyle='#8b7857';ctx.beginPath();ctx.moveTo(x,y-height);ctx.lineTo(x+dx,y+dy-height);ctx.lineTo(x+dx,y+dy-height-depth);ctx.lineTo(x,y-height-depth);ctx.closePath();ctx.fill();
  for(let t=0;t<1;t+=.2){ctx.fillStyle='#a08d67';ctx.fillRect(x+dx*t,y+dy*t-height-depth-5*scale,7*scale,8*scale);}
 }
 const gate=cells.find(c=>c.wallPart===7);
 if(gate)paintVerticalGate(ctx,gate,cells,scale,height,depth);
 if(atlas)for(const [index,part] of [[2,0],[3,1],[8,6]]){
  const b=pieces.find(p=>p.index===index),cell=cells.find(c=>c.wallPart===part);if(!b||!cell)continue;
  const size=Math.min(125,Math.max(b.w,b.h))*scale*256/248;
  ctx.drawImage(atlas,index%4*256,Math.floor(index/4)*256,256,256,cell.p.x-size/2,cell.p.y-size*.85,size,size);
 }
 ctx.restore();
}
