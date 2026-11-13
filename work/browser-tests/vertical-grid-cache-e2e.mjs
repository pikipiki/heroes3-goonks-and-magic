import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const web=path.resolve(process.env.GOONK_TEST_WEB_ROOT||'web'),baseline=process.env.GOONK_VERTICAL_BASELINE;
const server=http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=url.pathname.endsWith('/baseline.mjs')?baseline:path.join(web,url.pathname.replace(/^\/web\//,''));res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{for(const [kind,engine]of Object.entries({chromium,webkit})){
 const b=await engine.launch({headless:true});try{const p=await b.newPage();await silenceTestAudio(p);await p.route('**/fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html>'}));await p.goto('http://127.0.0.1:'+server.address().port+'/fixture');
 const report=await p.evaluate(async()=>{
  const old=await import('/web/baseline.mjs'),next=await import('/web/battle-vertical.mjs');
  const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
  const ground=canvas(800,600);ground.getContext('2d').fillStyle='#426b38';ground.getContext('2d').fillRect(0,0,800,600);
  const atlas=canvas(1024,128);atlas.getContext('2d').fillStyle='#e43';atlas.getContext('2d').fillRect(8,8,112,112);
  const planes={ground,effects:canvas(800,600)},ids=new Map([[1,0]]),bounds=[{stackId:1,x:82,y:150,w:40,h:60,renderX:102,renderY:196}];
  let cells=[];for(let r=0;r<11;r++)for(let c=1;c<16;c++)cells.push({hex:r*17+c,x:36+(r%2===0?22:0)+44*c,y:112+42*r,reachable:c<7});
  let units=[{stackId:1,x:102,y:196,count:3,occupied:[35],enemy:false}];
  const result=[];
  for(const [width,height,dpr]of [[393,590,2],[393,590,2],[768,900,1],[320,420,2],[393,590,2]]){
   if(result.length===1)cells=cells.map(c=>({...c,reachable:!c.reachable}));if(result.length===3)units=units.map(u=>({...u,occupied:[36,37]}));
   const state={mode:'battle',canAct:true,round:1,activeStack:1,battleUnits:units,battleCells:cells};
   const images=[],counts=[];
   for(const mod of [old,next]){
    const c=canvas(width*dpr,height*dpr),ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);let strokes=0;const stroke=CanvasRenderingContext2D.prototype.stroke;CanvasRenderingContext2D.prototype.stroke=function(...a){strokes++;return stroke.apply(this,a);};
    for(let i=0;i<12;i++)mod.paintVerticalBattle(ctx,width,height,state,null,planes,atlas,ids,bounds);
    CanvasRenderingContext2D.prototype.stroke=stroke;images.push(ctx.getImageData(0,0,c.width,c.height).data);counts.push(strokes);
   }
   let max=0,different=0;for(let i=0;i<images[0].length;i++){const d=Math.abs(images[0][i]-images[1][i]);max=Math.max(max,d);if(d)different++;}result.push({width,height,dpr,counts,max,different});
  }
  return result;
 });
 for(const r of report){assert(r.counts[1]<r.counts[0]/3,JSON.stringify(r));assert(r.max<=4,'Transparent-layer rounding stays within 4/255 '+JSON.stringify(r));}console.log('PASS',kind,JSON.stringify(report));
 }finally{await b.close();}
}}finally{server.close();}
