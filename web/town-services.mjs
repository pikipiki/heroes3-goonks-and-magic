import {getLanguage} from './i18n.mjs';
import {plainGameText} from './game-text.mjs';
const esc=value=>plainGameText(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Native callbacks and visibility rules remain authoritative for purchases and intelligence.
export function createTownServices({root,command}){
 const panel=document.createElement('section');panel.className='town-service';panel.hidden=true;root.querySelector('.mobile-play').append(panel);
 let state,key='',captureAt=0;
 panel.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;if(b.hasAttribute('data-service-buy'))command(1);else if(b.hasAttribute('data-service-back'))command(state.dialogKind==='thieves-guild'?1:0);});
 return{
  update(next){state=next;const kind=next.mode==='dialog'&&['blacksmith','thieves-guild'].includes(next.dialogKind)?next.dialogKind:'';panel.hidden=!kind;root.toggleAttribute('data-town-service',!!kind);if(!kind){key='';return;}
   const data=kind==='blacksmith'?next.blacksmith:next.thievesGuild,signature=JSON.stringify([kind,data,getLanguage()]);if(signature===key)return;key=signature;panel.dataset.kind=kind;
   const head=title=>`<header><h2>${esc(title)}</h2><button type="button" data-service-back aria-label="Close">✕</button></header>`;
   if(kind==='blacksmith'){
    panel.innerHTML=`${head('Blacksmith')}<div class="service-art"><canvas width="640" height="480" aria-label="${esc(data?.unit?.name||'War machine')}"></canvas></div><section class="service-description"><h3>${esc(data?.unit?.name||'War machine')}</h3><p>Equip the visiting hero with a war machine.</p><div class="service-cost"><img src="./web/h3-theme/resource-gold.png" alt="Gold"><strong>${new Intl.NumberFormat('en-US').format(data?.cost||0)}</strong></div>${data?.canBuy?'':`<p role="status">${data?.alreadyOwned?'This hero already owns this war machine.':'A visiting hero, a free equipment slot and enough gold are required.'}</p>`}</section><footer><button type="button" class="primary" data-service-buy ${data?.canBuy?'':'disabled'}>Buy ${esc(data?.unit?.name||'war machine')}</button><button type="button" data-service-back>← Back</button></footer>`;
    captureAt=performance.now()+80;
   }else{
    const players=data?.players||[],fr=getLanguage()==='fr',labels=fr?{'Towns':'Villes','Heroes':'Héros','Gold':'Or','Wood and ore':'Bois et minerai','Rare resources':'Ressources rares','Obelisks':'Obélisques','Artifacts':'Artefacts','Army strength':'Puissance des armées','Daily income':'Revenus quotidiens'}:{};
    const colors=fr?['Rouge','Bleu','Ocre','Vert','Orange','Violet','Turquoise','Rose']:['Red','Blue','Tan','Green','Orange','Purple','Teal','Pink'];
    const rankings=(data?.rows||[]).map(row=>`<tr><th scope="row">${esc(labels[row.label]||row.label)}</th>${players.map(p=>`<td>${row.ranks?.[p.color]?'<span class="guild-rank">'+esc(row.ranks[p.color])+'</span>':'<span aria-label="'+(fr?'Inconnu':'Unknown')+'">?</span>'}</td>`).join('')}</tr>`).join('');
    const intelligence=[[fr?'Meilleur héros':'Best hero','hero'],[fr?'Créature la plus puissante':'Strongest creature','creature'],[fr?'Personnalité':'Personality','personality']].map(([label,key],index)=>`<tr class="guild-intelligence-row" ${index===0?'data-intelligence-start':''}><th scope="row">${label}</th>${players.map(p=>`<td>${esc(p[key]||'?')}</td>`).join('')}</tr>`).join('');
    panel.innerHTML=`<header translate="no"><h2>${fr?'Guilde des voleurs':'Thieves’ Guild'}</h2></header><div class="guild-rankings" translate="no"><table aria-label="${fr?'Classements et renseignements des royaumes':'Kingdom rankings and intelligence'}"><thead><tr><th scope="col">${fr?'Royaumes':'Kingdoms'}</th>${players.map(p=>`<th scope="col"><span class="kingdom-flag" title="${colors[p.color]}" aria-label="${colors[p.color]}" data-color="${p.color}"></span><span class="kingdom-name">${colors[p.color]}</span></th>`).join('')}</tr></thead><tbody>${rankings}${intelligence}</tbody></table></div><footer translate="no"><button type="button" class="primary" data-service-back>← ${fr?'Retour':'Back'}</button></footer>`;

   }
  },
  paint(source){if(panel.hidden)return false;if(state.dialogKind==='blacksmith'&&performance.now()>=captureAt){const c=panel.querySelector('canvas'),r=state.blacksmith?.preview;if(r?.w&&r.h){const ctx=c.getContext('2d');ctx.drawImage(source,r.x*source.width/800,r.y*source.height/600,r.w*source.width/800,r.h*source.height/600,0,0,c.width,c.height);}}return true;}
 };
}
