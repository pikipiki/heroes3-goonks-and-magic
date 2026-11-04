import{resourceDescriptors,resourceIconURL,compactResource}from'./resources.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stats=u=>`<dl class="creature-stats"><div><dt>Attack</dt><dd>${u.attack??0}</dd></div><div><dt>Defense</dt><dd>${u.defense??0}</dd></div><div><dt>Damage</dt><dd>${u.damageMin??0}–${u.damageMax??0}</dd></div><div><dt>Health</dt><dd>${u.health??0}</dd></div><div><dt>Speed</dt><dd>${u.speed??0}</dd></div></dl>`;
const prices=(u,amount=1,metadata=[])=>resourceDescriptors(u.cost||[],metadata).filter(r=>r.value>0).map(r=>{const url=resourceIconURL(r,window.goonkAssetURLs||[]);return `<span class="creature-price">${url?`<img src="${esc(url)}" alt="${esc(r.name)}">`:`<span>${esc(r.name)}</span>`}<span>${compactResource(r.value*amount)}</span></span>`;}).join('');
export function createCreaturePresentation({root,command,pointer,openRecruit,getRoster}){
 const panel=document.createElement('section');panel.className='creature-presentation';panel.hidden=true;panel.setAttribute('aria-label','Creature overview');root.querySelector('.mobile-play').append(panel);
 const choices=root.querySelector('.recruit-choices'),amount=root.querySelector('.mobile-recruit-amount');let signature='',state={},canvases=[];
 panel.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-recruit-all'))root.dispatchEvent(new CustomEvent('goonk-recruit-all'));
  if(b.dataset.recruit!==undefined)openRecruit(Number(b.dataset.recruit));
  if(b.dataset.typeInfo!==undefined)command(42,Number(b.dataset.typeInfo));
  if(b.dataset.unitArmy!==undefined)command(41,Number(b.dataset.unitArmy),Number(b.dataset.unitSlot));
  if(b.dataset.variant!==undefined){const u=state.previewUnits?.[Number(b.dataset.variant)];if(u?.preview)pointer({x:u.preview.x+u.preview.w/2,y:u.preview.y+u.preview.h/2},1);}
  if(b.dataset.presentationClose!==undefined)command(state.mode==='recruit'?33:43);
 });
 return{
  update(next){state=next;const active=['fort','recruit','creature'].includes(state.mode);panel.hidden=!active;root.dataset.creatureView=active?state.mode:'';if(!active){if(signature){choices.hidden=true;amount.hidden=true;root.querySelector('.mobile-play').append(choices,amount);for(const c of canvases){c.width=0;c.height=0;}canvases=[];panel.replaceChildren();signature='';}return;}
   const unit=state.mode==='creature'?state.creatureUnit:state.recruitUnit,rows=state.fortRows||[],roster=getRoster?.()||[],key=JSON.stringify([state.mode,unit?.id,(state.previewUnits||[]).map(u=>u.id),rows.map(u=>[u.id,u.built]),roster.map(a=>[a.id,a.slots?.map(u=>u?.id)])]);
   if(key!==signature){signature=key;root.querySelector('.mobile-play').append(choices,amount);for(const c of canvases){c.width=0;c.height=0;}panel.innerHTML=`<header class="creature-view-head"><h2>${state.mode==='fort'?'Recruitment hall':esc(unit?.name||'Creature')}</h2>${state.mode==='fort'?'<button data-recruit-all>Recruit all</button>':''}<button data-presentation-close aria-label="Close creature window">✕</button></header>`;
    if(state.mode==='fort'){
     panel.insertAdjacentHTML('beforeend','<div class="fort-roster">'+rows.map(u=>`<article class="fort-creature" data-fort-unit="${u.id}"><h3>${esc(u.name)}</h3><div class="fort-creature-art"><canvas data-preview-creature="${u.id}" aria-label="Animated ${esc(u.name)}"></canvas><div>${stats(u)}<p class="unit-available"></p></div></div><div class="fort-unit-price">${prices(u,1,state.resourceTypes)}</div><footer><button data-recruit="${u.level}" ${!u.built||!u.count||!state.turn?'disabled':''}>Recruit</button><button data-type-info="${u.id}">Details</button></footer></article>`).join('')+'</div>');
    }else{
     panel.insertAdjacentHTML('beforeend',`<div class="featured-creature"><div class="creature-stage"><canvas data-preview-creature="${unit?.id}" aria-label="Animated ${esc(unit?.name)}"></canvas></div><div class="creature-details"><h3>${esc(unit?.name)}</h3>${stats(unit||{})}<p class="creature-description">${esc(unit?.description||'')}</p><div class="featured-price"></div></div></div>`);
     if(state.mode==='recruit'){const controls=document.createElement('section');controls.className='recruit-controls';controls.append(choices,amount);panel.append(controls);const variants=document.createElement('div');variants.className='recruit-variants';variants.innerHTML=(state.previewUnits||[]).map((u,i)=>`<button data-variant="${i}" aria-pressed="${u.id===unit?.id}">${esc(u.name)}</button>`).join('');if(variants.childElementCount>1)controls.prepend(variants);}
     else if(roster.length){panel.insertAdjacentHTML('beforeend','<nav class="creature-roster" aria-label="Army creatures">'+roster.flatMap(a=>(a.slots||[]).map((u,i)=>u?`<button data-unit-army="${a.id}" data-unit-slot="${i}" aria-pressed="${u.id===unit?.id}">${esc(u.name)} × ${u.count}</button>`:'')).join('')+'</nav>');}
    }
    canvases=[...panel.querySelectorAll('[data-preview-creature]')];
   }
   if(state.mode==='fort')for(const u of rows){const card=panel.querySelector('[data-fort-unit="'+u.id+'"]');if(card){card.querySelector('.unit-available').textContent=u.built?u.count+' available':'Dwelling not built';card.querySelector('[data-recruit]').disabled=!u.built||!u.count||!state.turn;}}
   else{const price=panel.querySelector('.featured-price');const html=state.mode==='recruit'?'<span>Cost per creature</span>'+prices(unit||{},1,state.resourceTypes):'<span>Creatures in stack: '+(unit?.count??1)+'</span>';if(price._sourceMarkup!==html){price._sourceMarkup=html;price.innerHTML=html;}}
  },
  paint(source){if(panel.hidden)return false;const sx=source.width/800,sy=source.height/600;
   for(const canvas of canvases){const u=state.previewUnits?.find(u=>u.id===Number(canvas.dataset.previewCreature)),r=u?.preview;const box=canvas.getBoundingClientRect();if(box.bottom<0||box.top>innerHeight)continue;const scale=Math.min(devicePixelRatio||1,2),w=Math.round(box.width*scale),h=Math.round(box.height*scale);if(w<1||h<1)continue;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}const ctx=canvas.getContext('2d');ctx.fillStyle='#17130c';ctx.fillRect(0,0,w,h);if(r?.w){const z=Math.min(w/r.w,h/r.h),dw=r.w*z,dh=r.h*z;ctx.drawImage(source,r.x*sx,r.y*sy,r.w*sx,r.h*sy,(w-dw)/2,(h-dh)/2,dw,dh);}else{const index=window.goonkPortraitIds?.get(Number(canvas.dataset.previewCreature)),atlas=window.goonkPortraitAtlas;if(index!==undefined&&atlas){const size=Math.min(w,h);ctx.drawImage(atlas,index%8*96,Math.floor(index/8)*96,96,96,(w-size)/2,(h-size)/2,size,size);}}}
   return true;
  }
 };
}
