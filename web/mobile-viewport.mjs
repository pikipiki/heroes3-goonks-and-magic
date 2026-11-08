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
 const wakeTimers=new Set();
 function clearWakeTimers(){for(const t of wakeTimers)clearTimeout(t);wakeTimers.clear();}
 function update(){
  if(disposed||(win.document?.hidden===true))return;
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
  const isLandscape=win.matchMedia?.('(orientation: landscape)')?.matches??(layoutWidth>layoutHeight);
  const isPortrait=win.matchMedia?.('(orientation: portrait)')?.matches??(layoutHeight>layoutWidth);
  let finalWidth=width,finalHeight=height;
  if(isLandscape){
   finalWidth=Math.max(finalWidth,finalHeight,layoutWidth,win.innerWidth||0);
   finalHeight=Math.min(finalHeight,layoutHeight,win.innerHeight||layoutHeight);
   if(finalWidth<finalHeight)[finalWidth,finalHeight]=[finalHeight,finalWidth];
  }else if(isPortrait){
   finalHeight=Math.max(finalWidth,finalHeight,layoutHeight,win.innerHeight||0);
   finalWidth=Math.min(finalWidth,layoutWidth,win.innerWidth||layoutWidth);
   if(finalHeight<finalWidth)[finalWidth,finalHeight]=[finalHeight,finalWidth];
  }
  lastLayoutWidth=layoutWidth;
  const next={position:'absolute',inset:'auto',left:(win.scrollX||0)+'px',top:(win.scrollY||0)+'px',width:finalWidth+'px',height:finalHeight+'px'};
  for(const [name,value] of Object.entries(next))if(root.style[name]!==value)root.style[name]=value;
 }
 function schedule(){if(disposed||pending)return;pending=true;win.requestAnimationFrame(()=>{pending=false;update();});}
 function onWake(){
  if(win.document?.hidden===true)return;
  lastLayoutWidth=undefined;
  if(typeof win.scrollTo==='function')try{win.scrollTo(0,0);}catch(_){}
  schedule();
  for(const delay of [60,150,300,500]){
   const timer=setTimeout(()=>{
    wakeTimers.delete(timer);
    if(disposed||win.document?.hidden===true)return;
    if(typeof win.scrollTo==='function')try{win.scrollTo(0,0);}catch(_){}
    schedule();
   },delay);
   wakeTimers.add(timer);
  }
 }
 const bindings=[
  [win,'resize',schedule],
  [win,'orientationchange',schedule],
  [win,'scroll',schedule],
  [win,'pageshow',onWake],
  [win,'focus',onWake],
  [win,'fullscreenchange',schedule],
  [win.document,'visibilitychange',onWake],
  [viewport,'resize',schedule],
  [viewport,'scroll',schedule]
 ].filter(([target])=>typeof target?.addEventListener==='function');
 for(const [target,event,listener] of bindings)target.addEventListener(event,listener,{passive:true});
 update();
 return{update:schedule,dispose(){disposed=true;clearWakeTimers();for(const [target,event,listener] of bindings)target.removeEventListener(event,listener);}};
}

export function enableFullscreenOnPlay(win=window){
 const doc=win.document;
 const surface=doc.documentElement;
 if(!doc.fullscreenEnabled||typeof surface.requestFullscreen!=='function')return;
 if(win.navigator.standalone||win.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches)return;
 let requested=false;
 doc.addEventListener('click',event=>{
  if(requested||!event.isTrusted||doc.fullscreenElement)return;
  const button=event.target.closest?.('button:is([data-ui="begin"],[data-campaign-start],[data-room-action="start"],[data-hosted-play])');
  if(!button||button.disabled)return;
  // Request during the trusted click, before the game starts loading.
  requested=true;
  surface.requestFullscreen({navigationUI:'hide'}).catch(()=>{requested=false;});
 },{capture:true});
}
