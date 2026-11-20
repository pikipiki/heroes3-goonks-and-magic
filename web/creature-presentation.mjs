import {useScreenComponents,renderMarkup,createUIElement,useCreatureOverview} from './ui/material-components.mjs';
import{hdCreaturePortrait,paintHDCreature}from'./goonk-hd-portraits.mjs';
import{createRecruitmentHall}from'./recruitment-families.mjs';
import{bindPress}from'./mobile-press.mjs';
import{creaturePortrait}from'./creature-portraits.mjs';
import{getLanguage}from'./locale-state.mjs';
import{resourceDescriptors,resourceIconURL,compactResource}from'./resources.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function abilitySection(abilities, language){
 if(!abilities?.length)return '<p class="creature-no-abilities">'+(language==='fr'?'Aucune capacité spéciale.':'No special abilities.')+'</p>';
 const items=abilities.map(text=>'<li>'+esc(text).replace(/\{([^{}]+)\}/g,'<strong>$1</strong>')+'</li>').join('');
 const heading=language==='fr'?'Capacités spéciales':'Special abilities';
 return '<section class="creature-abilities"><h4>'+heading+'</h4><ul>'+items+'</ul></section>';
}
function creatureNarrative(unit,language){
 const fr=language==='fr',flags=unit?.nativeFlags||{},parts=[];
 if(typeof flags.flying==='boolean')parts.push(flags.flying?(fr?'Cette créature peut voler.':'This creature can fly.'):(fr?'Cette créature se déplace au sol.':'This creature moves on the ground.'));
 if(typeof unit?.shooter==='boolean')parts.push(unit.shooter?(fr?'Elle peut attaquer à distance.':'It can attack at range.'):(fr?'Elle attaque au corps à corps.':'It attacks in melee.'));
 if(flags.undead)parts.push(fr?'Créature mort-vivante.':'Undead creature.');
 if(flags.nonLiving)parts.push(fr?'Créature non vivante.':'Non-living creature.');
 if(unit?.description)return '<p class="creature-description">'+esc(unit.description)+'</p>';
 return '<p class="creature-description">'+esc(parts.join(' ')||(fr?'Les caractéristiques ci-dessus décrivent cette créature.':'The attributes above describe this creature.'))+'</p>';
}
const compactStatLabel=(label,short)=>`<span class="ui-stat-full">${label}</span><abbr class="ui-stat-short" title="${label}">${short}</abbr>`;
const stats=u=>`<dl class="creature-stats"><div><dt>${compactStatLabel(getLanguage()==='fr'?'Attaque':'Attack',getLanguage()==='fr'?'ATQ':'ATK')}</dt><dd>${u.attack??0}</dd></div><div><dt>${compactStatLabel(getLanguage()==='fr'?'Défense':'Defense',getLanguage()==='fr'?'DÉF':'DEF')}</dt><dd>${u.defense??0}</dd></div><div><dt>${compactStatLabel(getLanguage()==='fr'?'Dégâts':'Damage',getLanguage()==='fr'?'DGT':'DMG')}</dt><dd>${u.damageMin??0}–${u.damageMax??0}</dd></div><div><dt><span class="ui-stat-full">${getLanguage()==='fr'?'Points de vie':'Health'}</span><abbr class="ui-stat-short" title="${getLanguage()==='fr'?'Points de vie':'Health'}">${getLanguage()==='fr'?'PV':'HP'}</abbr></dt><dd>${u.health??0}</dd></div><div><dt>${compactStatLabel(getLanguage()==='fr'?'Vitesse':'Speed',getLanguage()==='fr'?'VIT':'SPD')}</dt><dd>${u.speed??0}</dd></div>${Number.isInteger(u.experienceRank)?'<div><dt>'+(getLanguage()==='fr'?'Rang':'Rank')+'</dt><dd>'+u.experienceRank+'</dd></div>':''}${u.inCombat?`<div><dt>${getLanguage()==='fr'?'PV actuels':'Current HP'}</dt><dd>${u.currentHealth??u.health}/${u.health}</dd></div>${u.shooter?`<div><dt>${getLanguage()==='fr'?'Tirs restants':'Shots left'}</dt><dd>${u.remainingShots??0}</dd></div>`:''}<div><dt>${getLanguage()==='fr'?'Ripostes':'Retaliations'}</dt><dd>${u.remainingRetaliations??0}</dd></div>`:''}</dl>`;
const prices=(u,amount=1,metadata=[])=>resourceDescriptors(u.cost||[],metadata).filter(r=>r.value>0).map(r=>{const url=resourceIconURL(r,window.goonkAssetURLs||[]);return `<span class="creature-price">${url?`<img src="${esc(url)}" alt="${esc(r.name)}">`:`<span>${esc(r.name)}</span>`}<span>${r.key==='gold'?new Intl.NumberFormat('fr-FR').format(r.value*amount).replace(/[\u00a0\u202f]/g,' '):compactResource(r.value*amount)}</span></span>`;}).join('');
export function createCreaturePresentation({root,command,pointer,openRecruit,buildingArt,openBuildings}){
 const panel=createUIElement('section');panel.classList.add('creature-presentation');useScreenComponents(panel);panel.hidden=true;panel.setAttribute('aria-label','Creature overview');root.querySelector('.mobile-play').append(panel);
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const hall=createRecruitmentHall({panel,command,prices,stats,buildingArt,openBuildings});
 const markup=(node,html)=>{if(node&&node._recruitMarkup!==html){node._recruitMarkup=html;renderMarkup(node,html);}};
 const navigation=root.querySelector('.mobile-nav');
 const choices=root.querySelector('.recruit-choices'),amount=root.querySelector('.mobile-recruit-amount');let signature='',state={},canvases=[],iconsDirty=true;
 panel.addEventListener('scroll',()=>{iconsDirty=true;},{capture:true,passive:true});
 window.addEventListener('resize',()=>{iconsDirty=true;},{passive:true});
 for(const event of ['pointerup','click','focusin'])panel.addEventListener(event,()=>{iconsDirty=true;},{capture:true,passive:true});
 panel.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-recruit-all'))root.dispatchEvent(new CustomEvent('goonk-recruit-all'));
  if(b.dataset.recruit!==undefined)openRecruit(Number(b.dataset.recruit));
  if(b.dataset.typeInfo!==undefined){
   if(state.mode==='fort')hall.rememberScroll();
   command(42,Number(b.dataset.typeInfo));
  }
  if(b.dataset.upgrade!==undefined){b.disabled=true;b.setAttribute('aria-busy','true');command(59,Number(b.dataset.upgrade));}
  if(b.dataset.variant!==undefined){const u=state.previewUnits?.[Number(b.dataset.variant)];if(u?.preview)pointer({x:u.preview.x+u.preview.w/2,y:u.preview.y+u.preview.h/2},1);}
  if(b.dataset.presentationClose!==undefined)command(state.mode==='recruit'?33:43);
 });
 return{
  focusHallUnit:hall.focusUnit,
  update(next){state=next;const active=['fort','recruit','creature'].includes(state.mode);if(state.mode!=='recruit'&&navigation.parentElement===panel){navigation.classList.remove('ui-recruit-actions');root.append(navigation);}panel.hidden=!active;root.dataset.creatureView=active?state.mode:'';panel.classList.toggle('recruitment-view',state.mode==='recruit');useCreatureOverview(panel,{mode:state.mode});if(!active){if(signature){hall.reset();choices.hidden=true;amount.hidden=true;root.querySelector('.mobile-play').append(choices,amount);for(const c of canvases){c.width=0;c.height=0;}canvases=[];panel.replaceChildren();signature='';}return;}
   const unit=state.mode==='creature'?state.creatureUnit:state.recruitUnit,rows=state.fortRows||[],upgrades=state.creatureUpgrades||[],key=state.mode==='fort'?JSON.stringify(['fort',getLanguage()]):state.mode==='recruit'?JSON.stringify(['recruit',getLanguage(),(state.previewUnits?.length?state.previewUnits:[unit]).map(u=>[u?.id,u?.name,u?.upgradeRank])]):JSON.stringify([state.mode,unit?.id,state.mode==='fort'?null:(state.previewUnits||[]).map(u=>u.id),state.mode==='fort'?null:rows.map(u=>[u.id,u.built]),unit?.count,unit?.experienceRank,unit?.shooter,unit?.description,unit?.abilities,unit?.nativeFlags,getLanguage(),upgrades.map(u=>[u.id,u.cost,u.affordable])]);
   if(key!==signature){if(navigation.parentElement===panel)root.append(navigation);if(state.mode==='fort'&&panel.querySelector('.hall-layout'))hall.rememberScroll();signature=key;root.querySelector('.mobile-play').append(choices,amount);const preserved=new Map(canvases.filter(c=>c.width&&c.height).map(c=>{const image=document.createElement('canvas');image.width=c.width;image.height=c.height;image.getContext('2d').drawImage(c,0,0);return [c.dataset.previewCreature,image];}));renderMarkup(panel,`<header class="creature-view-head"><h2>${state.mode==='fort'?(getLanguage()==='fr'?'Salle de recrutement':'Recruitment hall'):esc(unit?.name||(getLanguage()==='fr'?'Créature':'Creature'))}</h2>${state.mode==='fort'?'<button class="primary" data-recruit-all>'+(getLanguage()==='fr'?'Tout recruter':'Recruit all')+'</button>':''}${state.mode==='recruit'?'':`<button class="primary" data-presentation-close aria-label="${state.mode==='recruit'?'Close recruitment':'Back to previous screen'}">← Back</button>`}</header>`);
    if(state.mode==='fort'){
     // The family gallery owns its responsive roster and selection.

    }else{
     const details=state.mode==='creature';
     const facts=`<h3>${esc(unit?.name)}</h3>${unit?.shooter===true?'<p class="ranged-indicator"><strong>Attaque à distance</strong>'+(details?' · Peut tirer sans se déplacer.':'')+'</p>':''}${stats(unit||{})}`;
     const price=details?'<article class="featured-price"></article>':`<div class="recruit-economy"><article class="recruit-stock"><span>${getLanguage()==='fr'?'Stock':'Available'}</span><strong>${unit?.count??0}</strong></article><article class="featured-price"></article></div>`;
     const narrative=details?`<div class="creature-narrative">${creatureNarrative(unit,getLanguage())}${abilitySection(unit?.abilities,getLanguage())}${unit?.inCombat&&unit.spellEffects?.length?`<section class="creature-abilities"><h4>${getLanguage()==='fr'?'Sorts actifs':'Active spells'}</h4><ul>${unit.spellEffects.map(effect=>`<li>${esc(effect.name)} · ${effect.turns<=0?(getLanguage()==='fr'?'permanent':'permanent'):effect.turns+' '+(getLanguage()==='fr'?'tours':'rounds')}</li>`).join('')}</ul></section>`:''}${price}</div>`:'';
     const featured=createUIElement('div');featured.classList.add('featured-creature');renderMarkup(featured,`<div class="creature-stage"><canvas data-preview-creature="${unit?.id}" aria-label="Animated ${esc(unit?.name)}"></canvas></div><div class="creature-details">${details?`<div class="creature-facts">${facts}</div>${narrative}`:`<div class="creature-facts">${facts}</div><div class="recruit-description">${typeof unit?.nativeFlags?.flying==='boolean'?'<div class="recruit-traits"><span>'+(unit.nativeFlags.flying?(getLanguage()==='fr'?'Volante':'Flying'):(getLanguage()==='fr'?'Au sol':'Ground'))+'</span>'+(unit.shooter?'<span>'+(getLanguage()==='fr'?'Tir à distance':'Ranged')+'</span>':'')+'</div>':''}${unit?.description?'<p>'+esc(unit.description)+'</p>':''}${abilitySection(unit?.abilities,getLanguage())}</div>`+price}</div>`);panel.append(featured);
     if(state.mode==='recruit'){
      const variants=createUIElement('div');variants.classList.add('recruit-variants');
      const choices=(state.previewUnits?.length?state.previewUnits:[unit]).map((u,index)=>({u,index}));
      if(choices.every(({u})=>u.upgradeRank))choices.sort((a,b)=>a.u.upgradeRank-b.u.upgradeRank);
      panel.dataset.variantCount=String(choices.length);variants.style.setProperty('--variant-count',String(choices.length));variants.style.setProperty('--variant-rows',String(Math.ceil(choices.length/2)));variants.hidden=choices.length<2;
      variants.setAttribute('role','group');variants.setAttribute('aria-label',getLanguage()==='fr'?'Créatures et évolutions':'Creatures and evolutions');
      renderMarkup(variants,choices.map(({u,index})=>`<button data-variant="${index}" aria-pressed="${u.id===unit?.id}">${creaturePortrait(u)}<span class="variant-name">${esc(u.name)}</span>${u.upgradeRank?`<small class="variant-rank">${['','I','II','III','IV','V','VI'][u.upgradeRank]||u.upgradeRank}</small>`:''}</button>`).join(''));
      const visual=createUIElement('div');visual.classList.add('recruit-visual');visual.append(panel.querySelector('.creature-stage'),variants);
      const controls=createUIElement('section');controls.classList.add('recruit-controls');controls.append(amount);
      const transaction=createUIElement('div');transaction.classList.add('recruit-transaction');transaction.append(panel.querySelector('.recruit-economy'),controls);
      const context=createUIElement('div');context.classList.add('recruit-context');context.append(panel.querySelector('.creature-view-head'),transaction.querySelector('.recruit-economy'));
      const sidebar=createUIElement('aside');sidebar.classList.add('recruitment-sidebar');sidebar.append(context,transaction);
      const details=panel.querySelector('.creature-details');featured.style.display='contents';panel.replaceChildren(featured,visual,details,sidebar);
     }
     else if(upgrades.length){const upgradePanel=createUIElement('section');upgradePanel.classList.add('creature-upgrades');upgradePanel.setAttribute('aria-label','Creature upgrades');renderMarkup(upgradePanel,'<h3>Upgrade this stack</h3><div class="upgrade-options" style="--upgrade-count:'+upgrades.length+'">'+upgrades.map(u=>`<article class="creature-upgrade"><div class="upgrade-creature">${creaturePortrait(u)}<strong>${esc(u.name)} × ${unit?.count??1}</strong></div><div class="upgrade-price"><span>Total cost</span>${prices(u,1,state.resourceTypes)}</div><button data-upgrade="${u.id}" aria-label="Upgrade to ${esc(u.name)}" ${!u.affordable?'disabled':''}>${u.affordable?'Upgrade':'Not enough resources'}</button></article>`).join('')+'</div>');panel.append(upgradePanel);}
    }
    if(state.mode==='creature')useCreatureOverview(panel,{mode:state.mode});
    const close=panel.querySelector('[data-presentation-close]');if(close)bindPress(close,()=>command(43));
    canvases=[...panel.querySelectorAll('[data-preview-creature]')];for(const c of canvases){const old=preserved.get(c.dataset.previewCreature);if(old){c.width=old.width;c.height=old.height;c.getContext('2d').drawImage(old,0,0);}}
   }
   if(state.mode==='recruit'){
    navigation.classList.add('ui-recruit-actions');if(navigation.parentElement!==panel)panel.append(navigation);useScreenComponents(panel);
    // Keep the animation, chooser, focus and quantity input mounted while a
    // native selection or description update arrives. Replacing the whole
    // panel clears its canvases for one frame and visibly flashes on mobile.
    const canvas=canvases[0];if(canvas&&canvas.dataset.previewCreature!==String(unit?.id)){canvas.dataset.previewCreature=String(unit?.id);canvas._previewVersion=null;canvas.setAttribute('aria-label','Animated '+(unit?.name||''));}
    const title=panel.querySelector('.creature-view-head h2'),name=unit?.name||'';if(title._recruitTitle!==name){title._recruitTitle=name;title.textContent=name;}
    markup(panel.querySelector('.creature-facts'),stats(unit||{}));
    const description=panel.querySelector('.recruit-description');
    const narrative=(typeof unit?.nativeFlags?.flying==='boolean'?'<div class="recruit-traits"><span>'+(unit.nativeFlags.flying?(getLanguage()==='fr'?'Volante':'Flying'):(getLanguage()==='fr'?'Au sol':'Ground'))+'</span>'+(unit.shooter?'<span>'+(getLanguage()==='fr'?'Tir à distance':'Ranged')+'</span>':'')+'</div>':'')+(unit?.description?'<p>'+esc(unit.description)+'</p>':'')+abilitySection(unit?.abilities,getLanguage());
    const changed=description.dataset.unit!==String(unit?.id);markup(description,narrative);if(changed){description.scrollTop=0;description.dataset.unit=String(unit?.id);}
    const stock=panel.querySelector('.recruit-stock strong'),count=String(unit?.count??0);if(stock.textContent!==count)stock.textContent=count;
    for(const button of panel.querySelectorAll('[data-variant]')){const selected=state.previewUnits?.[Number(button.dataset.variant)]?.id===unit?.id;const value=String(selected);if(button.getAttribute('aria-pressed')!==value)button.setAttribute('aria-pressed',value);}
   }
   if(state.mode==='fort'){panel.querySelector('[data-recruit-all]').disabled=!state.turn;hall.update(state);canvases=hall.canvases;iconsDirty=true;}
   else{const price=panel.querySelector('.featured-price');price.hidden=state.mode==='creature'&&!(unit?.count>0);const html=state.mode==='recruit'?'<span>'+(getLanguage()==='fr'?'Coût par créature':'Cost per creature')+'</span>'+prices(unit||{},1,state.resourceTypes):'<span class="creature-stack-label">'+(getLanguage()==='fr'?'Effectif de la troupe':'Stack size')+'</span><span class="creature-stack-count">× '+(unit?.count??1)+'</span>';if(price._sourceMarkup!==html){price._sourceMarkup=html;renderMarkup(price,html);}}
  },
  paint(source){if(panel.hidden)return false;if(document.hidden)return true;const isFort=state.mode==='fort';const sx=source.width/800,sy=source.height/600;
   const clip=isFort?panel.querySelector('.hall-families')?.getBoundingClientRect():null;let anyUnpainted=false;
   const allVariants=isFort?(state.fortFamilies||[]).flatMap(f=>f.variants||[]):[];
   for(const canvas of canvases){const id=Number(canvas.dataset.previewCreature??canvas.dataset.hallPreview??canvas.dataset.hallIcon),u=state.previewUnits?.findLast(u=>u.id===id),isIcon=canvas.dataset.hallIcon!==undefined,live=isIcon&&canvas.dataset.hallActive==='true'&&!reducedMotion.matches,r=isIcon&&!live?null:u?.preview;if(isIcon&&!live&&!iconsDirty&&canvas._hallPaint?.[1]===window.goonkPortraitVersion&&canvas._hallPaint?.[2]===window.goonkPortraitAtlas)continue;const box=canvas.getBoundingClientRect();if(box.bottom<0||box.top>innerHeight||clip&&(box.bottom<=clip.top||box.top>=clip.bottom||box.right<=clip.left||box.right>=clip.right))continue;const staticUnit=allVariants.find(u=>u.id===id)||u,hd=!r?.w?hdCreaturePortrait(staticUnit):null;const atlasRect=r?.w&&u?.previewAtlas?window.goonkCreaturePreviewRects?.get(u.previewKey??id):null;if(r?.w&&u?.previewAtlas&&!atlasRect)continue;const scale=Math.min(devicePixelRatio||1,hd?3:2),w=Math.round(box.width*scale),h=Math.round(box.height*scale);if(w<1||h<1)continue;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas._hallPaint=null;canvas._previewVersion=null;}const paintKey=[hd?.image,window.goonkPortraitVersion,window.goonkPortraitAtlas,id,w,h];if(isIcon&&!r?.w&&canvas._hallPaint?.every((v,i)=>v===paintKey[i]))continue;canvas._hallPaint=isIcon&&!r?.w&&(hd||window.goonkPortraitAtlas)?paintKey:null;if(isIcon&&!canvas._hallPaint&&!r?.w)anyUnpainted=true;if(atlasRect&&canvas._previewVersion===window.goonkCreaturePreviewVersion)continue;canvas._previewVersion=atlasRect?window.goonkCreaturePreviewVersion:null;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);if(canvas.dataset.hallIcon===undefined){ctx.fillStyle='#17130c';ctx.fillRect(0,0,w,h);}if(r?.w){const z=Math.min(w/r.w,h/r.h),dw=r.w*z,dh=r.h*z;ctx.drawImage(atlasRect?window.goonkCreaturePreviewAtlas:source,atlasRect?.x??r.x*sx,atlasRect?.y??r.y*sy,atlasRect?.w??r.w*sx,atlasRect?.h??r.h*sy,(w-dw)/2,(h-dh)/2,dw,dh);}else if(hd){paintHDCreature(ctx,hd,w,h);}else{const index=window.goonkPortraitIds?.get(id),atlas=window.goonkPortraitAtlas;if(index!==undefined&&atlas){const size=Math.min(w,h);ctx.drawImage(atlas,index%8*96,Math.floor(index/8)*96,96,96,(w-size)/2,(h-size)/2,size,size);}}}
   if(isFort&&!anyUnpainted)iconsDirty=false;
   return true;
  }
 };
}
