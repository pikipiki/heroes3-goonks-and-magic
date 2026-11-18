import {build} from 'esbuild';
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const root=process.env.HEROES_KIT_OUTPUT||'/tmp/heroes-design-system',base=process.env.HEROES_KIT_URL||'http://127.0.0.1:8942';
await build({entryPoints:['work/browser-tests/game-components-boundaries.jsx'],outfile:path.join(root,'fixture.js'),bundle:true,format:'esm',external:['/web/*'],define:{'process.env.NODE_ENV':'"production"'}});
fs.writeFileSync(path.join(root,'fixture.html'),'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="fixture.css"><div id="fixture"></div><script type="module" src="fixture.js"></script>');
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:320,height:568}});await silenceTestAudio(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/fixture.html');
  const choose=async id=>{await page.getByRole('combobox',{name:'Cas limite'}).click();await page.getByRole('option',{name:id,exact:true}).click();};
  for(const count of [1,2,3,4]){
   await choose('evolution-'+count);assert.equal(await page.locator('.gx-evolution-grid>button').count(),count);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(count===3){const width=await page.locator('.gx-evolution-grid').evaluate(root=>({grid:root.clientWidth,last:root.lastElementChild.getBoundingClientRect().width}));assert(Math.abs(width.grid-width.last)<2,'third card fills its row');}
  }
  await choose('form');assert(await page.getByRole('button',{name:'Confirmer'}).isDisabled());await page.getByRole('radio',{name:'Zéro',exact:true}).check();await page.getByRole('checkbox',{name:'A',exact:true}).check();await page.getByRole('checkbox',{name:'Accord requis'}).check();assert(await page.getByRole('checkbox',{name:'B',exact:true}).isDisabled());
  await page.getByRole('combobox',{name:'Sélection',exact:true}).click();await page.getByRole('option',{name:'Zéro',exact:true}).click();
  await page.getByRole('spinbutton',{name:'Quantité'}).fill('8');assert(await page.getByRole('button',{name:'Confirmer'}).isDisabled());await page.getByRole('spinbutton',{name:'Quantité'}).fill('3');await page.getByRole('button',{name:'Confirmer'}).click();const values=JSON.parse(await page.locator('[data-fixture-result]').getAttribute('data-fixture-result'));assert.equal(values.choice,0);assert.equal(values.select,0);assert.equal(values.quantity,3);assert.deepEqual(values.multiple,['a']);
  await choose('cycle');assert(await page.getByRole('alert').isVisible());
  await choose('video-error');await page.getByText('Impossible de lire ce média.').waitFor();assert.equal(await page.locator('video[controls]').count(),0);assert(await page.getByRole('button',{name:'Lire',exact:true}).isDisabled());
  await choose('empty-army');assert(await page.getByRole('button',{name:'Tout améliorer',exact:true}).isDisabled());assert.equal(await page.locator('.gx-army-grid button').count(),8);
  await choose('long-army');await page.waitForFunction(()=>[...document.querySelectorAll('.gx-army-grid .MuiTypography-caption')].every(node=>node.scrollWidth<=node.clientWidth+1));
  await choose('zero-resources');assert.equal(await page.locator('.hk-resource-strip img').count(),2);assert.equal(await page.locator('.hk-resource-strip').textContent(),'00');
  assert.deepEqual(errors,[]);console.log('PASS',name,'1–4 evolutions, typed required choices, numeric bounds, cycles, video error, empty army and zero resources');
 }finally{await browser.close();}
}
