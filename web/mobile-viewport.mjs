// Browser rotation/toolbar events often describe the same final geometry.
// Ignore duplicates so a fresh touch isn't cancelled by a late resize event.
export function coalesceViewportResize(read,apply,{schedule=fn=>requestAnimationFrame(fn)}={}){
 let pending=false,last='';
 return()=>{if(pending)return;pending=true;schedule(()=>{pending=false;const size=read(),key=JSON.stringify(size);if(key===last)return;last=key;apply(size);});};
}
// Keep dragging in logical map pixels while avoiding a native command per
// touch sample. A rotation cancels unsent samples from the old viewport.
export function createMapPan(send,{schedule=fn=>requestAnimationFrame(fn)}={}){
 let x=0,y=0,pending=false,generation=0;
 return{
  add(dx,dy){x+=dx;y+=dy;if(pending)return;pending=true;const token=generation;schedule(()=>{if(token!==generation)return;pending=false;const delta={x,y};x=0;y=0;if(delta.x||delta.y)send(delta);});},
  cancel(){generation++;pending=false;x=0;y=0;}
 };
}
