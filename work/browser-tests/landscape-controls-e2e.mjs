import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const unit={id:1,name:'Pixie',count:12,attack:2,defense:2,health:4,speed:8,damageMin:1,damageMax:2,cost:[0,0,0,0,0,0,40]};
const base={turn:true,day:1,resources:[10,10,10,10,10,10,10000],heroId:1,heroName:'Hero',heroes:[{id:1,name:'Hero'}],towns:[{index:0,name:'Castle'}]};
const cases=[
 ['map',{mode:'map'},'.scene-tools button,.mobile-nav>button'],
 ['town',{mode:'town',townName:'Castle',buildings:[]},'.mobile-nav>button'],
 ['battle',{mode:'battle',round:1,canAct:true,canAutoCombat:true,canRetreat:true,activeStack:1,activeUnit:unit,battleUnits:[{...unit,stackId:1,x:102,y:196,enemy:false}],battleCells:[]},'.mobile-top button,.mobile-nav>button'],
 ['hero',{mode:'hero',heroWindow:{id:1,name:'Hero',owned:true,primarySkills:[1,2,3,4],commanderIcon:0,slots:Array.from({length:19},(_,slot)=>({slot}))}},'[data-hero-close],.hero-bag-tabs button,.hero-artifact-actions button'],
 ['fort',{mode:'fort',fortFamilies:[{level:0,count:12,variants:[{...unit,built:true,rank:0}]}],previewUnits:[]},'.creature-view-head button,.hall-actions button,.hall-quantity button'],
 ['creature',{mode:'creature',creatureUnit:unit,previewUnits:[unit]},'.creature-view-head button'],
 ['spellbook',{mode:'spellbook',spellbook:{mana:10,page:0,pages:1,school:-1,inCombat:false,combatSpells:false,spells:[{id:15,name:'Magic Arrow',cost:5,level:1,enabled:true}]}},'.mobile-spellbook>header button,.spell-schools button,.spell-contexts button,.mobile-spellbook>footer button'],
 ['guild',{mode:'mage-guild',mageGuild:{town:1,levels:5,built:1,spells:[]}},'[data-guild-view],[data-guild-close],[data-guild-level]'],
 ['market',{mode:'market',marketQuotes:[[0,1,1,1]]},'.market-header button,.market-deal button'],
 ['tavern',{mode:'dialog',dialogKind:'tavern',tavern:{cost:2500,canRecruit:true,rumor:'Rumor'},tavernHeroes:{0:{id:31,name:'Melodia',className:'Druid',level:1},1:{id:32,name:'Ryland',className:'Ranger',level:1}}},'.tavern-header button,.tavern-actions button'],
 ['exchange',{mode:'hero-exchange',heroExchange:{heroes:[0,1].map(id=>({id,name:'Hero '+id,owned:true,slots:[],army:{slots:[],needsLastStack:true}}))}},'.exchange-toolbar button,.exchange-tabs button'],
 ['menu',{mode:'menu'},'.mobile-menu>button'],
 ['lobby',{mode:'lobby',maps:[],lobbyReady:true,selectedMap:'Goonks'},'.lobby-footer button']
];
for(const kind of ['chromium','webkit']){
 const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true,...(kind==='chromium'?{args:['--no-sandbox']}: {})});
 try{
  const page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
  await page.route('**/rail?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><link rel=stylesheet href=/web/marketplace.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){}};</script><script type=module src=/web/mobile.mjs></script>`}));
  await page.goto('http://localhost/rail?mobile=1');await page.waitForSelector('#mobile-app');
  await page.evaluate(()=>{const button=document.createElement('button');button.id='game-menu-toggle';button.textContent='☰';document.querySelector('.mobile-brand').replaceWith(button);});
  for(const [width,height] of [[844,390],[568,320],[1024,768],[1180,820]]){
   await page.setViewportSize({width,height});
   for(const [name,state,selector] of cases){
    await page.evaluate(state=>dispatchEvent(new CustomEvent('goonk-state',{detail:state})),{...base,...state});await page.waitForTimeout(100);
    // Clamp resolves through grid geometry rather than parsing the CSS expression.
    const left=await page.locator('#mobile-app').evaluate(e=>e.clientWidth-parseFloat(getComputedStyle(e).gridTemplateColumns.split(' ').at(-1)));
    let count=0;
    for(const b of await page.locator(selector).all())if(await b.isVisible()){
     count++;const r=await b.boundingBox();assert(r.x>=left-1&&r.y>=-1&&r.x+r.width<=width+1&&r.y+r.height<=height+1,name+' right controls '+JSON.stringify({width,height,left,r}));assert(r.width>=43&&r.height>=43,name+' touch target '+JSON.stringify(r));
    }
    assert(count>0,name+' exercised visible controls');
    if(['map','town','battle'].includes(name)){
     const canvas=await page.locator('#mobile-scene').boundingBox();assert(canvas.y<=1&&canvas.height>=height-1,name+' full-height game area '+JSON.stringify(canvas));
    }
    if(width===1024)await page.screenshot({path:'/tmp/landscape-'+kind+'-'+name+'.png'});
   }
  }
  assert.deepEqual(errors,[]);console.log('PASS',kind,cases.length,'screens, phone and iPad landscape, right controls and full-height scenes');
 }finally{await browser.close();}
}
