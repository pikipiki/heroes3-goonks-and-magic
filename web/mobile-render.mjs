const configured=new WeakSet();

export function isMobileLayout(win=window){
 const choice=new URLSearchParams(win.location.search).get('mobile');
 return win.goonkMobileActive??=choice==='1'||(choice!=='0'&&win.matchMedia('(max-width: 960px), (pointer: coarse)').matches);
}
// The touch view samples this canvas on its own animation frame, after WebGL
// presentation. Safari may have cleared a non-preserved drawing buffer by then.
export function configureMobileSource(canvas,mobile){
 if(mobile===undefined&&typeof window!=='undefined')mobile=isMobileLayout();
 if(!mobile||!canvas||configured.has(canvas))return;
 const getContext=canvas.getContext.bind(canvas);
 canvas.getContext=(type,options)=>getContext(type,/^(webgl2?|experimental-webgl)$/.test(type)?{...options,preserveDrawingBuffer:true}:options);
 configured.add(canvas);
}

// Safari sends intermediate sizes during a rotation. Keep drawing at the new
// CSS geometry, but replace the backing surface only once the size settles.
export function createCanvasSizer({clock=()=>performance.now(),settleMs=120,maxPixels=2000000}={}){
 const sizes=new WeakMap();
 return {
  fit(canvas,width,height,dpr=1){
   const density=Math.min(dpr,2,Math.sqrt(maxPixels/(width*height))),w=Math.max(1,Math.round(width*density)),h=Math.max(1,Math.round(height*density)),now=clock();
   let size=sizes.get(canvas);const fresh=!size||!canvas.width||!canvas.height;
   if(!size||size.w!==w||size.h!==h){size={w,h,since:now};sizes.set(canvas,size);}
   if(fresh||now-size.since>=settleMs){if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;}
   return {x:canvas.width/width,y:canvas.height/height};
  },
  release(canvas){sizes.delete(canvas);if(canvas.width)canvas.width=0;if(canvas.height)canvas.height=0;}
 };
}
