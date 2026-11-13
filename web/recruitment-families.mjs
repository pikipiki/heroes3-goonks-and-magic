import{plainGameText}from'./game-text.mjs';
import{bindPress}from'./mobile-press.mjs';
import{nextBuildingPrerequisite}from'./town-building-menu.mjs';
import{getLanguage}from'./i18n.mjs';
export function recruitmentFamilies(state){return state.fortFamilies?.length?state.fortFamilies:(state.fortRows||[]).map(row=>({level:row.level,count:row.count,variants:(state.recruits||[]).filter(u=>u.level===row.level).map((u,rank)=>({...u,rank,built:true})).concat([])})).map(f=>({...f,variants:f.variants.length?f.variants:[state.fortRows.find(u=>u.level===f.level)]}));}
export function recruitMaximum(unit,resources=[]){if(!unit?.built)return 0;let count=Math.max(0,Math.floor(unit.count||0));for(const[i,cost]of(unit.cost||[]).entries())if(cost>0)count=Math.min(count,Math.floor((resources[i]||0)/cost));return count;}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stableText=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
const rankName=n=>['I','II','III','IV','V','VI'][n]||String(n+1);
export function createRecruitmentHall({panel,command,prices,stats,buildingArt,openBuildings}){
 const unlockBuilding=unit=>(state.buildings||[]).find(building=>building.id===unit.requiredBuildingId);
 const resizeRows=()=>{const list=panel.querySelector('.hall-families');if(!list)return;const style=getComputedStyle(list),rows=matchMedia('(orientation:landscape)').matches?1:2,space=list.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);const height=Math.max(rows===2?132:148,Math.floor((space-(rows-1)*8)/rows))+'px';if(list.style.getPropertyValue('--hall-row-height')!==height)list.style.setProperty('--hall-row-height',height);};
 const rowObserver=new ResizeObserver(resizeRows);
 let lastTap=null;
 let state={},families=[],selectedId=null,amount=1,signature='',pending=null,savedScroll=null,previewTimer=null;
 // Remember the same point in the roster if rotation changes the row height.
 const rowStep=list=>(list.firstElementChild?.getBoundingClientRect().height||0)+(parseFloat(getComputedStyle(list).rowGap)||0);
 const readScroll=list=>list?{top:list.scrollTop,step:rowStep(list)}:null;
 const unit=()=>families.flatMap(f=>f.variants).find(u=>u.id===selectedId);
 const schedulePreview=u=>{
  clearTimeout(previewTimer);
  previewTimer=setTimeout(()=>{
   if(u&&selectedId===u.id)command(60,u.level,u.id);
  },320);
 };
 const select=(id,preview=true)=>{
  if(selectedId===id)return;
  selectedId=id;
  amount=1;
  if(preview){
   const u=unit();
   if(u)schedulePreview(u);
  }
  renderSelection();
 };
 const renderSelection=()=>{
  const u=unit();if(!u)return;
  const fr=getLanguage()==='fr';
  for(const b of panel.querySelectorAll('[data-family-select]')){const active=Number(b.dataset.familySelect)===selectedId;if(b.getAttribute('aria-pressed')!==String(active))b.setAttribute('aria-pressed',String(active));const canvas=b.querySelector('canvas');if(canvas.dataset.hallActive!==String(active))canvas.dataset.hallActive=String(active);}
  const slots=state.armies?.[0]?.slots,hasRoom=!slots?.length||slots.some(slot=>!slot||slot.id===u.id);
  const detail=panel.querySelector('.hall-detail'),maximum=recruitMaximum(u,state.resources);amount=Math.min(maximum,Math.max(1,amount));
  if(detail.dataset.unit!==String(u.id)){
   detail.dataset.unit=u.id;detail.innerHTML=`<div class="hall-feature"><div><div class="hall-feature-title"><h3>${esc(u.name)}</h3><span class="hall-unit-price"></span></div>${stats(u).replace(/<dt>(Attack|Defense|Damage|Health|Speed)<\/dt>/g,(_,name)=>'<dt aria-label="'+name+'">'+({Attack:'ATK',Defense:'DEF',Damage:'DMG',Health:'HP',Speed:'SPD'}[name])+'</dt>')}</div></div><p class="hall-stock" aria-live="polite"></p><div class="hall-quantity"><button data-hall-less aria-label="Decrease quantity">−</button><label class="hall-number"><input type="number" min="0" inputmode="numeric" aria-label="Recruit quantity"></label><button data-hall-more aria-label="Increase quantity">+</button><button data-hall-max>Max</button></div><div class="hall-total"></div><section class="hall-unlock-preview" hidden></section><div class="hall-actions"><button class="primary" data-hall-buy>Recruit</button><button class="primary" data-hall-build hidden>${fr?'Comment débloquer':'How to unlock'}<span aria-hidden="true"> ›</span></button><button data-type-info="${u.id}">Details</button></div>`;
   const press=(sel,fn)=>bindPress(detail.querySelector(sel),fn);
   press('[data-hall-less]',()=>{amount=Math.max(0,amount-1);renderSelection();});press('[data-hall-more]',()=>{amount=Math.min(recruitMaximum(unit(),state.resources),amount+1);renderSelection();});press('[data-hall-max]',()=>{amount=recruitMaximum(unit(),state.resources);renderSelection();});
   detail.querySelector('input').addEventListener('input',event=>{amount=Math.max(0,Math.min(recruitMaximum(unit(),state.resources),Math.floor(Number(event.target.value)||0)));renderSelection();});
   press('[data-hall-build]',()=>{const latest=unit(),building=unlockBuilding(latest);if(building&&!latest.built)openBuildings?.(building.id,latest.name,latest.id);});
   press('[data-hall-buy]',()=>{const latest=unit();if(pending||!latest||!state.turn||amount<1)return;clearTimeout(previewTimer);command(60,latest.level,latest.id);pending={id:latest.id,count:latest.count,armies:JSON.stringify(state.armies),started:Date.now()};renderSelection();command(61,latest.level,latest.id,amount);});
  }
  const building=unlockBuilding(u),canViewBuildings=!u.built&&building&&openBuildings;
  const price=detail.querySelector('.hall-unit-price'),priceMarkup=u.built?'':prices(u,1,state.resourceTypes);
  if(price._sourceMarkup!==priceMarkup){price._sourceMarkup=priceMarkup;price.innerHTML=priceMarkup;}
  detail.querySelector('[data-hall-build]').hidden=!canViewBuildings;
  detail.querySelector('[data-hall-buy]').hidden=!!canViewBuildings;
  const preview=detail.querySelector('.hall-unlock-preview');
  const prerequisite=canViewBuildings?nextBuildingPrerequisite(state,building):null;
  const next=canViewBuildings?(prerequisite||building):null;
  preview.hidden=!next;
  if(next){
   const artwork=buildingArt?.(state,next);
   const previewMarkup=`${artwork?`<img src="${esc(artwork)}" alt="">`:''}
    <div><span>${fr?(prerequisite?'Premier bâtiment nécessaire':'Bâtiment nécessaire'):(prerequisite?'First required building':'Required building')}</span>
    <strong>${esc(plainGameText(next.name))}</strong></div>`;
   if(preview._sourceMarkup!==previewMarkup){preview._sourceMarkup=previewMarkup;preview.innerHTML=previewMarkup;}
  }
  stableText(detail.querySelector('.hall-stock'),u.built
   ? (hasRoom?`${u.count} available · Shared stock`:'Garrison full · Move troops to your hero')
   : building?.state===2?(fr?'Ce scénario interdit ce logement dans cette ville.':'This scenario forbids this dwelling in this town.'):next?(fr?'🔒 Recrutement verrouillé':'🔒 Recruitment locked'):`Requires: ${plainGameText(u.requiredBuilding)||'Dwelling for this form'}`);
  detail.dataset.locked=String(!u.built);const input=detail.querySelector('input');input.max=maximum;if(document.activeElement!==input)input.value=amount;
  const total=detail.querySelector('.hall-total'),totalMarkup='<span>'+(amount?'Total':'Cost per creature')+'</span>'+(prices(u,amount||1,state.resourceTypes)||'<span>Free</span>');if(total._sourceMarkup!==totalMarkup){total._sourceMarkup=totalMarkup;total.innerHTML=totalMarkup;}
  const buy=detail.querySelector('[data-hall-buy]');stableText(buy,pending?'Recruiting…':!state.turn?(fr?'Disponible à ton tour':'Available on your turn'):!u.built?'Dwelling required':!u.count?'Sold out':!maximum?'Not enough resources':`Recruit ${amount}`);buy.disabled=!!pending||!state.turn||!maximum||!amount||!hasRoom;buy.toggleAttribute('aria-busy',!!pending);
  for(const sel of ['[data-hall-less]','[data-hall-more]','[data-hall-max]','input'])detail.querySelector(sel).disabled=!!pending||!maximum;
 };
 return{update(next){state=next;families=recruitmentFamilies(state);if(pending){const u=families.flatMap(f=>f.variants).find(u=>u.id===pending.id);if(u?.count!==pending.count||JSON.stringify(state.armies)!==pending.armies||Date.now()-pending.started>5000)pending=null;}
  const key=JSON.stringify(families.map(f=>[f.level,f.label,f.variants.map(u=>[u.id,u.built,u.name]) ]));
  let scroll;
  if(key!==signature||!panel.querySelector('.hall-layout')){signature=key;const old=panel.querySelector('.hall-layout');
   scroll=old?readScroll(old.querySelector('.hall-families')):savedScroll;
   if(!old)savedScroll=null;if(old){for(const canvas of old.querySelectorAll('canvas')){canvas.width=0;canvas.height=0;}old.remove();}panel.insertAdjacentHTML('beforeend','<div class="hall-layout"><div class="hall-families" aria-label="Creature evolution families">'+families.map(f=>`<section class="hall-family"><div class="hall-family-label"><h3>${f.label?esc(plainGameText(f.label)):`Tier ${f.level+1}`}</h3><span data-family-stock="${f.level}"></span></div><div class="hall-forms" style="--forms:${f.variants.length}">`+f.variants.map(u=>`<button class="hall-form" data-family-select="${u.id}" ${u.built?'':'data-locked'} aria-pressed="false" aria-label="${esc(u.name)}, form ${rankName(u.rank)}${u.built?', unlocked':', locked'}"><span class="hall-rank" aria-hidden="true">${rankName(u.rank)}</span><span class="hall-art"><canvas data-hall-icon="${u.id}" aria-hidden="true"></canvas></span><span class="hall-form-name">${esc(u.name)}</span><span class="hall-quick-info">${u.built?'<span class="hall-open-mark" aria-hidden="true">✓</span><span class="hall-form-price">'+prices(u,1,state.resourceTypes)+'</span>':'<span class="hall-lock-mark"><span aria-hidden="true">🔒</span> Locked</span>'}</span></button>`).join('')+'</div></section>').join('')+'</div><section class="hall-detail" aria-label="Selected creature recruitment"></section></div>');
   for(const b of panel.querySelectorAll('[data-family-select]')){bindPress(b,()=>{const id=Number(b.dataset.familySelect),time=performance.now();if(lastTap?.id===id&&time-lastTap.time<450&&selectedId===id){lastTap=null;savedScroll=readScroll(panel.querySelector('.hall-families'));clearTimeout(previewTimer);command(42,id);}else{lastTap={id,time};select(id);}});b.addEventListener('focus',()=>select(Number(b.dataset.familySelect)));}const list=panel.querySelector('.hall-families');list.addEventListener('scroll',()=>{if(panel.closest('#mobile-app')?.dataset.mode==='fort')savedScroll=readScroll(list);},{passive:true});rowObserver.disconnect();rowObserver.observe(list);
  }
  for(const f of families){const line=panel.querySelector(`[data-family-stock="${f.level}"]`);if(line&&line.textContent!==f.count+' available')line.textContent=f.count+' available';}
  if(!unit()){const first=families.find(f=>f.variants.some(u=>u.built))||families[0];const u=first?.variants.filter(u=>u.built).at(-1)||first?.variants[0];if(u)select(u.id);}
  else renderSelection();resizeRows();
  if(scroll){
   const list=panel.querySelector('.hall-families'),step=rowStep(list);
   list.scrollTop=scroll.step&&step?scroll.top*step/scroll.step:scroll.top;
  }
 },focusUnit(id){
  const button=panel.querySelector(`[data-family-select="${id}"]`);
  if(button){select(id);button.focus({preventScroll:true});}
 },rememberScroll(){const list=panel.querySelector('.hall-families');if(list)savedScroll=readScroll(list);},reset(){lastTap=null;clearTimeout(previewTimer);previewTimer=null;rowObserver.disconnect();signature='';pending=null;selectedId=null;savedScroll=null;},get canvases(){return[...panel.querySelectorAll('[data-hall-preview],[data-hall-icon]')];}};
}
