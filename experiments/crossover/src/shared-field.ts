import {opaqueBounds,smoothSprite2x,spritePlacement,COMBAT_BODY_HEIGHT,type SpriteBounds} from './sprite-scale.js';
import {RenderClock,RenderDensity,SimulationTimeline,interpolatedPosition,attackCycle,heroAnimation,type AttackCycle} from './animation.js';
import type {BattlePlan} from './battle.js';
import type {NativeBridge,NativeUnit} from './native-bridge.js';
type Art={battleId:number;cell?:number;canvas:HTMLCanvasElement;rows:{id:number;row:number;canvas?:HTMLCanvasElement}[]};
type SpellClip={id:number;kind:string;canvas:HTMLCanvasElement;frames:number};
type VisualWindow=Window & {goonkCrossoverSpellArt?:{battleId:number;rows:SpellClip[]};goonkCrossoverBackground?:{battleId:number;canvas:HTMLCanvasElement};goonkBattlePlanes?:{background?:HTMLCanvasElement};goonkCrossoverArt?:Art};
// Frame the opening armies once, so the camera stays steady during combat.
export function battleView(units:NativeUnit[],camera:{x:number;y:number}):{zoom:number;x:number;y:number}{
 if(!units.length)return {zoom:1,x:0,y:0};
 const xs=units.map(u=>u.x-camera.x),ys=units.map(u=>u.y-camera.y);
 const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 const l=left-65,r=right+65,t=top-COMBAT_BODY_HEIGHT-12,b=bottom+15;
 const zoom=Math.min(1.15,760/Math.max(1,r-l),460/Math.max(1,b-t));
 return {zoom,x:400-(l+r)/2*zoom,y:250-(t+b)/2*zoom};
}
// Enemy targets take precedence over overlapping allies once a troop is selected.
// The tall touch area follows the enlarged bodies rather than only their feet.
export function battlePick(units:NativeUnit[],positions:Map<number,{x:number;y:number}>,point:{x:number;y:number},camera:{x:number;y:number},selected:boolean,portrait=false,mirrored=false):NativeUnit|undefined {
 const distance=(unit:NativeUnit):number=>{const at=positions.get(unit.id)||unit,nx=point.x-(at.x-camera.x),ny=point.y-(at.y-camera.y),dx=portrait?ny:nx,dy=portrait?(mirrored?nx:-nx):ny;return Math.hypot(dx,Math.max(0,-dy-COMBAT_BODY_HEIGHT,dy-10))+Math.abs(dy)*.15;};
 const candidates=units.filter(unit=>unit.hp>0&&distance(unit)<28).sort((a,b)=>distance(a)-distance(b));
 return (selected?candidates.find(unit=>unit.owner===1):undefined)||candidates[0];
}
export function obstacleVisual(tiles:{x:number;y:number}[]):{x:number;y:number;size:number}|undefined {
 if(!tiles.length)return;
 const xs=tiles.map(tile=>tile.x),ys=tiles.map(tile=>tile.y),left=Math.min(...xs),right=Math.max(...xs),bottom=Math.max(...ys);
 return {x:(left+right)/2,y:bottom+20,size:Math.max(100,right-left+44,bottom-Math.min(...ys)+36)};
}
// Both engines supply their original art. All positions/HP/orders come from
// OpenBW; this compositor never advances combat or invents an outcome.
export function sharedField(win:Window,canvas:HTMLCanvasElement,api:NativeBridge,plan:BattlePlan):()=>void {
 const source=win as VisualWindow,context=canvas.getContext('2d')!;
 canvas.width=800;canvas.height=500;canvas.setAttribute('aria-label','Champ de bataille Heroes III : unités Heroes et StarCraft en temps réel');
 const clock=new RenderClock(),resolution=new RenderDensity(),timeline=new SimulationTimeline(),oldUnits=new Map<number,NativeUnit>(),cycles=new Map<number,AttackCycle>(),deaths=new Set<number>(),hits=new Map<number,number>();
 type SpritePair={before:HTMLCanvasElement;after:HTMLCanvasElement;blend:HTMLCanvasElement};
 const spriteCache=new Map<number,{raw:Uint32Array;canvas:HTMLCanvasElement;bounds:SpriteBounds}>(),firstPixels=new Uint8ClampedArray(192*192*4),scaledPixels=new Uint8ClampedArray(384*384*4);
 const heroBounds=new Map<number,SpriteBounds>(),starBounds=new Map<number,SpriteBounds>();
 const sprites=new Map<number,SpritePair>(),positions=new Map<number,{x:number;y:number}>();
 const makeSprite=():HTMLCanvasElement=>{const image=win.document.createElement('canvas');image.width=image.height=384;return image;};
 const heroCanvases=new Map<number,HTMLCanvasElement>();let previousArt:HTMLCanvasElement|undefined;
 let request=0,closed=false,selected:number|undefined,attackMode=false,units:NativeUnit[]=[],nativeFrame=-1,view:ReturnType<typeof battleView>|undefined;
 type SpellEffect={id:number;caster:number;targets:number[];x:number;y:number;at:number};
 const shots:{stack:number;from:{x:number;y:number};to:{x:number;y:number};at:number}[]=[];
 const revivedBodies=new Set<number>();
 const spellEffects:SpellEffect[]=[],corpses=new Map<number,NativeUnit>(),deathTimes=new Map<number,number>(),castTimes=new Map<number,number>(),damageText=new Map<number,{amount:number;at:number}>();
 const spellFx=(event:Event):void=>{const effect={...(event as CustomEvent).detail,at:win.performance.now()};spellEffects.push(effect);if(effect.caster>=0)castTimes.set(effect.caster,effect.at+800);};canvas.addEventListener('crossover-spell-effect',spellFx);
 let obstacles:{id:number;tiles:{x:number;y:number}[]}[]=[];const obstacleChange=(event:Event):void=>{obstacles=(event as CustomEvent).detail;};canvas.addEventListener('crossover-obstacles',obstacleChange);
 const changed=():void=>{nativeFrame=-1;};canvas.addEventListener('crossover-native-changed',changed);
 const backdrop=win.document.createElement('canvas');let backdropSource:HTMLCanvasElement|undefined,backdropKey='';
 let portrait=false,density=1;let mirrorBackground=false;
 const upright=():void=>{if(portrait)context.transform(0,1,mirrorBackground?1:-1,0,0,0);};
 const bodyPoint=(unit:NativeUnit):{x:number;y:number}=>({x:unit.x-camera.x+(portrait?(mirrorBackground?-45:45):0),y:unit.y-camera.y-(portrait?0:45)});
 let camera={x:0,y:0},marker:{x:number;y:number;target?:number;attack:boolean;at:number}|undefined;
 const draw=(now:number):void=>{
  if(closed)return;request=win.requestAnimationFrame(draw);if(!clock.due(now))return;const vertical=win.innerWidth<win.innerHeight,nextDensity=resolution.sample(now,canvas.clientWidth,vertical?500:800,win.devicePixelRatio||1);
  if(portrait!==vertical||density!==nextDensity||!canvas.dataset.orientation||canvas.width!==Math.round((vertical?500:800)*nextDensity)){portrait=vertical;density=nextDensity;canvas.width=Math.round((portrait?500:800)*density);canvas.height=Math.round((portrait?800:500)*density);canvas.dataset.orientation=portrait?'portrait':'landscape';}
  // Census and expensive sprite extraction happen only on a new native tick.
  // Paused units can receive orders without advancing; they stay at their real
  // positions until simulation resumes.
  if(!api.frame||api.frame()!==nativeFrame){
   const snapshot=api.census();
   if(snapshot.frame!==nativeFrame){
    oldUnits.clear();for(const unit of units)oldUnits.set(unit.id,unit);
    nativeFrame=snapshot.frame;timeline.receive(nativeFrame,now,api.tickDuration?.()||42);
    units=snapshot.units.filter(unit=>unit.stackId!==undefined&&unit.stackId>=0);camera=api.camera();
    if(!view&&units.length){view=battleView(units,camera);const mean=(owner:number)=>{const rows=units.filter(u=>u.owner===owner);return rows.reduce((n,u)=>n+u.x,0)/Math.max(1,rows.length);};mirrorBackground=mean(0)>mean(1);}
    const alive=new Set(units.map(unit=>unit.id));
    for(const old of oldUnits.values())if(!alive.has(old.id)&&!revivedBodies.has(old.id)){corpses.set(old.id,{...old,hp:0});if(!deathTimes.has(old.id))deathTimes.set(old.id,now);if(old.heroes&&!deaths.has(old.id))api.playCreatureSound?.(old.stackId!,'death');deaths.delete(old.id);}

    for(const unit of units){
     if(unit.hp>0&&!oldUnits.has(unit.id)){const dead=[...corpses.values(),...oldUnits.values()].find(u=>u.stackId===unit.stackId&&u.hp<=0&&!revivedBodies.has(u.id));if(dead){revivedBodies.add(dead.id);corpses.delete(dead.id);deathTimes.delete(dead.id);}}
     if(unit.hp>0){corpses.delete(unit.id);deathTimes.delete(unit.id);}
     const old=oldUnits.get(unit.id);if(unit.heroes&&(unit.cooldown||0)>(old?.cooldown||0)){api.playCreatureAttack?.(unit.stackId!);if(plan.stacks.find(s=>s.id===unit.stackId)?.shooter){const target=units.find(u=>u.id===unit.target);if(target)shots.push({stack:unit.stackId!,from:bodyPoint(unit),to:bodyPoint(target),at:now});}}
     const cycle=attackCycle(old,unit,nativeFrame,cycles.get(unit.id));if(cycle)cycles.set(unit.id,cycle);
     if(old&&((unit.hp256??unit.hp*256)<(old.hp256??old.hp*256)||(unit.shields256??(unit.shields??0)*256)<(old.shields256??(old.shields??0)*256))){hits.set(unit.id,now+320);damageText.set(unit.id,{amount:(Math.max(0,(old.hp256??old.hp*256)-(unit.hp256??unit.hp*256))+Math.max(0,(old.shields256??(old.shields??0)*256)-(unit.shields256??(unit.shields??0)*256)))/256,at:now});if(unit.hp<=0&&!deathTimes.has(unit.id))deathTimes.set(unit.id,now);if(unit.heroes){api.playCreatureSound?.(unit.stackId!,unit.hp>0?'hit':'death');if(unit.hp<=0)deaths.add(unit.id);}}
     if(!unit.heroes){
      try{const raw=new Uint8Array(api.sprite(unit.id)),pixels=new Uint32Array(raw.buffer,raw.byteOffset,raw.byteLength/4);let hash=2166136261;for(const pixel of pixels)hash=Math.imul(hash^pixel,16777619)>>>0;
       let image=spriteCache.get(hash);if(image){for(let i=0;i<pixels.length;i++)if(image.raw[i]!==pixels[i]){image=undefined;break;}}
       if(!image){const first=smoothSprite2x(raw,96,96,firstPixels),scaled=smoothSprite2x(new Uint8Array(first.buffer),192,192,scaledPixels),surface=makeSprite();const smooth=surface.getContext('2d')!;smooth.putImageData(new ImageData(scaled,384,384),0,0);smooth.filter='blur(1px)';smooth.globalCompositeOperation='copy';smooth.drawImage(surface,0,0);smooth.filter='none';smooth.globalCompositeOperation='source-over';image={raw:pixels.slice(),canvas:surface,bounds:opaqueBounds(scaled,384,384)};if(spriteCache.size>=64)spriteCache.delete(spriteCache.keys().next().value!);}else spriteCache.delete(hash);spriteCache.set(hash,image);
       let pair=sprites.get(unit.id);if(!pair){pair={before:image.canvas,after:image.canvas,blend:makeSprite()};sprites.set(unit.id,pair);}else{pair.before=pair.after;pair.after=image.canvas;}
       if(!starBounds.has(unit.id))starBounds.set(unit.id,image.bounds);
      }catch{/* Keep the last complete native sprite if an extraction fails. */}
     }
    }
   }
  }
  const {amount,frame:visualFrame}=timeline.sample(now);
  positions.clear();for(const unit of units)positions.set(unit.id,interpolatedPosition(oldUnits.get(unit.id),unit,amount));
  const background=source.goonkCrossoverBackground?.battleId===plan.battleId?source.goonkCrossoverBackground.canvas:source.goonkBattlePlanes?.background;canvas.dataset.background=background?'heroes':'loading';
  context.setTransform(density,0,0,density,0,0);context.globalAlpha=1;context.imageSmoothingEnabled=true;
  context.fillStyle='#40512e';context.fillRect(0,0,portrait?500:800,portrait?800:500);if(background){
   const key=portrait+':'+density+':'+mirrorBackground;if(backdropSource!==background||backdropKey!==key){backdropSource=background;backdropKey=key;backdrop.width=canvas.width;backdrop.height=canvas.height;const bg=backdrop.getContext('2d')!;bg.scale(density,density);bg.imageSmoothingEnabled=true;bg.imageSmoothingQuality='high';if(portrait){const ratio=Math.max(500/background.width,800/background.height);bg.drawImage(background,(500-background.width*ratio)/2,(800-background.height*ratio)/2,background.width*ratio,background.height*ratio);}else{if(mirrorBackground){bg.translate(800,0);bg.scale(-1,1);}bg.drawImage(background,0,0,800,500);}}
   context.drawImage(backdrop,0,0,portrait?500:800,portrait?800:500);
  }
  const transform=portrait?{zoom:1,x:0,y:0}:view||{zoom:1,x:0,y:0};if(portrait)context.setTransform(0,(mirrorBackground?1:-1)*transform.zoom*density,transform.zoom*density,0,transform.y*density,(mirrorBackground?transform.x:800-transform.x)*density);else context.setTransform(transform.zoom*density,0,0,transform.zoom*density,transform.x*density,transform.y*density);context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
  const spellArt=source.goonkCrossoverSpellArt;
  const drawClip=(clip:SpellClip,x:number,y:number,age:number,size=150):void=>{context.save();context.translate(x,y);upright();x=y=0;const position=Math.min(clip.frames-1,Math.max(0,age/950*(clip.frames-1))),index=Math.floor(position),mix=position-index;context.globalAlpha=1-mix;context.drawImage(clip.canvas,index*128,0,128,128,x-size/2,y-size,size,size);if(mix>0){context.globalAlpha=mix;context.drawImage(clip.canvas,Math.min(clip.frames-1,index+1)*128,0,128,128,x-size/2,y-size,size,size);}context.globalAlpha=1;context.restore();};
  // Draw complete obstacle artwork once, behind combatants. The tiles remain
  // exclusively the native footprint for collision and spell triggers.
  for(const obstacle of obstacles){const clip=spellArt?.rows.find(c=>c.id===100000+obstacle.id&&c.kind==='obstacle'),place=obstacleVisual(obstacle.tiles);if(clip&&place)drawClip(clip,place.x,place.y,(nativeFrame*42)%950,place.size);}
  const art=source.goonkCrossoverArt,cell=art?.cell||128;if(art?.canvas!==previousArt){previousArt=art?.canvas;heroBounds.clear();heroCanvases.clear();}
  const blendedHeroes=new Map<string,HTMLCanvasElement>();
  for(const unit of [...corpses.values(),...units].filter(u=>!revivedBodies.has(u.id)).sort((a,b)=>portrait?(mirrorBackground?1:-1)*((positions.get(a.id)||a).x-(positions.get(b.id)||b).x):(positions.get(a.id)||a).y-(positions.get(b.id)||b).y)){
   const point=positions.get(unit.id)||unit,worldX=point.x-camera.x,worldY=point.y-camera.y;context.save();context.translate(worldX,worldY);upright();let bodyHeight=COMBAT_BODY_HEIGHT;try{const x=0,y=0,old=oldUnits.get(unit.id),moving=!!old&&(old.x!==unit.x||old.y!==unit.y);
   const chosen=unit.owner===0&&selected!==undefined&&(selected<0||selected===unit.stackId);
   context.strokeStyle=unit.owner===0?'#8de6ff':'#ff8066';context.lineWidth=2;
   if(chosen){context.beginPath();context.ellipse(x,y+5,23,8,0,0,Math.PI*2);context.stroke();}
   if(unit.heroes&&art?.battleId===plan.battleId){
    const row=art.rows.find(row=>row.id===unit.stackId);
    if(row){
     const atlas=row.canvas||art.canvas;
     let animation=heroAnimation(visualFrame,moving,unit.cooldown||0,cycles.get(unit.id));
     const deadAt=deathTimes.get(unit.id),hitUntil=hits.get(unit.id)||0,castUntil=castTimes.get(unit.stackId!)||0;
     if(deadAt!==undefined){const position=Math.min(7,(now-deadAt)/110),index=Math.floor(position);animation={pose:4,frame:index,next:Math.min(7,index+1),mix:position-index};}
     else if(hitUntil>now){const position=Math.min(7,(1-(hitUntil-now)/320)*8),index=Math.floor(position);animation={pose:3,frame:index,next:Math.min(7,index+1),mix:position-index};}
     else if(castUntil>now){const position=Math.min(7,(1-(castUntil-now)/800)*8),index=Math.floor(position);animation={pose:5,frame:index,next:Math.min(7,index+1),mix:position-index};}
     context.save();context.translate(x,y+5);if(units.some(enemy=>enemy.owner!==unit.owner&&enemy.x<unit.x))context.scale(-1,1);
     const blendKey=unit.stackId+':'+animation.pose+':'+animation.frame+':'+animation.next+':'+animation.mix;let heroBlend=blendedHeroes.get(blendKey);if(!heroBlend){heroBlend=heroCanvases.get(unit.id);if(!heroBlend){heroBlend=win.document.createElement('canvas');heroBlend.width=heroBlend.height=cell;heroCanvases.set(unit.id,heroBlend);}const heroContext=heroBlend.getContext('2d')!;
     heroContext.clearRect(0,0,cell,cell);heroContext.globalAlpha=1-animation.mix;heroContext.drawImage(atlas,animation.frame*cell,(row.row+animation.pose)*cell,cell,cell,0,0,cell,cell);
     heroContext.globalCompositeOperation='lighter';heroContext.globalAlpha=animation.mix;heroContext.drawImage(atlas,animation.next*cell,(row.row+animation.pose)*cell,cell,cell,0,0,cell,cell);heroContext.globalCompositeOperation='source-over';blendedHeroes.set(blendKey,heroBlend);}
     let bounds=heroBounds.get(unit.stackId!);if(!bounds){bounds=opaqueBounds(atlas.getContext('2d')!.getImageData(0,row.row*cell,cell,cell).data,cell,cell);heroBounds.set(unit.stackId!,bounds);}const place=spritePlacement(bounds);bodyHeight=bounds.height*place.scale;context.drawImage(heroBlend,place.x,place.y,cell*place.scale,cell*place.scale);context.restore();
    }
   }else if(!unit.heroes){
    const pair=sprites.get(unit.id);if(!pair)continue;
    context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
    const marineBlend=pair.blend,marineContext=marineBlend.getContext('2d')!;marineContext.clearRect(0,0,384,384);marineContext.globalAlpha=1-amount;marineContext.drawImage(pair.before,0,0);
    marineContext.globalCompositeOperation='lighter';marineContext.globalAlpha=amount;marineContext.drawImage(pair.after,0,0);marineContext.globalCompositeOperation='source-over';
    const hitUntil=hits.get(unit.id)||0,recoil=hitUntil>now?Math.sin((1-(hitUntil-now)/320)*Math.PI)*7:0;const bounds=starBounds.get(unit.id)||{x:0,y:0,width:384,height:384},place=spritePlacement(bounds);bodyHeight=bounds.height*place.scale;context.drawImage(marineBlend,x+place.x+recoil,y+5+place.y,384*place.scale,384*place.scale);
   }
   const hitUntil=hits.get(unit.id)||0;if(hitUntil>now){const age=1-(hitUntil-now)/320;context.strokeStyle='#fff0be';context.globalAlpha=1-age;context.lineWidth=2;for(let i=0;i<7;i++){const angle=i*Math.PI*2/7,r=8+age*27;context.beginPath();context.moveTo(x+Math.cos(angle)*r,y-45+Math.sin(angle)*r);context.lineTo(x+Math.cos(angle)*(r+7),y-45+Math.sin(angle)*(r+7));context.stroke();}context.globalAlpha=1;}
   const damage=damageText.get(unit.id);if(damage&&now-damage.at<850){const age=(now-damage.at)/850;context.globalAlpha=1-age;context.font='bold 20px sans-serif';context.textAlign='center';context.fillStyle='#ffe5bf';context.fillText('−'+Number(damage.amount.toFixed(1)).toLocaleString('fr-FR'),x,y-bodyHeight-8-age*30);context.globalAlpha=1;}
   if(unit.hp<=0){const canRaise=canvas.dataset.revive==='true'&&JSON.parse(canvas.dataset.spellTargets||'[]').includes(unit.stackId);context.globalAlpha=.95;context.fillStyle=canRaise?'#ffe39a':'#201713';context.strokeStyle=canRaise?'#ffe39a':'#ffb19d';context.lineWidth=3;context.beginPath();context.ellipse(0,4,25,12,0,0,Math.PI*2);context.fill();context.stroke();context.font='bold 15px sans-serif';context.textAlign='center';context.fillStyle=canRaise?'#211a10':'#ffe6db';context.fillText(canRaise?'Réanimer':'✝',0,9);continue;}
   const width=34,barY=y-bodyHeight-5,hp=Math.max(0,Math.min(1,(unit.hp256??unit.hp*256)/((unit.maxHp||unit.hp)*256)));
   if(unit.maxShields){context.fillStyle='#121009';context.fillRect(x-width/2-1,barY-8,width+2,6);context.fillStyle='#70c9ff';context.fillRect(x-width/2,barY-7,width*Math.max(0,(unit.shields??0)/unit.maxShields),4);}
   context.fillStyle='#121009';context.fillRect(x-width/2-1,barY-1,width+2,8);context.fillStyle=unit.owner===0?'#88e460':'#ff7665';context.fillRect(x-width/2,barY,width*hp,6);
   }finally{context.restore();}
  }
  if(marker&&now-marker.at<1000){
   const target=marker.target===undefined?undefined:positions.get(marker.target),mx=target?target.x-camera.x:marker.x,my=target?target.y-camera.y-(portrait?0:45):marker.y;
   const age=(now-marker.at)/1000,r=14+Math.sin(age*Math.PI*4)*4;context.globalAlpha=1-age*.7;context.strokeStyle=marker.attack?'#ff735f':'#9feeab';context.lineWidth=3;context.beginPath();context.arc(mx,my,r,0,Math.PI*2);context.moveTo(mx-r-8,my);context.lineTo(mx-5,my);context.moveTo(mx+5,my);context.lineTo(mx+r+8,my);context.moveTo(mx,my-r-8);context.lineTo(mx,my-5);context.moveTo(mx,my+5);context.lineTo(mx,my+r+8);context.stroke();context.globalAlpha=1;
  }
  while(shots.length&&now-shots[0].at>380)shots.shift();for(const shot of shots){const age=now-shot.at,t=Math.min(1,age/180),x=shot.from.x+(shot.to.x-shot.from.x)*t,y=shot.from.y+(shot.to.y-shot.from.y)*t;const clip=spellArt?.rows.find(c=>c.id===200000+shot.stack&&c.kind==='weapon');if(clip)drawClip(clip,x,y,age*2,100);}
  while(spellEffects.length&&now-spellEffects[0].at>1200)spellEffects.shift();
  for(const effect of spellEffects){const age=now-effect.at,actors=[...units,...corpses.values()],caster=actors.find(u=>u.stackId===effect.caster),from=caster?bodyPoint(caster):{x:mirrorBackground?750:50,y:280};const targets=actors.filter(u=>effect.targets.includes(u.stackId!));
   for(const clip of spellArt?.rows.filter(c=>c.id===effect.id)||[]){
    if(clip.kind==='cast')drawClip(clip,from.x,from.y,age);
    else if(clip.kind==='projectile'&&age<350){const t=age/350,to=targets[0]?bodyPoint(targets[0]):{x:effect.x,y:effect.y};drawClip(clip,from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t,age*2,90);}
    else if(clip.kind==='affect'){for(const target of targets)drawClip(clip,target.x-camera.x,target.y-camera.y+6,age);}
    else if(clip.kind==='hit')drawClip(clip,effect.x,effect.y+35,age,[21,22,23,24,25,26].includes(effect.id)?280:170);
   }
  }
  context.setTransform(1,0,0,1,0,0);
  canvas.dataset.heroesUnits=String(units.filter(unit=>unit.heroes).length);canvas.dataset.starcraftUnits=String(units.filter(unit=>!unit.heroes).length);canvas.dataset.frame=String(nativeFrame);
 };
 const pointer=(event:PointerEvent):void=>{
  const box=canvas.getBoundingClientRect(),transform=portrait?{zoom:1,x:0,y:0}:view||{zoom:1,x:0,y:0},camera=api.camera();
  const sx=(event.clientX-box.left)*(portrait?500:800)/box.width,sy=(event.clientY-box.top)*(portrait?800:500)/box.height;const x=((portrait?(mirrorBackground?sy:800-sy):sx)-transform.x)/transform.zoom,y=((portrait?sx:sy)-transform.y)/transform.zoom;
  const targetKind=canvas.dataset.spellTarget;const pickUnits=canvas.dataset.spellMode&&['ally','teleport','sacrifice'].includes(targetKind||'')?units.filter(u=>u.owner===0):canvas.dataset.spellMode&&targetKind==='enemy'?units.filter(u=>u.owner===1):units;const nearby=battlePick(pickUnits,positions,{x,y},camera,selected!==undefined,portrait,mirrorBackground);
  if(canvas.dataset.spellMode){
   if(canvas.dataset.spellMode==='target'){const eligible=JSON.parse(canvas.dataset.spellTargets||'[]') as number[];const fallen=[...units.filter(u=>u.hp<=0),...corpses.values()].filter(u=>!revivedBodies.has(u.id)&&(!canvas.dataset.revive||canvas.dataset.revive!=='true'||eligible.includes(u.stackId!)));const deadPick=fallen.find(u=>Math.hypot(x-(u.x-camera.x),y-(u.y-camera.y))<35||Math.hypot(x-bodyPoint(u).x,y-bodyPoint(u).y)<40);const target=canvas.dataset.revive==='true'?(deadPick||nearby):(nearby||deadPick);const at=target&&targetKind!=='ground'?(positions.get(target.id)||target):undefined;canvas.dispatchEvent(new CustomEvent('crossover-spell-target',{detail:{stack:target?.stackId,owner:target?.owner,hp:target?.hp,x:at?at.x-camera.x:x,y:at?at.y-camera.y:y}}));}return;
  }
  if(nearby?.owner===0){select(nearby.stackId!);return;}
  if(selected===undefined){notifySelection();return;}
  if(nearby?.owner===1)api.target(selected,nearby.id);
  else api.order(selected,Math.max(0,Math.min(799,x)),Math.max(0,Math.min(499,y)),attackMode);
  const attacking=nearby?.owner===1||attackMode;marker={x,y,target:nearby?.owner===1?nearby.id:undefined,attack:attacking,at:win.performance.now()};canvas.dataset.orderFeedback=attacking?'attack':'move';
  api.acknowledge?.(attacking?'attack':'move');
  const name=selected<0?'Toute l’armée':plan.stacks.find(row=>row.id===selected)?.name||'Sélection';
  canvas.dispatchEvent(new CustomEvent('crossover-order-issued',{detail:attacking?name+' · ordre d’attaque envoyé'+(nearby?.owner===1?' sur l’ennemi.':' vers ce point.'):name+' · déplacement ordonné.'}));attackMode=false;canvas.dataset.attackMode='';
 };
 const notifySelection=():void=>{const name=selected===undefined?'Sélectionne une troupe, puis touche un ennemi pour attaquer.':selected<0?'Toute l’armée sélectionnée':(plan.stacks.find(row=>row.id===selected)?.name||'Troupe')+' sélectionnés';canvas.dataset.selection=selected===undefined?'':selected<0?'Toute l’armée':plan.stacks.find(row=>row.id===selected)?.name||'';canvas.dispatchEvent(new CustomEvent('crossover-selection',{detail:{id:selected,name}}));};
 const select=(id:number):void=>{if(id>=0&&!units.some(unit=>unit.stackId===id&&unit.owner===0&&unit.hp>0))return;selected=id;notifySelection();api.acknowledge?.('select');};
 const selectAll=():void=>select(-1);
 const selectGroup=(event:Event):void=>{const id=(event as CustomEvent).detail;if(Number.isSafeInteger(id))select(id);};
 const mode=(event:Event):void=>{attackMode=(event as CustomEvent).detail==='attack';canvas.dataset.attackMode=attackMode?'armed':'';if(attackMode)api.acknowledge?.('armed');};
 const stop=():void=>{if(selected===undefined)return;api.stop(selected);attackMode=false;marker=undefined;canvas.dataset.attackMode='';canvas.dataset.orderFeedback='stop';api.acknowledge?.('stop');canvas.dispatchEvent(new CustomEvent('crossover-order-issued',{detail:'Ordres annulés. La sélection reste inactive.'}));};
 canvas.addEventListener('crossover-select-all',selectAll);canvas.addEventListener('crossover-select-group',selectGroup);canvas.addEventListener('crossover-command-mode',mode);canvas.addEventListener('crossover-stop-selection',stop);canvas.addEventListener('pointerdown',pointer);request=win.requestAnimationFrame(draw);
 return()=>{
  // Release GPU-backed surfaces immediately, even if a retired callback still
  // retains this scene until its promise settles on a memory-constrained phone.
  const surfaces=new Set<HTMLCanvasElement>([canvas,backdrop,...heroCanvases.values(),...Array.from(spriteCache.values(),entry=>entry.canvas)]);
  for(const pair of sprites.values())for(const image of [pair.before,pair.after,pair.blend])surfaces.add(image);
  for(const image of surfaces){image.width=0;image.height=0;}
  heroCanvases.clear();spriteCache.clear();sprites.clear();units=[];oldUnits.clear();corpses.clear();spellEffects.length=0;
  canvas.removeEventListener('crossover-obstacles',obstacleChange);canvas.removeEventListener('crossover-native-changed',changed);canvas.removeEventListener("crossover-spell-effect",spellFx);closed=true;win.cancelAnimationFrame(request);canvas.removeEventListener('pointerdown',pointer);canvas.removeEventListener('crossover-select-all',selectAll);canvas.removeEventListener('crossover-select-group',selectGroup);canvas.removeEventListener('crossover-command-mode',mode);canvas.removeEventListener('crossover-stop-selection',stop);};
}
