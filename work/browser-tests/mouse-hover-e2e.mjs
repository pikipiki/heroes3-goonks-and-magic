import {chromium} from 'playwright-core';import sharp from 'sharp';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224'),c=b.contexts()[0],p=await c.newPage(),report={checks:[],errors:[],phases:[]};for(const other of c.pages())if(other!==p)await other.close();p.on('pageerror',e=>report.errors.push(e.message));
await p.addInitScript(()=>{let last=performance.now();window.mouseGaps=[];setInterval(()=>{const now=performance.now();if(now-last>150)mouseGaps.push(now-last);last=now;},25);});
const wait=fn=>p.waitForFunction(fn,null,{timeout:60000}),command=(a,b=0)=>p.evaluate(([a,b])=>Module._vcmiMobileCommand(a,b,0,0,0,0),[a,b]);
try{
 await p.setViewportSize({width:1024,height:768});await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto('http://127.0.0.1:8768/heroes-goonk/?mobile=0');
 assert.equal(await p.locator('input[type=file]').count(),0);
 await wait(()=>window.goonkGameMenuState?.ready);assert.equal(await p.evaluate(()=>!!Module._vcmiArmMouseContention),false);report.checks.push('Release engine contains no temporary contention hook');
 await command(20);await wait(()=>goonkGameMenuState.native.mode==='lobby');await command(21);await p.waitForTimeout(300);await command(22);await wait(()=>goonkGameMenuState.native.mode==='map');await command(4);await wait(()=>!!goonkGameMenuState.native.heroName);await p.waitForTimeout(300);
 const cdp=await c.newCDPSession(p);await p.evaluate(()=>mouseGaps=[]);
 async function sweep(){for(let batch=0;batch<8;batch++)await Promise.all(Array.from({length:40},(_,i)=>cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:80+(i*41+batch*17)%620,y:80+(i*31+batch*13)%470})));}
 await sweep();await p.waitForTimeout(300);report.phases.push({name:'320 mouse-only events',gaps:await p.evaluate(()=>mouseGaps)});report.checks.push('Mouse-only sweep completed');
 const initial=await p.evaluate(()=>goonkGameMenuState.native.movement);
 for(let turn=0;turn<3;turn++){
  await command(4);await p.waitForTimeout(250);
  const box=await p.locator('#canvas').boundingBox(),image=await sharp(await p.locator('#canvas').screenshot()).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const points=[];for(let y=60;y<image.info.height-70;y++)for(let x=30;x<image.info.width-215;x++){const i=(y*image.info.width+x)*4;if(image.data[i]>180&&image.data[i+1]<65&&image.data[i+2]<65)points.push({x,y});}
  assert(points.length,'Hero flag must be visible');const flag={x:points.reduce((a,p)=>a+p.x,0)/points.length,y:points.reduce((a,p)=>a+p.y,0)/points.length};
  await p.mouse.click(box.x+flag.x+(turn%2===0?50:-50),box.y+flag.y+30);await wait(()=>goonkGameMenuState.native.hasPath);await command(2);await sweep();await wait(()=>!goonkGameMenuState.native.hasPath&&goonkGameMenuState.native.mode==='map');
 }
 report.movement={before:initial,after:await p.evaluate(()=>goonkGameMenuState.native.movement)};assert(report.movement.after<initial);report.phases.push({name:'960 mouse events during three hero moves',gaps:await p.evaluate(()=>mouseGaps)});report.checks.push('Hero movement and repeated mouse sweeps completed');
 report.maxBrowserGapMs=Math.max(0,...report.phases.flatMap(x=>x.gaps));assert(report.maxBrowserGapMs<2000);assert.deepEqual(report.errors,[]);await p.screenshot({path:'../../outputs/mouse-hover-after.png'});console.log(JSON.stringify(report));
}catch(e){report.failure=e.stack;console.error(e.stack);await p.screenshot({path:'../../outputs/mouse-hover-failure.png'});}
fs.writeFileSync('../../outputs/mouse-hover-validation.json',JSON.stringify(report,null,2));process.exit(report.failure?1:0);
