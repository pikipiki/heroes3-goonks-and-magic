import {execFileSync} from 'node:child_process';
const baseline=process.env.UI_COMPARE_BASELINE==='1',baselineRef=process.env.UI_COMPARE_REF||'7e7633ea31754d40959fa16eceb2ac69b747164f';
import {chromium,webkit} from 'playwright-core';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
for(const [kind,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const p=await browser.newPage({viewport:{width:390,height:740},hasTouch:true}),errors=[];p.on('pageerror',error=>errors.push(error.message));
  await p.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);if(baseline&&/\.(mjs|css)$/.test(file)&&!file.includes('/web/ui/')){try{return route.fulfill({body:execFileSync('git',['show',baselineRef+':'+path.relative(process.cwd(),file)],{stdio:'pipe'}),contentType:file.endsWith('.mjs')?'text/javascript':'text/css'});}catch{}}return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await p.route('**/screens-test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html class="goonk-mobile"><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">${['mobile','game-menu','h3-theme','mobile-upgrade','marketplace','online-login','online-lobby','mobile-review','mobile-refinement','mobile-followup','mobile-compact','recruitment-view'].map(name=>'<link rel=stylesheet href=/web/'+name+'.css>').join('')}<style>html,body{margin:0}#mobile-viewport{position:fixed;inset:0;container:goonk-viewport/size}#mobile-app{display:block!important;position:absolute;inset:0;--control-rail:200px}#mobile-app>.mobile-play{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}</style><div id=mobile-viewport><div id=mobile-app><main class=mobile-play></main></div></div><script type=module>
  import {createHeroEquipment} from '/web/hero-equipment.mjs';import {createMageGuild} from '/web/mage-guild.mjs';import {createMobileTavern} from '/web/mobile-tavern.mjs';import {createBattleResult} from '/web/battle-result.mjs';import {createOnlineLogin} from '/web/online-login.mjs';import{createCampaignSetup}from'/web/campaign-setup.mjs';import{setLanguage}from'/web/i18n.mjs';import{refreshScreenComponents}from'/web/ui/components.mjs';
  const root=document.querySelector('#mobile-app'),command=(...args)=>calls.push(args);window.calls=[];window.controllers={hero:createHeroEquipment({root,command}),guild:createMageGuild({root,command,pointer(){},resetView(){},asset(){}}),tavern:createMobileTavern({root,command,pointer(){}}),result:createBattleResult({root,command}),login:createOnlineLogin(root,command),campaign:createCampaignSetup({root,command})};window.show=(name,state,language)=>{for(const controller of Object.values(controllers))controller.update({mode:'map'});setLanguage(language);root.dataset.mode=state.mode;controllers[name].update(state);${baseline?'':'refreshScreenComponents();'}};window.ready=true;</script>`}));
  await p.goto('http://localhost/screens-test');await p.waitForFunction(()=>window.ready);
  const cases=[
   ['hero',{mode:'hero',turn:true,heroWindow:{id:1,name:'Sylvia',owned:true,level:1,className:'Knight',mana:10,manaLimit:10,commanderIcon:0,primarySkills:[2,2,1,1],slots:Array.from({length:19},(_,slot)=>({slot}))}},'.hero-equipment-page'],
   ['guild',{mode:'mage-guild',mageGuild:{town:2,levels:5,built:1,spells:[{id:15,name:'Magic Arrow',level:1,description:'A long magical description. '.repeat(20)}]}},'.mobile-mage-guild'],
   ['tavern',{mode:'dialog',dialogKind:'tavern',turn:true,tavern:{cost:2500,canRecruit:true,thievesGuild:true,invite:true,rumor:'A rumor from the barkeep.'},tavernHeroes:{0:{id:31,name:'Melodia',className:'Druid',level:1},1:{id:32,name:'Ryland',className:'Ranger',level:1}}},'.mobile-tavern'],
   ['result',{mode:'dialog',dialogKind:'battle-result',battleResult:{won:true,description:'A glorious victory!',sides:[{name:'Sylvia',winner:true,losses:[{id:0,name:'Pikeman',count:1}]},{name:'Enemy',winner:false,losses:[]}]}},'.battle-result'],
   ['login',{mode:'online-login',onlineHasAccount:false},'.online-login'],
   ['campaign',{mode:'campaign-scenario',campaignScenario:{name:'Long Live the Queen',selected:0,bonus:0,difficulty:1,chooseDifficulty:true,canStart:true,scenarioName:'Homecoming',scenarioDescription:'Campaign description. '.repeat(30),scenarios:[{id:0,name:'Homecoming',available:true}],bonuses:[{id:0,description:'14 Pikemen'}]}},'.campaign-setup']
  ];
  for(const language of ['fr','en'])for(const viewport of [{width:360,height:659},{width:716,height:279}]){
   await p.setViewportSize(viewport);
   for(const [name,state,selector]of cases){
    await p.evaluate(({name,state,language})=>show(name,state,language),{name,state,language});await p.locator(selector).waitFor({state:'visible'});
    if(baseline){await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:'/tmp/ui-before-'+kind+'-'+name+'-'+language+'-'+viewport.width+'.png'});continue;}
    const panel=p.locator(selector),header=panel.locator('.ui-screen-header').first();assert(await header.isVisible(),name+' shared header');assert.equal(await header.locator('h1,h2').first().evaluate(node=>getComputedStyle(node).fontSize),viewport.width>viewport.height?'18px':'20px','Titles follow the shared type scale');
    assert.equal(await header.locator('button').filter({hasText:/^(?:←\s*)?(?:Back|Retour)$/}).count(),0,'No return button in '+name+' header');
    for(const button of await panel.locator('.ui-screen-header button,.ui-action-dock>button').all())if(await button.isVisible()){
     assert.equal(await button.evaluate(node=>getComputedStyle(node).borderRadius),'0px','Buttons keep square corners');assert(!await button.evaluate(node=>getComputedStyle(node).transitionProperty.split(',').some(value=>value.trim()==='all')),'Layout changes never animate');
     const box=await button.boundingBox();assert(box&&box.width>=48&&box.height>=48&&box.x>=-1&&box.y>=-1&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1,JSON.stringify({kind,language,viewport,name,box,button:await button.evaluate(n=>({html:n.outerHTML,parent:n.parentElement.className,min:getComputedStyle(n).minWidth,matches:n.matches('#mobile-viewport #mobile-app .hero-bag-tabs.ui-compact-navigation>[data-hero-commander]')}))}));
    }
    assert.equal(await p.locator('[data-ui-screen][hidden]').evaluateAll(nodes=>nodes.filter(node=>getComputedStyle(node).display!=='none').length),0,'Hidden screens never intercept touches');
    await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:'/tmp/ui-after-'+kind+'-'+name+'-'+language+'-'+viewport.width+'.png'});
    if(name==='hero'){if(viewport.width>viewport.height){await panel.locator('.ui-compact-navigation .ui-overflow-trigger').tap();await panel.locator('[data-hero-tab=backpack]').tap();assert(await panel.locator('.ui-compact-navigation .ui-overflow-trigger').innerText().then(text=>/Backpack|Sac/.test(text)));await panel.locator('.ui-compact-navigation .ui-overflow-trigger').tap();await panel.locator('[data-hero-tab=worn]').tap();}
    await p.evaluate(state=>controllers.hero.update({...state,heroWindow:{...state.heroWindow,picked:{name:'Amulet',icon:1}}}),state);await p.waitForFunction(()=>document.querySelector('[data-hero-commander]').disabled);assert(await panel.locator('[data-hero-tab=army]').isDisabled());}

   }
  }
  assert.deepEqual(errors,[]);console.log('PASS',baseline?'before':'after',kind,'six real screen factories, FR/EN, portrait and short landscape, visible commands, dynamic equipment state and hidden-screen safety');
 }finally{await browser.close();}
}
