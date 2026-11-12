import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});const p=await browser.newPage({viewport:{width:390,height:740},hasTouch:true,bypassCSP:true});
p.setDefaultTimeout(10000);try{
 await silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/web/online-lobby.mjs');
 await p.setContent('<main id="root"><div class="mobile-play"></div></main>');
 await p.evaluate(async()=>{window.Module={_vcmiOnlineRoomAction(){}};window.commands=[];const {createOnlineLobby}=await import('/web/online-lobby.mjs');window.lobby=createOnlineLobby(document.querySelector('#root'),(...a)=>commands.push(a));window.state={mode:'online-lobby',onlinePage:'match',onlineHost:true,onlineRoomLimit:2,onlinePlayerCount:2,selectedMap:'Goonks',onlineScenarioFits:true,onlineScenarios:[],mapsLoading:true,onlineCheatsAllowed:false};lobby.update(state);});
 const checkbox=p.locator('[data-online-cheats]');await checkbox.waitFor();assert(!await checkbox.isChecked());await checkbox.check();assert.deepEqual(await p.evaluate(()=>commands.at(-1)),[97,1]);
 await p.evaluate(()=>lobby.update({...state,onlineCheatsAllowed:true}));assert(await checkbox.isChecked());await checkbox.uncheck();assert.deepEqual(await p.evaluate(()=>commands.at(-1)),[97,0]);
 await p.evaluate(()=>{commands=[];lobby.update({...state,onlineHost:false,onlineCheatsAllowed:true});});assert(await checkbox.isDisabled());assert(await checkbox.isChecked());await checkbox.dispatchEvent('change');assert.equal(await p.evaluate(()=>commands.length),0);
 await p.evaluate(async()=>{const source=await(await fetch('/web/online-lobby.mjs')).text();const path=source.match(/from '([^']*i18n[^']*)'/)[1];(await import(new URL(path,location.origin+'/web/online-lobby.mjs').href)).setLanguage('fr');lobby.update({...state,onlineHost:true});});assert(await p.getByText('Autoriser la triche',{exact:true}).isVisible());
 await p.evaluate(()=>lobby.update({...state,onlineLoading:true}));assert(await checkbox.isDisabled());console.log('PASS host checkbox, guest read-only setting, saved-game lock and French label');
}finally{await browser.close();}
