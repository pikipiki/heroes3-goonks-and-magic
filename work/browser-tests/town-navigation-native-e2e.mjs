import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {creatureTownFixture} from './creature-town-fixture.mjs';
import {silenceTestAudio} from './silent-audio.mjs';

const language=process.env.TEST_LANGUAGE||'fr',kind=process.env.TEST_BROWSER||'chromium';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8996';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-town-navigation-'+language+'-'+kind;
fs.mkdirSync(out,{recursive:true});
const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true});
const page=await browser.newPage({viewport:{width:360,height:740},hasTouch:true});
const errors=[],report=[];
await silenceTestAudio(page);
await page.addInitScript(language=>{
 localStorage.setItem('heroes-goonk.language',language);
 sessionStorage.setItem('heroes-goonk.storage-failed','true');
},language);
page.on('pageerror',error=>errors.push(error.message));
const wait=(fn,arg)=>page.waitForFunction(fn,arg,{timeout:120000});
const command=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
try{
 await page.goto(origin+'/game.html?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu'&&goonkSessionRecovery?.phase==='done');
 await page.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/003-Goonks-WoG.vmap',new Uint8Array(bytes)),[...creatureTownFixture]);
 await command(20,1);
 await wait(()=>goonkMobileState.lobbyReady&&goonkMobileState.maps?.some(map=>map.name==='000 - Creature abilities'));
 await command(24,await page.evaluate(()=>goonkMobileState.maps.find(map=>map.name==='000 - Creature abilities').index));
 await wait(()=>goonkMobileState.selectedMap==='000 - Creature abilities');
 await command(22);
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.towns?.length===10);
 await page.evaluate(()=>{
  const native=Module._vcmiMobileCommand;
  window.townNavigationBackCount=0;
  Module._vcmiMobileCommand=function(...args){
   if(args[0]===0)window.townNavigationBackCount++;
   return native.apply(this,args);
  };
 });
 for(const [town,width,height]of [[9,316,740],[9,360,740],[9,716,320],[8,430,873],[8,873,430]]){
  await page.setViewportSize({width,height});
  await command(5,town);
  await wait(()=>goonkMobileState.mode==='town');
  await page.waitForTimeout(350);
  const buttons=await page.locator('.mobile-nav').evaluate(nav=>[...nav.children]
   .filter(node=>node.tagName==='BUTTON'&&!node.hidden&&node.getClientRects().length)
   .map(node=>({action:node.dataset.ui||(node.classList.contains('ui-overflow-trigger')?'more':null),
    label:node.textContent,rect:node.getBoundingClientRect().toJSON(),mui:node.classList.contains('MuiButton-root')})));
  assert.deepEqual(buttons.map(button=>button.action),['build','back','more']);
  assert(buttons.every(button=>button.mui));
  assert(buttons.every(button=>button.rect.height>=48));
  assert(Math.max(...buttons.map(button=>button.rect.height))-Math.min(...buttons.map(button=>button.rect.height))<=1);
  assert(buttons.every(button=>button.rect.x>=0&&button.rect.y>=0&&button.rect.right<=width+1&&button.rect.bottom<=height+1));
  assert.equal(buttons[1].label,language==='fr'?'Retour':'Back');
  await page.screenshot({path:out+'/town-'+town+'-'+width+'x'+height+'.png'});
  await page.evaluate(()=>{window.townNavigationBackCount=0;});
  await page.locator('.mobile-nav>[data-ui=back]').tap();
  await wait(()=>goonkMobileState.mode==='map');
  assert.equal(await page.evaluate(()=>window.townNavigationBackCount),1,'A touch exits the town exactly once');
  report.push({town,width,height,buttons,nativeBackCount:1});
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/report.json',JSON.stringify({passed:true,language,kind,report,errors},null,2));
 console.log('PASS town navigation: primary, Back, More; equal height; one native exit; both orientations');
}finally{await browser.close();}
