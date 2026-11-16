// A second release must hit the same destination in the same turn/selection.
export function createDoubleTap(clock=()=>Date.now()){
 let previous=null;
 return {reset(){previous=null;},tap(point,context,tolerance=16){
  const time=clock(),match=previous&&previous.context===context&&time-previous.time<=450&&Math.hypot(point.x-previous.x,point.y-previous.y)<=tolerance;
  previous=match?null:{...point,context,time};return !!match;
 }};
}
