import type {BattlePlan} from './battle.js';
import type {NativeBridge,NativeUnit} from './native-bridge.js';
type Art={battleId:number;canvas:HTMLCanvasElement;rows:{id:number;row:number}[]};
type VisualWindow=Window & {goonkCrossoverBackground?:{battleId:number;canvas:HTMLCanvasElement};goonkBattlePlanes?:{background?:HTMLCanvasElement};goonkCrossoverArt?:Art};
// Both engines supply their original art. All positions/HP/orders come from
// OpenBW; this compositor never advances combat or invents an outcome.
export function sharedField(win:Window,canvas:HTMLCanvasElement,api:NativeBridge,plan:BattlePlan):()=>void {
 const source=win as VisualWindow,context=canvas.getContext('2d')!,layer=win.document.createElement('canvas');layer.width=800;layer.height=500;
 canvas.width=800;canvas.height=500;canvas.setAttribute('aria-label','Champ de bataille Heroes III : unités Heroes et StarCraft en temps réel');
 const lc=layer.getContext('2d')!,previous=new Map<number,{x:number;y:number;moving:boolean}>();let request=0,closed=false,last=0,selected=-1,units:NativeUnit[]=[];
 const draw=(now:number):void=>{
  if(closed)return;request=win.requestAnimationFrame(draw);if(now-last<50)return;last=now;
  const snapshot=api.census(),image=api.layer();units=snapshot.units.filter(u=>u.stackId!==undefined&&u.stackId>=0);
  const background=source.goonkCrossoverBackground?.battleId===plan.battleId?source.goonkCrossoverBackground.canvas:source.goonkBattlePlanes?.background;canvas.dataset.background=background?"heroes":"loading";
  context.fillStyle='#40512e';context.fillRect(0,0,800,500);if(background)context.drawImage(background,0,0,800,500);
  lc.putImageData(new ImageData(new Uint8ClampedArray(image.pixels),800,500),0,0);
  // StarCraft sprites are rendered by OpenBW against transparent pixels.
  context.drawImage(layer,0,0);
  const art=source.goonkCrossoverArt;
  for(const u of [...units].sort((a,b)=>a.y-b.y)){
   const x=u.x-image.x,y=u.y-image.y,old=previous.get(u.id),moving=!!old&&(old.x!==u.x||old.y!==u.y);
   if(u.heroes&&art?.battleId===plan.battleId){
    const row=art.rows.find(row=>row.id===u.stackId);
    if(row){
     const pose=moving?1:(u.cooldown||0)>0?2:0,frame=Math.floor(snapshot.frame/3)%8;
     context.save();context.translate(x,y+5);if(units.some(enemy=>enemy.owner!==u.owner&&enemy.x<u.x))context.scale(-1,1);
     context.drawImage(art.canvas,frame*128,(row.row+pose)*128,128,128,-35,-65,70,70);context.restore();
    }
   }
   previous.set(u.id,{x:u.x,y:u.y,moving});
   context.strokeStyle=u.owner===0?'#8de6ff':'#ff8066';context.lineWidth=1;
   if(u.owner===0&&(selected<0||selected===u.stackId)){context.beginPath();context.ellipse(x,y+5,u.heroes?14:10,5,0,0,Math.PI*2);context.stroke();}
   const width=24,hp=Math.max(0,Math.min(1,u.hp/(u.maxHp||u.hp)));
   context.fillStyle='#17130f';context.fillRect(x-width/2,y-28,width,4);context.fillStyle=u.owner===0?'#88d965':'#f07762';context.fillRect(x-width/2,y-28,width*hp,4);
  }
  canvas.dataset.heroesUnits=String(units.filter(u=>u.heroes).length);canvas.dataset.starcraftUnits=String(units.filter(u=>!u.heroes).length);canvas.dataset.frame=String(snapshot.frame);
 };
 const pointer=(event:PointerEvent):void=>{
  const box=canvas.getBoundingClientRect(),x=(event.clientX-box.left)*800/box.width,y=(event.clientY-box.top)*500/box.height,image=api.layer();
  const nearby=units.filter(u=>Math.hypot(u.x-image.x-x,u.y-image.y-y)<24).sort((a,b)=>Math.hypot(a.x-image.x-x,a.y-image.y-y)-Math.hypot(b.x-image.x-x,b.y-image.y-y))[0];
  if(nearby?.owner===0){selected=nearby.stackId!;canvas.dataset.selection=plan.stacks.find(row=>row.id===selected)?.name||'';return;}
  api.order(selected,x,y,nearby?.owner===1);
 };
 const selectAll=():void=>{selected=-1;canvas.dataset.selection='Toute l’armée';};canvas.addEventListener('crossover-select-all',selectAll);canvas.addEventListener('pointerdown',pointer);request=win.requestAnimationFrame(draw);
 return()=>{closed=true;win.cancelAnimationFrame(request);canvas.removeEventListener('pointerdown',pointer);canvas.removeEventListener('crossover-select-all',selectAll);};
}
