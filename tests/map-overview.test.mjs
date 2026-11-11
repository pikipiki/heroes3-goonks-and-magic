import{test}from'node:test';import assert from'node:assert/strict';
import{mapOverviewGeometry,mapOverviewTarget,mapOverviewViewport,paintMapOverview}from'../web/map-overview.mjs';
const map={rect:{x:630,y:26,w:144,h:144},view:{x:6,y:6,w:600,h:540},viewport:{x:10,y:20,w:20,h:18},width:144,height:144};
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('A tap targets the native minimap, including the final pixel, never the adventure scene',()=>{
 assert.deepEqual(mapOverviewTarget(map,120,120,240,240),{x:702,y:98});assert.deepEqual(mapOverviewTarget(map,240,240,240,240),{x:773,y:169});assert.equal(mapOverviewTarget(map,-1,120,240,240),null);assert.equal(mapOverviewTarget(map,NaN,120,240,240),null);assert.equal(mapOverviewGeometry(null,240,240),null);
});
test('Rectangular worlds keep their aspect ratio and ignore taps in the letterbox',()=>{
 const wide={...map,rect:{x:630,y:26,w:144,h:72},width:144,height:72};assert.deepEqual(mapOverviewGeometry(wide,240,240),{x:0,y:60,w:240,h:120});assert.equal(mapOverviewTarget(wide,120,20,240,240),null);assert.deepEqual(mapOverviewTarget(wide,120,120,240,240),{x:702,y:62});
});
test('The gold frame tracks the cropped mobile camera and is clipped at world borders',()=>{
 const cropped=mapOverviewViewport(map,{x:156,y:6,w:300,h:540},240,240);near(cropped.x,25);near(cropped.y,20/144*240);near(cropped.w,10/144*240);near(cropped.h,30);
 const edge=mapOverviewViewport({...map,width:36,height:36,viewport:{x:-10,y:-10,w:20,h:20}},{x:6,y:6,w:600,h:540},240,240);near(edge.x,0);near(edge.y,0);near(edge.w,10/36*240);
 assert.equal(mapOverviewViewport({...map,viewport:{x:200,y:200,w:20,h:20}},{x:6,y:6,w:600,h:540},240,240),null);
});
test('Retina rendering copies the native fogged map using logical engine coordinates',()=>{
 const calls=[],ctx={canvas:{width:240,height:240},save(){},restore(){},fillRect(){},drawImage(...args){calls.push(args);},strokeRect(){}};const source={width:1600,height:1200};paintMapOverview(ctx,source,map,{x:6,y:6,w:600,h:540});assert.deepEqual(calls[0],[source,1260,52,288,288,0,0,240,240]);
});
test('Independent minimap pixels survive an unrelated native framebuffer and do not cross map levels',()=>{
 const calls=[],ctx={canvas:{width:240,height:240},save(){},restore(){},fillRect(){},drawImage(...args){calls.push(args);},strokeRect(){}};
 const source={width:800,height:600},atlas={width:240,height:240};globalThis.window={goonkMinimapAtlas:atlas,goonkMinimapLevel:0};
 try{paintMapOverview(ctx,source,{...map,level:0},null);assert.equal(calls[0][0],atlas);paintMapOverview(ctx,source,{...map,level:1},null);assert.equal(calls[1][0],source);}finally{delete globalThis.window;}
});
