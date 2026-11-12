import {plainGameText} from './game-text.mjs';
const esc=value=>plainGameText(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Native callbacks and visibility rules remain authoritative for purchases and intelligence.
export function createTownServices({root,command}){
 const panel=document.createElement('section');panel.className='town-service';panel.hidden=true;root.querySelector('.mobile-play').append(panel);
 let state,key='',captureAt=0;
 panel.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;if(b.hasAttribute('data-service-buy'))command(1);else if(b.hasAttribute('data-service-back'))command(state.dialogKind==='thieves-guild'?1:0);});
 return{
  update(next){state=next;const kind=next.mode==='dialog'&&['blacksmith','thieves-guild'].includes(next.dialogKind)?next.dialogKind:'';panel.hidden=!kind;root.toggleAttribute('data-town-service',!!kind);if(!kind){key='';return;}
   const data=kind==='blacksmith'?next.blacksmith:next.thievesGuild,signature=JSON.stringify([kind,data]);if(signature===key)return;key=signature;panel.dataset.kind=kind;
   const head=title=>`<header><h2>${esc(title)}</h2><button type="button" data-service-back aria-label="Close">✕</button></header>`;
   if(kind==='blacksmith'){
    panel.innerHTML=`${head('Blacksmith')}<div class="service-art"><canvas width="640" height="480" aria-label="${esc(data?.unit?.name||'War machine')}"></canvas></div><section class="service-description"><h3>${esc(data?.unit?.name||'War machine')}</h3><p>Equip the visiting hero with a war machine.</p><div class="service-cost"><img src="./web/h3-theme/resource-gold.png" alt="Gold"><strong>${new Intl.NumberFormat('en-US').format(data?.cost||0)}</strong></div>${data?.canBuy?'':`<p role="status">${data?.alreadyOwned?'This hero already owns this war machine.':'A visiting hero, a free equipment slot and enough gold are required.'}</p>`}</section><footer><button type="button" class="primary" data-service-buy ${data?.canBuy?'':'disabled'}>Buy ${esc(data?.unit?.name||'war machine')}</button><button type="button" data-service-back>← Back</button></footer>`;
    captureAt=performance.now()+80;
   }else{
    const players=data?.players||[];
    panel.innerHTML=`${head('Thieves’ Guild')}<div class="guild-rankings"><table><caption>Kingdom rankings</caption><thead><tr><th scope="col">Category</th>${players.map(p=>`<th scope="col"><span class="kingdom-flag" data-color="${p.color}"></span>${esc(p.name)}</th>`).join('')}</tr></thead><tbody>${(data?.rows||[]).map(row=>`<tr><th scope="row">${esc(row.label)}</th>${players.map(p=>`<td>${row.ranks?.[p.color]?'<span class="guild-rank">'+row.ranks[p.color]+'</span>':'<span aria-label="Unknown">?</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><section class="guild-intelligence"><h3>Kingdom intelligence</h3>${players.map(p=>`<article><h4><span class="kingdom-flag" data-color="${p.color}"></span>${esc(p.name)}</h4><dl><dt>Best hero</dt><dd>${esc(p.hero||'Unknown')}</dd><dt>Strongest creature</dt><dd>${esc(p.creature||'Unknown')}</dd><dt>Personality</dt><dd>${esc(p.personality||'Unknown')}</dd></dl></article>`).join('')}</section><footer><button type="button" class="primary" data-service-back>← Back</button></footer>`;
   }
  },
  paint(source){if(panel.hidden)return false;if(state.dialogKind==='blacksmith'&&performance.now()>=captureAt){const c=panel.querySelector('canvas'),r=state.blacksmith?.preview;if(r?.w&&r.h){const ctx=c.getContext('2d');ctx.drawImage(source,r.x*source.width/800,r.y*source.height/600,r.w*source.width/800,r.h*source.height/600,0,0,c.width,c.height);}}return true;}
 };
}
