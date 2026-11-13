/** Native tile coordinates after cmd6; independent of the hero's travelled path. */
export async function clickNativeWorldTile(page,x,y){
 return page.evaluate(({x,y})=>{
  const m=goonkMobileState.mapOverview,v=m.view;
  if(goonkMobileState.worldView||m.viewport.w!==Math.floor(v.w/32)+2||m.viewport.h!==Math.floor(v.h/32)+2)throw Error('Expected normal native32px map tiles');
  // MapViewModel floors the partial top-left tile. centerOnObject centres
  // on a tile's16px centre, allowing exact inverse after native movement.
  const cx=m.viewport.x+Math.ceil((v.w/2-16)/32),cy=m.viewport.y+Math.ceil((v.h/2-16)/32);
  const pixel={x:v.x+v.w/2+(x-cx)*32,y:v.y+v.h/2+(y-cy)*32};
  Module._vcmiMobilePointer(pixel.x,pixel.y,1);return{tile:{x,y},camera:{x:cx,y:cy},pixel};
 },{x,y});
}
