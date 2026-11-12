export function siegeTargets(state){return (state.battleCells||[]).filter(c=>c.siegeTarget&&c.actionLabel==='Attack').map((cell,index)=>({...cell,enemy:true,name:'Wall section '+(index+1),count:'',siege:true}));}
export function paintSiegeTargets(ctx,state,project){
 for(const target of siegeTargets(state)){const p=project(target);ctx.save();ctx.strokeStyle='#05090c';ctx.lineWidth=6;ctx.beginPath();ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#ff7465';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-16,p.y);ctx.lineTo(p.x+16,p.y);ctx.moveTo(p.x,p.y-16);ctx.lineTo(p.x,p.y+16);ctx.stroke();ctx.restore();}
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
 if(atlas)for(const [index,part] of [[2,0],[3,1],[8,6]]){
  const b=pieces.find(p=>p.index===index),cell=cells.find(c=>c.wallPart===part);if(!b||!cell)continue;
  const size=Math.min(125,Math.max(b.w,b.h))*scale*256/248;
  ctx.drawImage(atlas,index%4*256,Math.floor(index/4)*256,256,256,cell.p.x-size/2,cell.p.y-size*.85,size,size);
 }
 ctx.restore();
}
