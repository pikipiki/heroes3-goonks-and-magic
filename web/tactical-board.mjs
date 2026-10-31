export function projectBattle(w,h,portrait,attacks=true,units=[]){
 const left=Math.min(54,...units.map(u=>u.x-26)),right=Math.max(744,...units.map(u=>u.x+26)),top=Math.min(86,...units.map(u=>u.y-26)),bottom=Math.max(558,...units.map(u=>u.y+26)),bw=right-left,bh=bottom-top;
 const scale=Math.min((w-16)/(portrait?bh:bw),(h-24)/(portrait?bw:bh));
 const dx=(w-(portrait?bh:bw)*scale)/2,dy=(h-(portrait?bw:bh)*scale)/2;
 return {scale,portrait,toScreen:p=>portrait?{x:dx+(attacks?p.y-top:bottom-p.y)*scale,y:dy+(attacks?right-p.x:p.x-left)*scale}:{x:dx+(p.x-left)*scale,y:dy+(p.y-top)*scale},toNative:p=>portrait?{x:attacks?right-(p.y-dy)/scale:left+(p.y-dy)/scale,y:attacks?top+(p.x-dx)/scale:bottom-(p.x-dx)/scale}:{x:left+(p.x-dx)/scale,y:top+(p.y-dy)/scale}};
}

export function pickBattleCell(point,cells,projection){let best=null,distance=Infinity;for(const cell of cells||[]){const p=projection.toScreen(cell),d=Math.hypot(p.x-point.x,p.y-point.y);if(d<distance){best=cell;distance=d;}}return distance<=28*projection.scale?best:null;}
export function drawUnit(ctx,unit,atlas,ids,x,y,size){
 const index=ids?.get(unit.stackId);if(atlas&&index!==undefined){ctx.drawImage(atlas,index%8*128+8,Math.floor(index/8)*128+8,112,112,x-size/2,y-size/2,size,size);return true;}return false;
}
export function paintTactical(ctx,w,h,state,selected,move,atlas,ids){
 const portrait=h>w,p=projectBattle(w,h,portrait,state.battlePlayerAttacks!==false,state.battleUnits||[]),units=state.battleUnits||[],occupied=new Map();
 for(const unit of units)for(const hex of unit.occupied||[])occupied.set(hex,unit);
 for(const cell of state.battleCells||[]){const point=p.toScreen(cell),vertices=[[0,-26],[22,-13],[22,13],[0,26],[-22,13],[-22,-13]].map(([x,y])=>p.toScreen({x:cell.x+x,y:cell.y+y}));ctx.beginPath();vertices.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();const blocked=cell.kind>=2,unit=occupied.get(cell.hex),chosen=selected&&Math.hypot(selected.x-cell.x,selected.y-cell.y)<2;ctx.fillStyle=chosen?'#8f702d':blocked?'#221b14':move&&cell.reachable?'#425b36':unit?(unit.enemy?'#5a2924':'#293d53'):'#35402a';ctx.fill();ctx.strokeStyle=chosen?'#ffe39b':move&&cell.reachable?'#b7ce83':'#9d8b586b';ctx.lineWidth=chosen?2:1;ctx.stroke();if(blocked){ctx.strokeStyle='#9e8c69';ctx.beginPath();ctx.moveTo(point.x-4,point.y-4);ctx.lineTo(point.x+4,point.y+4);ctx.moveTo(point.x+4,point.y-4);ctx.lineTo(point.x-4,point.y+4);ctx.stroke();}}
 const size=38*p.scale;
 for(const unit of units){const point=p.toScreen(unit);if(unit.stackId===state.activeStack){ctx.beginPath();ctx.arc(point.x,point.y,size*.56,0,Math.PI*2);ctx.strokeStyle='#ffdf7d';ctx.lineWidth=2;ctx.stroke();}if(!drawUnit(ctx,unit,atlas,ids,point.x,point.y,size)){ctx.fillStyle='#fff1bf';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText(unit.name?.slice(0,2)||'?',point.x,point.y);}const label=unit.count>=1000000?Math.floor(unit.count/1000000)+'M':unit.count>=1000?Math.floor(unit.count/1000)+'k':String(unit.count);let font=Math.min(10,14*p.scale);ctx.font='bold '+font+'px Georgia';const max=36*p.scale;while(ctx.measureText(label).width+4>max&&font>6){font-=.5;ctx.font='bold '+font+'px Georgia';}const tw=Math.min(max,Math.max(12,ctx.measureText(label).width+4));ctx.fillStyle=unit.enemy?'#641a16':'#192f47';ctx.fillRect(point.x-tw/2,point.y+size*.2,tw,12);ctx.fillStyle='#fff1c5';ctx.textAlign='center';ctx.fillText(label,point.x,point.y+size*.2+10);}
 ctx.fillStyle='#f4dc9c';ctx.font='11px Georgia';ctx.textAlign='center';ctx.fillText(portrait?'Adversaires':'Champ de bataille',w/2,12);if(portrait)ctx.fillText('Votre armée',w/2,h-3);return p;
}
