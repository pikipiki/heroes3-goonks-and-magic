import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {gameComponentRegistry} from '../../src/ui/game-component-registry.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
const base=process.env.HEROES_KIT_URL||'http://127.0.0.1:8942';
fs.mkdirSync('/tmp/heroes-game-components',{recursive:true});
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage();await silenceTestAudio(page);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const open=async id=>{await page.goto(base+'/design-system.html?view=compositions&component='+id);await page.locator(`[data-example="${id}"] [data-game-component="${id}"]`).waitFor();};
  const language=async value=>{await page.getByRole('combobox',{name:/^(Langue|Language)$/}).click();await page.getByRole('option',{name:value==='fr'?'Français':'English',exact:true}).click();};
  const state=async value=>{await page.getByRole('combobox',{name:/^(État de revue|Review state)$/}).click();await page.getByRole('option',{name:value,exact:true}).click();};
  const lastEvent=()=>page.locator('[data-last-event]').getAttribute('data-last-event');
  for(const id of Object.keys(gameComponentRegistry)){
   await open(id);
   for(const lang of ['fr','en']){
    if(lang==='en')await language('en');
    for(const [width,height]of [[320,568],[360,640],[568,280],[640,360]]){
     await page.setViewportSize({width,height});
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} ${id} ${lang} ${width} horizontal overflow`);
     const rawControls=await page.locator('[data-example] button,[data-example] input,[data-example] select,[data-example] textarea').evaluateAll(nodes=>nodes.filter(node=>node.tagName==='BUTTON'?!node.closest('.MuiButtonBase-root'):!node.closest('[class*="Mui"]')).map(node=>node.outerHTML.slice(0,200)));
     assert.deepEqual(rawControls,[],id+' controls must be MUI');
     if(lang==='fr'&&width===320)await page.screenshot({path:`/tmp/heroes-game-components/${name}-${id}-portrait.png`,fullPage:true});
    }
   }
   await language('fr');await page.setViewportSize({width:320,height:568});
   for(const variant of ['Liste vide','Indisponible','Description longue']){
    await state(variant);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' '+id+' '+variant+' overflow');
   }
  }
  // User-facing contracts, not just rendering: preview before spell activation,
  // confirmations, required native choices, safe fallback and eight players.
  await open('spells');await page.getByRole('button',{name:/Boule de feu 12 mana/}).click();assert((await lastEvent()).includes('selected'));assert(!(await lastEvent()).includes('choose'));
  await page.getByRole('button',{name:/Choisir la cible/}).click();assert((await lastEvent()).includes('choose'));await page.getByRole('textbox',{name:'Rechercher un sort'}).fill('absent');assert(await page.getByRole('button',{name:/Choisir la cible/}).isDisabled());await page.getByRole('textbox',{name:'Rechercher un sort'}).fill('');
  await page.getByRole('checkbox',{name:'Choisir un sort en un clic'}).check();await page.getByRole('button',{name:/Boule de feu 12 mana/}).click();assert((await lastEvent()).includes('choose'));
  await state('Indisponible');await page.getByRole('button',{name:/Boule de feu 12 mana/}).click();assert((await lastEvent()).includes('selected'));assert(await page.getByRole('button',{name:/Choisir la cible/}).isDisabled());
  await open('army');await page.getByRole('button',{name:'Tout améliorer',exact:true}).click();assert.equal(await lastEvent(),'');await page.getByRole('dialog').getByRole('button',{name:'Confirmer',exact:true}).click();assert.equal(await lastEvent(),'upgrade-all');
  const armyGeometry=await page.locator('.gx-army-grid').evaluate(root=>{const cells=[...root.children],upgrade=cells[7].querySelector('button'),caption=cells[6].querySelector('.MuiTypography-caption');return {bottom:upgrade.getBoundingClientRect().bottom,captionTop:caption.getBoundingClientRect().top};});assert(armyGeometry.bottom<=armyGeometry.captionTop+1);
  await open('hire');assert.equal(await page.getByRole('tab',{name:'Compétences',exact:true}).getAttribute('aria-selected'),'true');await page.getByRole('tab',{name:'Grimoire',exact:true}).click();assert(await page.locator('[data-game-component="spells"]').isVisible());assert.equal(await page.getByRole('button',{name:/Choisir la cible/}).count(),0,'hiring preview is read only');
  await open('ranking');assert.equal(await page.locator('[data-game-component="ranking"] .MuiList-root').first().locator('.MuiListItem-root').count(),8);
  await open('dynamic');assert(await page.getByRole('button',{name:'Confirmer',exact:true}).isDisabled());await page.getByRole('radio',{name:'Or',exact:true}).check();assert(await page.getByRole('button',{name:'Confirmer',exact:true}).isEnabled());await page.getByRole('spinbutton',{name:'Quantité',exact:true}).fill('0');assert(await page.getByRole('button',{name:'Confirmer',exact:true}).isDisabled());
  await open('copy');await state('Indisponible');await page.getByRole('button',{name:'Copier le code',exact:true}).click();assert(await page.getByText(/Copie automatique indisponible/).isVisible());
  await open('save');await page.getByRole('button',{name:'Supprimer',exact:true}).click();assert.equal(await lastEvent(),'');await page.getByRole('dialog').getByRole('button',{name:'Retour',exact:true}).click();assert.equal(await lastEvent(),'');
  await open('consequences');assert(await page.getByRole('button',{name:'Confirmer',exact:true}).isDisabled());await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Confirmer',exact:true}).click();assert.equal(await lastEvent(),'consequences-confirmed');
  await open('calendar');await page.getByRole('button',{name:'Recrues disponibles',exact:true}).click();assert.equal(await lastEvent(),'recruits');await state('Indisponible');assert(await page.getByRole('button',{name:'Recrues disponibles',exact:true}).isDisabled());
  await open('search');await page.getByRole('textbox',{name:'Rechercher',exact:true}).fill('Goonk');await page.getByRole('button',{name:'Réinitialiser',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'Rechercher',exact:true}).inputValue(),'');
  await open('scenario');await page.locator('.MuiCardActionArea-root').click();assert.equal(await lastEvent(),'goonk');
  await open('players');await page.getByRole('combobox',{name:'Faction · Joueur 1',exact:true}).click();await page.getByRole('option',{name:'Goonk',exact:true}).click();assert((await lastEvent()).includes('goonk'));
  await open('inventory');await page.getByRole('button',{name:/Emplacement libre/}).click();assert((await lastEvent()).includes('slot-1'));
  await open('transfer');assert(await page.getByRole('button',{name:'Transférer',exact:true}).isDisabled());await page.getByRole('button',{name:'Picpique · 1',exact:true}).click();await page.getByRole('button',{name:'Libre · 1',exact:true}).click();await page.getByRole('checkbox',{name:'Scinder la troupe'}).check();await page.getByRole('button',{name:'Transférer',exact:true}).click();const transfer=JSON.parse(await lastEvent());assert.equal(transfer.route.from.side,'left');assert.equal(transfer.route.to.side,'right');assert.equal(transfer.split,true);
  await open('evolution-grid');await page.getByRole('button',{name:/III/}).click();assert((await lastEvent()).includes('picpiqueExalted'));
  await open('roster');const rosterGeometry=await page.locator('.gx-roster').evaluate(root=>{const panels=[...root.children],rect=root.getBoundingClientRect();return {first:panels[0].getBoundingClientRect().bottom,secondTop:panels[1].getBoundingClientRect().top,secondBottom:panels[1].getBoundingClientRect().bottom,bottom:rect.bottom};});assert(rosterGeometry.first<=rosterGeometry.secondTop);assert(rosterGeometry.secondBottom<=rosterGeometry.bottom+1,'two family rows visible');
  await open('building');await page.getByRole('button',{name:'Construire',exact:true}).click();assert.equal(await lastEvent(),'town-hall');
  await open('skills');await page.getByRole('button',{name:/Attaque Compétence/}).click();assert((await lastEvent()).includes('attack'));
  await open('upgrade');await page.getByRole('button',{name:'Tout améliorer',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Confirmer',exact:true}).click();assert.equal(await lastEvent(),'upgrade-confirmed');
  await open('trade');await page.getByRole('button',{name:'Échanger',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Échanger',exact:true}).click();assert.equal(JSON.parse(await lastEvent()).give,'gold');
  await open('battle-hud');await page.getByRole('button',{name:'Attendre',exact:true}).click();assert.equal(await lastEvent(),'wait');
  await open('result');assert(await page.getByText('−1',{exact:true}).isVisible());await page.getByRole('button',{name:'Confirmer',exact:true}).click();assert.equal(await lastEvent(),'result-confirmed');
  await open('storage');await page.getByRole('button',{name:'Télécharger',exact:true}).click();assert.equal(await lastEvent(),'download');
  await open('rules');await page.getByRole('checkbox').check();assert(await page.getByRole('checkbox').isChecked());
  await open('media');await state('Indisponible');await page.getByText('Impossible de lire ce média.').waitFor();
  assert.deepEqual(errors,[]);console.log('PASS',name,'27 MUI compositions, FR/EN, 4 viewports, empty/unavailable/long states and action contracts');
 }finally{await browser.close();}
}
