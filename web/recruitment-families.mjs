import{bindPress}from'./mobile-press.mjs';
export function recruitmentFamilies(state){return state.fortFamilies?.length?state.fortFamilies:(state.fortRows||[]).map(row=>({level:row.level,count:row.count,variants:(state.recruits||[]).filter(u=>u.level===row.level).map((u,rank)=>({...u,rank,built:true})).concat([])})).map(f=>({...f,variants:f.variants.length?f.variants:[state.fortRows.find(u=>u.level===f.level)]}));}
export function recruitMaximum(unit,resources=[]){if(!unit?.built)return 0;let count=Math.max(0,Math.floor(unit.count||0));for(const[i,cost]of(unit.cost||[]).entries())if(cost>0)count=Math.min(count,Math.floor((resources[i]||0)/cost));return count;}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rankName=n=>['I','II','III','IV','V','VI'][n]||String(n+1);
export function createRecruitmentHall({panel,command,prices,stats}){
 let state={},families=[],selectedId=null,amount=1,signature='',pending=null;
 const unit=()=>families.flatMap(f=>f.variants).find(u=>u.id===selectedId);
 const select=(id,preview=true)=>{selectedId=id;amount=1;if(preview){const u=unit();if(u)command(60,u.level,u.id);}renderSelection();};
 const renderSelection=()=>{
  const u=unit();if(!u)return;
  for(const b of panel.querySelectorAll('[data-family-select]'))b.setAttribute('aria-pressed',String(Number(b.dataset.familySelect)===selectedId));
  const slots=state.armies?.[0]?.slots,hasRoom=!slots?.length||slots.some(slot=>!slot||slot.id===u.id);
  const detail=panel.querySelector('.hall-detail'),maximum=recruitMaximum(u,state.resources);amount=Math.min(maximum,Math.max(1,amount));
  if(detail.dataset.unit!==String(u.id)){
   detail.dataset.unit=u.id;detail.innerHTML=`<div class="hall-feature"><canvas data-hall-preview="${u.id}" aria-label="Animated ${esc(u.name)}"></canvas><div><h3>${esc(u.name)}</h3>${stats(u).replace(/<dt>(Attack|Defense|Damage|Health|Speed)<\/dt>/g,(_,name)=>'<dt aria-label="'+name+'">'+({Attack:'ATK',Defense:'DEF',Damage:'DMG',Health:'HP',Speed:'SPD'}[name])+'</dt>')}</div></div><p class="hall-stock" aria-live="polite"></p><div class="hall-quantity"><button data-hall-less aria-label="Decrease quantity">−</button><label class="hall-number"><input type="number" min="0" inputmode="numeric" aria-label="Recruit quantity"></label><button data-hall-more aria-label="Increase quantity">+</button><button data-hall-max>Max</button></div><div class="hall-total"></div><div class="hall-actions"><button class="primary" data-hall-buy>Recruit</button><button data-type-info="${u.id}">Details</button></div>`;
   const press=(sel,fn)=>bindPress(detail.querySelector(sel),fn);
   press('[data-hall-less]',()=>{amount=Math.max(0,amount-1);renderSelection();});press('[data-hall-more]',()=>{amount=Math.min(recruitMaximum(unit(),state.resources),amount+1);renderSelection();});press('[data-hall-max]',()=>{amount=recruitMaximum(unit(),state.resources);renderSelection();});
   detail.querySelector('input').addEventListener('input',event=>{amount=Math.max(0,Math.min(recruitMaximum(unit(),state.resources),Math.floor(Number(event.target.value)||0)));renderSelection();});
   press('[data-hall-buy]',()=>{const latest=unit();if(pending||!latest||!state.turn||amount<1)return;pending={id:latest.id,count:latest.count,armies:JSON.stringify(state.armies),started:Date.now()};renderSelection();command(61,latest.level,latest.id,amount);});
  }
  detail.querySelector('.hall-stock').textContent=u.built?(hasRoom?`${u.count} available · Shared stock`:'Garrison full · Move troops to your hero'):`Requires: ${u.requiredBuilding||'Dwelling for this form'}`;
  detail.dataset.locked=String(!u.built);const input=detail.querySelector('input');input.max=maximum;if(document.activeElement!==input)input.value=amount;
  detail.querySelector('.hall-total').innerHTML='<span>'+(amount?'Total':'Cost per creature')+'</span>'+(prices(u,amount||1,state.resourceTypes)||'<span>Free</span>');
  const buy=detail.querySelector('[data-hall-buy]');buy.textContent=pending?'Recruiting…':!u.built?'Dwelling required':!u.count?'Sold out':!maximum?'Not enough resources':`Recruit ${amount}`;buy.disabled=!!pending||!state.turn||!maximum||!amount||!hasRoom;buy.toggleAttribute('aria-busy',!!pending);
  for(const sel of ['[data-hall-less]','[data-hall-more]','[data-hall-max]','input'])detail.querySelector(sel).disabled=!!pending||!maximum;
 };
 return{update(next){state=next;families=recruitmentFamilies(state);if(pending){const u=families.flatMap(f=>f.variants).find(u=>u.id===pending.id);if(u?.count!==pending.count||JSON.stringify(state.armies)!==pending.armies||Date.now()-pending.started>5000)pending=null;}
  const key=JSON.stringify(families.map(f=>[f.level,f.variants.map(u=>[u.id,u.built,u.name]) ]));
  if(key!==signature||!panel.querySelector('.hall-layout')){signature=key;const old=panel.querySelector('.hall-layout'),scroll=old?.querySelector('.hall-families')?.scrollTop||0;if(old){for(const canvas of old.querySelectorAll('canvas')){canvas.width=0;canvas.height=0;}old.remove();}panel.insertAdjacentHTML('beforeend','<div class="hall-layout"><div class="hall-families" aria-label="Creature evolution families">'+families.map(f=>`<section class="hall-family"><div class="hall-family-label"><h3>Tier ${f.level+1}</h3><span data-family-stock="${f.level}"></span></div><div class="hall-forms" style="--forms:${f.variants.length}">`+f.variants.map(u=>`<button class="hall-form" data-family-select="${u.id}" aria-pressed="false" aria-label="${esc(u.name)}, form ${rankName(u.rank)}${u.built?'':', dwelling required'}"><span class="hall-rank">${rankName(u.rank)}${u.built?'':' · 🔒'}</span><canvas data-hall-icon="${u.id}" aria-hidden="true"></canvas><span class="hall-form-name">${esc(u.name)}</span><span class="hall-form-price">${prices(u,1,state.resourceTypes)}</span></button>`).join('')+'</div></section>').join('')+'</div><section class="hall-detail" aria-label="Selected creature recruitment"></section></div>');
   for(const b of panel.querySelectorAll('[data-family-select]'))bindPress(b,()=>select(Number(b.dataset.familySelect)));panel.querySelector('.hall-families').scrollTop=scroll;
  }
  for(const f of families){const line=panel.querySelector(`[data-family-stock="${f.level}"]`);if(line)line.textContent=f.count+' available';}
  if(!unit()){const first=families.find(f=>f.variants.some(u=>u.built))||families[0];const u=first?.variants.filter(u=>u.built).at(-1)||first?.variants[0];if(u)select(u.id);}
  else renderSelection();
 },reset(){signature='';pending=null;selectedId=null;},get canvases(){return[...panel.querySelectorAll('[data-hall-preview],[data-hall-icon]')];}};
}
