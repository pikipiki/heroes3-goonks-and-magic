const configured=new WeakSet();
// The touch view samples this canvas on its own animation frame, after WebGL
// presentation. Safari may have cleared a non-preserved drawing buffer by then.
export function configureMobileSource(canvas,mobile){
 if(!mobile||!canvas||configured.has(canvas))return;
 const getContext=canvas.getContext.bind(canvas);
 canvas.getContext=(type,options)=>getContext(type,/^(webgl2?|experimental-webgl)$/.test(type)?{...options,preserveDrawingBuffer:true}:options);
 configured.add(canvas);
}
