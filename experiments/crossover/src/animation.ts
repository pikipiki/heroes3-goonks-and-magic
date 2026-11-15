import type {NativeUnit} from './native-bridge.js';
export const DISPLAY_FPS=50;
// Keep the remainder: resetting to each rAF timestamp would cap a 60 Hz screen
// at 30 fps when asked to paint every 20 ms.
export class RenderClock {
 private next=0;
 due(now:number):boolean {
  if(now+.1<this.next)return false;
  const interval=1000/DISPLAY_FPS;
  this.next+=Math.max(1,Math.floor((now-this.next)/interval)+1)*interval;
  return true;
 }
}
export function blendAmount(now:number,received:number,duration:number):number {
 return Math.max(0,Math.min(1,(now-received)/Math.max(1,duration)));
}
// Reconstruct a presentation clock one native tick behind the simulation.
// Polling a 24 Hz simulation at 50 Hz delivers snapshots at uneven intervals;
// restarting a tween on every receipt would introduce a small stop every few ticks.
export class SimulationTimeline {
 private from=0;private to=-1;private offset=0;private received=0;private tick=42;
 receive(frame:number,now:number,tick:number):void {
  tick=Math.max(1,tick);
  if(frame===this.to)return;
  const observed=now-frame*tick;
  if(this.to<0||frame<this.to){this.from=frame;this.offset=observed;}
  else{
   this.from=this.to;
   if(tick!==this.tick||now-this.received-(frame-this.to)*tick>250)this.offset=observed;
   else this.offset=Math.min(observed,this.offset+.5);
  }
  this.to=frame;this.received=now;this.tick=tick;
 }
 sample(now:number):{frame:number;amount:number}{
  const frame=Math.max(this.from,Math.min(this.to,(now-this.offset)/this.tick-1));
  return {frame,amount:this.from===this.to?1:blendAmount(frame,this.from,this.to-this.from)};
 }
}
export function interpolatedPosition(previous:NativeUnit|undefined,current:NativeUnit,amount:number):{x:number;y:number} {
 // New units and teleports must not slide across the whole battlefield.
 if(!previous||Math.hypot(current.x-previous.x,current.y-previous.y)>128)return {x:current.x,y:current.y};
 amount=Math.max(0,Math.min(1,amount));
 return {x:previous.x+(current.x-previous.x)*amount,y:previous.y+(current.y-previous.y)*amount};
}
export type AttackCycle={shotFrame:number;period:number};
export function attackCycle(previous:NativeUnit|undefined,current:NativeUnit,frame:number,cycle:AttackCycle|undefined):AttackCycle|undefined {
 const cooldown=current.cooldown||0;
 if(cooldown>(previous?.cooldown||0)){
  const gap=cycle?frame-cycle.shotFrame:0;
  return {shotFrame:frame,period:gap>0&&gap<=Math.max(8,cooldown*2)?gap:Math.max(1,cooldown)};
 }
 return cycle;
}
// Original atlas poses are blended at display rate. The midpoint of the attack
// clip is aligned with the observed native shot, not a global looping clock.
export function heroAnimation(frame:number,moving:boolean,cooldown:number,cycle:AttackCycle|undefined):{pose:number;frame:number;next:number;mix:number} {
 let pose=0,position=frame/3;
 if(moving){pose=1;position=frame/2;}
 else if(cooldown>0&&cycle){pose=2;position=(.5+(frame-cycle.shotFrame)/cycle.period)*8;}
 position=((position%8)+8)%8;
 const index=Math.floor(position);
 return {pose,frame:index,next:(index+1)%8,mix:position-index};
}

// Match the visible pixel budget and reduce oversampling when rendering misses
// the display cadence. Native art and combat simulation are never downsampled.
export class RenderDensity {
 private cap=2;private since=0;private frames=0;
 sample(now:number,cssWidth:number,logicalWidth:number,dpr:number):number {
  if(!this.frames)this.since=now;this.frames++;
  const elapsed=now-this.since;if(elapsed>=500){if((this.frames-1)*1000/elapsed<47)this.cap=Math.max(1,this.cap*.8);this.since=now;this.frames=1;}
  return Math.min(this.cap,Math.max(1,cssWidth/logicalWidth*dpr));
 }
}
