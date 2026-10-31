import{test}from'node:test';import assert from'node:assert/strict';import{canCloseTavern,nativeCloseTarget}from'../web/native-dialog.mjs';import{fitRegion}from'../web/mobile-layout.mjs';
const state={mode:'dialog',dialogKind:'tavern',rect:{x:203,y:48,w:395,h:504},dialogCloseRect:{x:513,y:476,w:64,h:32}};
test('Tavern cancel stays reachable after portrait/landscape changes and zoom',()=>{
 for(const [width,height]of [[320,400],[390,690],[844,300],[310,275]])for(const zoom of [1,1.25,2]){
  const layout=fitRegion(width,height,state.rect,zoom,{x:545,y:492}),hit=nativeCloseTarget(state,layout,width,height);
  assert(hit);assert(hit.w>=44&&hit.h>=44);assert(hit.x>=0&&hit.y>=0&&hit.x+hit.w<=width&&hit.y+hit.h<=height);
  const x=layout.dx+(545-layout.x)*layout.scale,y=layout.dy+(492-layout.y)*layout.scale;assert(x>=hit.x&&x<=hit.x+hit.w&&y>=hit.y&&y<=hit.y+hit.h);
 }
});
test('An old cancel cannot affect a town, battle or another dialog',()=>{
 for(const override of [{mode:'town'},{mode:'battle'},{dialogKind:'confirmation'}]){const next={...state,...override};assert(!canCloseTavern(next));assert.equal(nativeCloseTarget(next,{},390,600),null);}
 assert.equal(nativeCloseTarget(state,null,390,600),null);
});
