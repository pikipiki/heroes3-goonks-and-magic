import{test}from'node:test';import assert from'node:assert/strict';import{anchorMobileViewport,coalesceViewportResize,createMapPan}from'../web/mobile-viewport.mjs';
test('Rotation events settle once and late duplicates leave new gestures alone',()=>{
 const queue=[],applied=[];let size={width:390,height:844};const resize=coalesceViewportResize(()=>size,s=>applied.push(s),{schedule:f=>queue.push(f)});
 resize();queue.shift()();for(let i=0;i<30;i++)resize();assert.equal(queue.length,1);queue.shift()();assert.equal(applied.length,1);
 size={width:844,height:390};resize();size={width:390,height:844};resize();queue.shift()();assert.equal(applied.length,1);
 size={width:844,height:390};resize();queue.shift()();size={width:390,height:844};resize();queue.shift()();assert.equal(applied.length,3);assert.deepEqual(applied.at(-1),size);
});
test('Map pan preserves the combined distance and discards old-orientation commands',()=>{
 const queue=[],sent=[],pan=createMapPan(d=>sent.push(d),{schedule:f=>queue.push(f)});
 pan.add(-4,2);pan.add(-6,5);assert.equal(queue.length,1);queue.shift()();assert.deepEqual(sent,[{x:-10,y:7}]);
 pan.add(100,0);pan.cancel();pan.add(0,-3);queue.shift()();assert.equal(sent.length,1);queue.shift()();assert.deepEqual(sent.at(-1),{x:0,y:-3});
 pan.add(1,2);pan.add(-1,-2);queue.shift()();assert.equal(sent.length,2);
});

// The bridge accepts integer native pixels. Rounding each finger sample made
// a slow drag stop completely once the map was zoomed in.
test('Slow zoomed map drags retain their distance across frames',async()=>{
 const {mapDrag}=await import('../web/mobile-layout.mjs');
 for(const scale of [1.25,2.5,4.875])for(const direction of [-1,1]){
  const queue=[],sent=[],pan=createMapPan(d=>{assert(Number.isInteger(d.x)&&Number.isInteger(d.y));sent.push(d);},{schedule:f=>queue.push(f)});
  for(let i=0;i<160;i++){const d=mapDrag(direction,0.25,scale);pan.add(d.x,d.y);queue.shift()();}
  const total=sent.reduce((a,d)=>({x:a.x+d.x,y:a.y+d.y}),{x:0,y:0});
  assert(sent.length>0);assert(Math.abs(total.x+160*direction/scale)<=.5);assert(Math.abs(total.y+40/scale)<=.5);
 }
});
test('Cancelling a map gesture also discards subpixel remainders',()=>{
 const queue=[],sent=[],pan=createMapPan(d=>sent.push(d),{schedule:f=>queue.push(f)});
 pan.add(.4,.4);queue.shift()();assert.equal(sent.length,0);pan.cancel();
 pan.add(.4,.4);queue.shift()();assert.equal(sent.length,0);
 pan.add(.4,.4);queue.shift()();assert.deepEqual(sent,[{x:1,y:1}]);
});

test('Document anchor keeps mobile buttons in client coordinates after iOS Home Screen rotation',async()=>{
 const {anchorMobileViewport}=await import('../web/mobile-viewport.mjs');
 class Target extends EventTarget{}
 const queue=[],win=new Target(),viewport=new Target();Object.assign(viewport,{width:430,height:873,scale:1,offsetTop:59});Object.assign(win,{visualViewport:viewport,scrollX:0,scrollY:59,requestAnimationFrame:f=>queue.push(f)});
 let writes=0;const values={},root={style:new Proxy(values,{set(o,k,v){writes++;o[k]=v;return true;}})};
 const anchor=anchorMobileViewport(root,win);assert.equal(values.position,'absolute');assert.equal(parseFloat(values.top)-win.scrollY,0);assert.equal(values.height,'873px');
 // Ignore visualViewport.offsetTop: adding the iOS stale safe-area offset
 // would move hit targets away from the visible controls for a second time.
 assert.equal(values.top,'59px');const initialWrites=writes;
 viewport.dispatchEvent(new Event('scroll'));win.dispatchEvent(new Event('resize'));assert.equal(queue.length,1);queue.shift()();assert.equal(writes,initialWrites);
 Object.assign(viewport,{width:932,height:430,offsetTop:0});win.scrollY=0;win.dispatchEvent(new Event('orientationchange'));queue.shift()();assert.equal(values.width,'932px');assert.equal(values.height,'430px');assert.equal(values.top,'0px');
 Object.assign(viewport,{width:430,height:873,offsetTop:59});win.scrollY=59;viewport.dispatchEvent(new Event('scroll'));queue.shift()();assert.equal(parseFloat(values.top)-win.scrollY,0);assert.equal(values.width,'430px');
 // Browser toolbar/keyboard changes resize the root, without resetting focus
 // or writing window scroll position. Native pinch zoom is left alone.
 viewport.height=500;viewport.dispatchEvent(new Event('resize'));queue.shift()();assert.equal(values.height,'500px');
 viewport.scale=2;viewport.width=215;viewport.dispatchEvent(new Event('resize'));queue.shift()();assert.equal(values.width,'430px');
 win.innerWidth=873;win.innerHeight=360;win.dispatchEvent(new Event('orientationchange'));queue.shift()();assert.equal(values.width,'873px');assert.equal(values.height,'360px');
 win.innerWidth=430;win.innerHeight=873;viewport.scale=1;viewport.width=430;viewport.height=873;win.dispatchEvent(new Event('pageshow'));queue.shift()();assert.equal(values.height,'873px');
 anchor.dispose();win.dispatchEvent(new Event('resize'));assert.equal(queue.length,0);
});
test('Mobile document anchor works without visualViewport in desktop browsers',async()=>{
 const {anchorMobileViewport}=await import('../web/mobile-viewport.mjs');const win=new EventTarget();Object.assign(win,{innerWidth:800,innerHeight:600,scrollX:0,scrollY:0,requestAnimationFrame:f=>f()});const root={style:{}};
 const anchor=anchorMobileViewport(root,win);assert.equal(root.style.width,'800px');assert.equal(root.style.height,'600px');win.innerWidth=600;win.innerHeight=800;win.dispatchEvent(new Event('resize'));assert.equal(root.style.height,'800px');anchor.dispose();
});

test('Android rotation shrinks the app even while overflow keeps innerWidth at the old size',async()=>{
 const {anchorMobileViewport}=await import('../web/mobile-viewport.mjs');
 const win=new EventTarget(),viewport=new EventTarget(),layout={clientWidth:844,clientHeight:360};
 Object.assign(viewport,{width:844,height:360,scale:1});
 Object.assign(win,{document:{documentElement:layout},innerWidth:844,innerHeight:360,visualViewport:viewport,requestAnimationFrame:f=>f()});
 const root={style:{}};
 anchorMobileViewport(root,win);
 assert.equal(root.style.width,'844px');
 Object.assign(layout,{clientWidth:360,clientHeight:650});
 Object.assign(viewport,{width:844,height:1300,scale:.5});
 viewport.dispatchEvent(new Event('resize'));
 assert.equal(root.style.width,'360px');
 assert.equal(root.style.height,'650px');
});

test('Screen lock while hidden preserves active geometry and wake restores viewport',async()=>{
 const {anchorMobileViewport}=await import('../web/mobile-viewport.mjs');
 class Target extends EventTarget{}
 const queue=[],win=new Target(),doc=new Target(),viewport=new Target();
 doc.hidden=false;
 let scrolledTo=null;
 win.scrollTo=(x,y)=>{scrolledTo={x,y};win.scrollX=x;win.scrollY=y;};
 Object.assign(viewport,{width:932,height:430,scale:1});
 Object.assign(win,{document:doc,innerWidth:932,innerHeight:430,visualViewport:viewport,scrollX:0,scrollY:0,requestAnimationFrame:f=>queue.push(f)});
 const root={style:{}};
 const anchor=anchorMobileViewport(root,win);
 assert.equal(root.style.width,'932px');
 assert.equal(root.style.height,'430px');

 // Screen locks: document is hidden. OS sends portrait resize (e.g. lock screen)
 doc.hidden=true;
 Object.assign(viewport,{width:430,height:873});
 win.innerWidth=430;win.innerHeight=873;
 viewport.dispatchEvent(new Event('resize'));
 win.dispatchEvent(new Event('resize'));
 if(queue.length)queue.shift()();
 // Should NOT overwrite with lock screen dimensions
 assert.equal(root.style.width,'932px');
 assert.equal(root.style.height,'430px');

 // Screen wakes up in landscape
 doc.hidden=false;
 Object.assign(viewport,{width:932,height:430});
 win.innerWidth=932;win.innerHeight=430;
 doc.dispatchEvent(new Event('visibilitychange'));
 assert.equal(queue.length,1);
 queue.shift()();
 assert.equal(root.style.width,'932px');
 assert.equal(root.style.height,'430px');
 assert.deepEqual(scrolledTo,{x:0,y:0});
 anchor.dispose();
});

test('Wake with stale inverted viewport dimensions is corrected by active orientation media query',async()=>{
 const {anchorMobileViewport}=await import('../web/mobile-viewport.mjs');
 class Target extends EventTarget{}
 const queue=[],win=new Target(),doc=new Target(),viewport=new Target();
 doc.hidden=false;
 win.scrollTo=()=>{};
 win.matchMedia=q=>({matches:q.includes('landscape')});
 Object.assign(viewport,{width:430,height:932,scale:1});
 Object.assign(win,{document:doc,innerWidth:932,innerHeight:430,visualViewport:viewport,scrollX:0,scrollY:0,requestAnimationFrame:f=>queue.push(f)});
 const root={style:{}};
 const anchor=anchorMobileViewport(root,win);
 assert.equal(root.style.width,'932px');
 assert.equal(root.style.height,'430px');
 anchor.dispose();
});

test('Delayed viewport resize after orientationchange settles to new landscape size',async()=>{
 const {anchorMobileViewport}=await import('../web/mobile-viewport.mjs');
 class Target extends EventTarget{}
 const queue=[],win=new Target(),doc=new Target(),viewport=new Target();
 doc.hidden=false;
 win.scrollTo=()=>{};
 Object.assign(viewport,{width:390,height:844,scale:1});
 Object.assign(win,{document:doc,innerWidth:390,innerHeight:844,visualViewport:viewport,scrollX:0,scrollY:0,requestAnimationFrame:f=>queue.push(f)});
 const root={style:{}};
 const anchor=anchorMobileViewport(root,win);
 assert.equal(root.style.width,'390px');
 // Fire orientationchange while dimensions are still old portrait
 win.dispatchEvent(new Event('orientationchange'));
 if(queue.length)queue.shift()();
 // Dimensions update 100ms later in Safari
 Object.assign(viewport,{width:844,height:390});
 win.innerWidth=844;win.innerHeight=390;
 win.matchMedia=q=>({matches:q.includes('landscape')});
 // Wait for timer
 await new Promise(resolve=>setTimeout(resolve,150));
 if(queue.length)queue.shift()();
 assert.equal(root.style.width,'844px');
 assert.equal(root.style.height,'390px');
 anchor.dispose();
});


test('Safari toolbar height uses the visible viewport rather than the taller layout viewport',()=>{
 const win=new EventTarget(),viewport=new EventTarget();
 Object.assign(viewport,{width:430,height:810,scale:1});
 Object.assign(win,{document:{documentElement:{clientWidth:430,clientHeight:932}},innerWidth:430,innerHeight:932,visualViewport:viewport,requestAnimationFrame:f=>f()});
 const root={style:{}};const anchor=anchorMobileViewport(root,win);
 assert.equal(root.style.height,'810px');assert.equal(root.style.width,'430px');anchor.dispose();
});

test('Physical orientation wins over stale Safari media and layout sizes after wake',()=>{
 const win=new EventTarget(),viewport=new EventTarget();Object.assign(viewport,{width:932,height:430,scale:1,pageLeft:12,pageTop:24});
 Object.assign(win,{screen:{orientation:{type:'landscape-primary'}},matchMedia:q=>({matches:q.includes('portrait')}),document:{documentElement:{clientWidth:430,clientHeight:932}},innerWidth:430,innerHeight:932,visualViewport:viewport,requestAnimationFrame:f=>f()});
 const root={style:{}},anchor=anchorMobileViewport(root,win);assert.equal(root.style.width,'932px');assert.equal(root.style.height,'430px');assert.equal(root.style.left,'12px');assert.equal(root.style.top,'24px');anchor.dispose();
});

test('Wake repairs a viewport that settles after the first 800ms without a resize event',async()=>{
 const win=new EventTarget(),viewport=new EventTarget(),doc=new EventTarget();doc.hidden=false;
 Object.assign(viewport,{width:844,height:390,scale:1});Object.assign(win,{document:doc,innerWidth:844,innerHeight:390,visualViewport:viewport,requestAnimationFrame:f=>f(),scrollTo(){}});
 const root={style:{}},anchor=anchorMobileViewport(root,win);win.dispatchEvent(new Event('pageshow'));
 await new Promise(resolve=>setTimeout(resolve,950));viewport.height=360;win.innerHeight=360;
 await new Promise(resolve=>setTimeout(resolve,650));assert.equal(root.style.height,'360px');anchor.dispose();
});
