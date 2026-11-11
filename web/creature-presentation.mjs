import{hdCreaturePortrait,paintHDCreature}from'./goonk-hd-portraits.mjs';
import{createRecruitmentHall}from'./recruitment-families.mjs';
import{bindPress}from'./mobile-press.mjs';
import{creaturePortrait}from'./creature-portraits.mjs';
import{getLanguage}from'./i18n.mjs';
import{resourceDescriptors,resourceIconURL,compactResource}from'./resources.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function abilitySection(abilities, language){
 if(!abilities?.length)return '';
 const items=abilities.map(text=>'<li>'+esc(text).replace(/\{([^{}]+)\}/g,'<strong>$1</strong>')+'</li>').join('');
 const heading=language==='fr'?'Capacités spéciales':'Special abilities';
 return '<section class="creature-abilities"><h4>'+heading+'</h4><ul>'+items+'</ul></section>';
}
const stats=u=>`<dl class="creature-stats"><div><dt>Attack</dt><dd>${u.attack??0}</dd></div><div><dt>Defense</dt><dd>${u.defense??0}</dd></div><div><dt>Damage</dt><dd>${u.damageMin??0}–${u.damageMax??0}</dd></div><div><dt>Health</dt><dd>${u.health??0}</dd></div><div><dt>Speed</dt><dd>${u.speed??0}</dd></div>${Number.isInteger(u.experienceRank)?'<div><dt>Rank</dt><dd>'+u.experienceRank+'</dd></div>':''}</dl>`;
const prices=(u,amount=1,metadata=[])=>resourceDescriptors(u.cost||[],metadata).filter(r=>r.value>0).map(r=>{const url=resourceIconURL(r,window.goonkAssetURLs||[]);return `<span class="creature-price">${url?`<img src="${esc(url)}" alt="${esc(r.name)}">`:`<span>${esc(r.name)}</span>`}<span>${compactResource(r.value*amount)}</span></span>`;}).join('');
export function createCreaturePresentation({root,command,pointer,openRecruit,buildingArt,openBuildings}){
 const panel=document.createElement('section');panel.className='creature-presentation';panel.hidden=true;panel.setAttribute('aria-label','Creature overview');root.querySelector('.mobile-play').append(panel);
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const hall=createRecruitmentHall({panel,command,prices,stats,buildingArt,openBuildings});
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
  update(next){state=next;const active=['fort','recruit','creature'].includes(state.mode);panel.hidden=!active;root.dataset.creatureView=active?state.mode:'';if(!active){if(signature){hall.reset();choices.hidden=true;amount.hidden=true;root.querySelector('.mobile-play').append(choices,amount);for(const c of canvases){c.width=0;c.height=0;}canvases=[];panel.replaceChildren();signature='';}return;}
   const unit=state.mode==='creature'?state.creatureUnit:state.recruitUnit,rows=state.fortRows||[],upgrades=state.creatureUpgrades||[],key=JSON.stringify([state.mode,unit?.id,state.mode==='fort'?null:(state.previewUnits||[]).map(u=>u.id),state.mode==='fort'?null:rows.map(u=>[u.id,u.built]),unit?.count,unit?.experienceRank,unit?.shooter,unit?.abilities,getLanguage(),upgrades.map(u=>[u.id,u.cost,u.affordable])]);
   if(key!==signature){signature=key;root.querySelector('.mobile-play').append(choices,amount);const preserved=new Map(canvases.filter(c=>c.width&&c.height).map(c=>{const image=document.createElement('canvas');image.width=c.width;image.height=c.height;image.getContext('2d').drawImage(c,0,0);return [c.dataset.previewCreature,image];}));panel.innerHTML=`<header class="creature-view-head"><h2>${state.mode==='fort'?'Recruitment hall':esc(unit?.name||'Creature')}</h2>${state.mode==='fort'?'<button data-recruit-all>Recruit all</button>':state.mode==='recruit'&&unit?.description?'<button data-ui=creature-info>Info</button>':''}<button class="primary" data-presentation-close aria-label="${state.mode==='recruit'?'Close recruitment':'Back to previous screen'}">${state.mode==='recruit'?'✕':'← Back'}</button></header>`;
    if(state.mode==='fort'){
     // The family gallery owns its responsive roster and selection.

    }else{
     const details=state.mode==='creature';
     const facts=`<h3>${esc(unit?.name)}</h3>${unit?.shooter===true?'<p class="ranged-indicator"><strong>Attaque à distance</strong>'+(details?' · Peut tirer sans se déplacer.':'')+'</p>':''}${stats(unit||{})}`;
     const price='<div class="featured-price"></div>';
     const narrative=details?`<div class="creature-narrative">${unit?.description?`<p class="creature-description">${esc(unit.description)}</p>`:''}${abilitySection(unit?.abilities,getLanguage())}${price}</div>`:'';
     panel.insertAdjacentHTML('beforeend',`<div class="featured-creature"><div class="creature-stage"><canvas data-preview-creature="${unit?.id}" aria-label="Animated ${esc(unit?.name)}"></canvas></div><div class="creature-details">${details?`<div class="creature-facts">${facts}</div>${narrative}`:facts+price}</div></div>`);
     if(state.mode==='recruit'){const controls=document.createElement('section');controls.className='recruit-controls';controls.append(amount);panel.append(controls);const variants=document.createElement('div');variants.className='recruit-variants';variants.style.setProperty('--variant-count',String(state.previewUnits?.length||1));variants.innerHTML=(state.previewUnits||[]).map((u,i)=>`<button data-variant="${i}" aria-pressed="${u.id===unit?.id}">${esc(u.name)}${u.upgradeRank?`<small>${u.upgradeRank===1?'I · Base':u.upgradeRank===2?'II · Upgraded':u.upgradeRank===3?'III · Advanced':'IV · Ultimate'}</small>`:''}</button>`).join('');if(variants.childElementCount>1)controls.prepend(variants);}
     else if(upgrades.length)panel.insertAdjacentHTML('beforeend','<section class="creature-upgrades" aria-label="Creature upgrades"><h3>Upgrade this stack</h3><div class="upgrade-options" style="--upgrade-count:'+upgrades.length+'">'+upgrades.map(u=>`<article class="creature-upgrade"><div class="upgrade-creature">${creaturePortrait(u)}<strong>${esc(u.name)} × ${unit?.count??1}</strong></div><div class="upgrade-price"><span>Total cost</span>${prices(u,1,state.resourceTypes)}</div><button data-upgrade="${u.id}" aria-label="Upgrade to ${esc(u.name)}" ${!u.affordable?'disabled':''}>${u.affordable?'Upgrade':'Not enough resources'}</button></article>`).join('')+'</div></section>');
    }
    bindPress(panel.querySelector('[data-presentation-close]'),()=>command(state.mode==='recruit'?33:43));
    canvases=[...panel.querySelectorAll('[data-preview-creature]')];for(const c of canvases){const old=preserved.get(c.dataset.previewCreature);if(old){c.width=old.width;c.height=old.height;c.getContext('2d').drawImage(old,0,0);}}
   }
   if(state.mode==='fort'){panel.querySelector('[data-recruit-all]').disabled=!state.turn;hall.update(state);canvases=hall.canvases;iconsDirty=true;}
   else{const price=panel.querySelector('.featured-price');const html=state.mode==='recruit'?'<span>Cost per creature</span>'+prices(unit||{},1,state.resourceTypes):'<span>Creatures in stack: '+(unit?.count??1)+'</span>';if(price._sourceMarkup!==html){price._sourceMarkup=html;price.innerHTML=html;}}
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
