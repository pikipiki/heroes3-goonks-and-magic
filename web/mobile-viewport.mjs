// Browser rotation/toolbar events often describe the same final geometry.
// Ignore duplicates so a fresh touch isn't cancelled by a late resize event.
export function coalesceViewportResize(read,apply,{schedule=fn=>requestAnimationFrame(fn)}={}){
 let pending=false,last='';
 return()=>{if(pending)return;pending=true;schedule(()=>{pending=false;const size=read(),key=JSON.stringify(size);if(key===last)return;last=key;apply(size);});};
}
// Keep dragging in logical map pixels while avoiding a native command per
// touch sample. Keep subpixel remainders: zoomed, slow drags may move less
// than one native pixel per frame. A rotation cancels old-viewport samples.
export function createMapPan(send,{schedule=fn=>requestAnimationFrame(fn)}={}){
 let x=0,y=0,pending=false,generation=0;
 return{
  add(dx,dy){x+=dx;y+=dy;if(pending)return;pending=true;const token=generation;schedule(()=>{if(token!==generation)return;pending=false;const delta={x:Math.round(x)||0,y:Math.round(y)||0};x-=delta.x;y-=delta.y;if(delta.x||delta.y)send(delta);});},
  cancel(){generation++;pending=false;x=0;y=0;}
 };
}
