import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-battle-losses';fs.mkdirSync(out,{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
  await page.route('**/loss-layout',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/ui/material-components.css><style>html,body{margin:0;width:100%;height:100%;background:#20180e}canvas{display:block;width:100%;height:100%}</style><canvas id=field></canvas>'}));
  await page.goto('http://localhost/loss-layout');
  for(const language of ['fr','en'])for(const [width,height] of [[320,260],[320,350],[360,350],[430,674],[568,230],[640,360],[716,279],[932,430]])for(const vertical of [false,true]){
   await page.setViewportSize({width,height});
   const result=await page.evaluate(async({width,height,language,vertical})=>{
    const {setLanguage}=await import('/web/i18n.mjs');setLanguage(language);
    const {paintEnemyLosses,overlaps,enemyLossDescription}=await import('/web/ui/battle-losses.mjs');
    const {setBattleLossEstimates}=await import('/web/battle-preferences.mjs');
    const {verticalBattleGeometry}=await import('/web/battle-vertical.mjs');
    setBattleLossEstimates(true);
    const canvas=document.querySelector('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
    const scale=Math.min(width/800,height/555),geometry=vertical?verticalBattleGeometry(width,height):{project:p=>({x:p.x*scale,y:p.y*scale}),scale};
    const layout={...geometry,x:0,y:0,dx:0,dy:0,w:width/geometry.scale,h:height/geometry.scale};
    const units=Array.from({length:16},(_,i)=>({stackId:i+1,id:i,count:42,name:i===7?'Commander':(language==='fr'?'Créature':'Creature')+' '+i,x:268+(i%4)*44+(Math.floor(i/4)%2)*22,y:205+Math.floor(i/4)*42,enemy:i%2===1||i===14,canMeleeAt:true,attackLosses:{actor:1,min:i,max:i+2}}));
    const state={mode:'battle',round:1,canAct:true,activeStack:1,activeUnit:{...units[0],controlled:true},battleUnits:units};
    const blocked=units.map(unit=>{const p=layout.project(unit),s=layout.scale;return{x:p.x-28*s,y:p.y-62*s,w:65*s,h:85*s};});
    const counters=units.map(unit=>{const p=layout.project(unit);return{x:p.x-10,y:p.y+10,w:20,h:13};});
    ctx.fillStyle='#33452a';ctx.fillRect(0,0,width,height);
    blocked.forEach((box,i)=>{ctx.fillStyle=units[i].enemy?'#772b24':'#294d67';ctx.fillRect(box.x,box.y,box.w,box.h);});
    counters.forEach(box=>{ctx.fillStyle='#1b1826';ctx.fillRect(box.x,box.y,box.w,box.h);});
    const placed=paintEnemyLosses(ctx,state,layout,{occlusion:[...blocked,...counters]});
    const expected=units.filter(unit=>unit.enemy).length;
    const covered=placed.some(box=>[...blocked,...counters].some(obstacle=>overlaps(box,obstacle)));
    const stable=JSON.stringify(paintEnemyLosses(ctx,state,layout,{occlusion:[...blocked,...counters]}))===JSON.stringify(placed);
    const begin=performance.now();for(let i=0;i<100;i++)paintEnemyLosses(ctx,state,layout,{occlusion:[...blocked,...counters]});const cachedFrameMs=(performance.now()-begin)/100;
    const description=enemyLossDescription(state);
    setBattleLossEstimates(false);const disabled=paintEnemyLosses(ctx,state,layout,{occlusion:[...blocked,...counters]}).length;
    setBattleLossEstimates(true);
    return{expected,painted:placed.length,covered,stable,disabled,cachedFrameMs,description};
   },{width,height,language,vertical});
   assert.equal(result.painted,result.expected,'Every adjacent enemy has its own label '+JSON.stringify({name,width,height,vertical,result}));
   assert.equal(result.covered,false);assert(result.stable);assert.equal(result.disabled,0);assert(result.cachedFrameMs<10,'Cached annotations remain inexpensive');
   assert.match(result.description,language==='fr'?/Pertes ennemies/:/Estimated enemy/);
   await page.screenshot({path:`${out}/${name}-${language}-${width}x${height}-${vertical?'vertical':'classic'}.png`});
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,'32 dense mixed-army cases, all enemy labels visible, no creature/counter overlap, stable cached placement and instant preference toggle');
 }finally{await browser.close();}
}
