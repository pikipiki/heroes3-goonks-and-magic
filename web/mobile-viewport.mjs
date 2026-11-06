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

// iOS Home Screen rotation can leave a scrolled layout viewport while painting
// fixed controls at their old visual position. Anchor the app in document space
// at the current scroll origin instead: client rects and finger coordinates then
// share the same origin. This also follows browser toolbar/keyboard resizing.
export function anchorMobileViewport(root,win=window){
 const viewport=win.visualViewport;let pending=false,disposed=false,lastLayoutWidth;
 function update(){
  if(disposed)return;
  const layout=win.document?.documentElement;
  const layoutWidth=layout?.clientWidth||win.innerWidth;
  const layoutHeight=layout?.clientHeight||win.innerHeight;
  const scale=viewport?.scale??1;
  const zoomed=Math.abs(scale-1)>.01;
  // A rotation can change the layout before Chromium reports the new
  // visual viewport. Use the new layout instead of retaining the old size.
  if(scale>1.01&&layoutWidth===lastLayoutWidth)return;
  const width=zoomed?layoutWidth:(viewport?.width??layoutWidth);
  const height=scale<.99?Math.min(layoutHeight,viewport.height*scale):zoomed?layoutHeight:(viewport?.height??layoutHeight);
  if(!(width>0&&height>0))return;
  lastLayoutWidth=layoutWidth;
  const next={position:'absolute',inset:'auto',left:(win.scrollX||0)+'px',top:(win.scrollY||0)+'px',width:width+'px',height:height+'px'};
  for(const [name,value] of Object.entries(next))if(root.style[name]!==value)root.style[name]=value;
 }
 function schedule(){if(disposed||pending)return;pending=true;win.requestAnimationFrame(()=>{pending=false;update();});}
 const bindings=[[win,'resize'],[win,'orientationchange'],[win,'scroll'],[win,'pageshow'],[viewport,'resize'],[viewport,'scroll']].filter(([target])=>target);
 for(const [target,event] of bindings)target.addEventListener(event,schedule,{passive:true});
 update();
 return{update:schedule,dispose(){disposed=true;for(const [target,event] of bindings)target.removeEventListener(event,schedule);}};
}
