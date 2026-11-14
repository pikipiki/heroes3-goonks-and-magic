import {plainGameText} from './game-text.mjs';
const esc=v=>plainGameText(String(v??'')).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const factions=['Château','Rempart','Tour','Enfer','Nécropole','Donjon','Bastion','Forteresse','Conflux'];
const resources=['Bois','Mercure','Minerai','Soufre','Cristal','Gemmes'];
const ruinWarning=(b,all=[])=>{const buildings=(b?.ruinExtensionLosses||[]).map(x=>x.name),stocks=(b?.ruinStockLosses||[]).filter(x=>x.count>0).map(x=>`${x.count} recrues du niveau ${x.tier}`),ruins=b?.building>=10&&b.building<=13&&all.filter(x=>x.building>=10&&x.building<=13).length===1;return (ruins?'Cette démolition met la ville en ruine. ':'')+(buildings.length||stocks.length?'Les extensions '+[...buildings,...stocks].join(', ')+' seront supprimées sans récupération.':'');};
export function createCaveBuilder({root,command}){
 const host=document.createElement('div');host.className='cave-builder';host.hidden=true;
 host.innerHTML='<button type="button" data-builder-open>Bâtisseur</button><section hidden aria-label="Bâtisseur"><header><h2>Bâtisseur</h2><button type="button" data-builder-close aria-label="Fermer">✕</button></header><div class="builder-scroll"></div><footer><p role="status"></p><button type="button" data-builder-confirm disabled>Confirmer</button></footer></section>';
 root.querySelector('.mobile-play').append(host);
 let data=null,nativeExtensions=[],open=false,key='',choice=null,pending=false,timer;
 const panel=host.querySelector('section'),body=host.querySelector('.builder-scroll'),status=host.querySelector('[role=status]'),confirm=host.querySelector('[data-builder-confirm]');
 function patch(){
  host.hidden=!data?.available;host.classList.toggle('is-open',open&&!host.hidden);panel.hidden=!open||host.hidden;host.querySelector('[data-builder-open]').hidden=open;
  if(panel.hidden)return;
  const signature=JSON.stringify([data,nativeExtensions.map(b=>b.id)]);
  if(signature!==key){key=signature;choice=null;pending=false;clearTimeout(timer);
   body.innerHTML=`<p>${Number(data.remaining)} démolitions restantes aujourd’hui. Vérifie les coûts et les ressources récupérées avant de confirmer.</p>${nativeExtensions.length?`<p class="builder-ruin-warning">La mise en ruine supprimera aussi ${nativeExtensions.map(b=>esc(b.name)).join(', ')} et leurs recrues en réserve, sans récupération.</p>`:''}`+(data.ruined?
    `<p>${data.rebuildReady?'Choisis la faction de la ville reconstruite.':'Reconstruction disponible au prochain tour indiqué : '+Number(data.rebuildReadyDay)+'.'}</p><p>Coût : ${Number(data.rebuildGold)} or.</p>${[...factions.map((name,id)=>({name,id})),...(Number.isInteger(data.goonkFaction)&&data.goonkFaction>=9?[{name:'Goonks',id:data.goonkFaction}]:[])].map(({name,id})=>`<button type="button" data-builder-op="2" data-selection="${id}" ${data.rebuildReady?'':'disabled'}>${name}</button>`).join('')}`:
    (data.buildings||[]).map(b=>`<article><h3>${esc(b.name)}</h3><p>Démolition : ${Number(b.gold)} or.</p><p>Matériaux récupérés : ${(b.salvage||[]).map((n,i)=>n?`${Number(n)} ${resources[i]}`:'').filter(Boolean).join(', ')||'aucune ressource'}.</p>${ruinWarning(b,data.buildings)?`<p class="builder-ruin-warning">${esc(ruinWarning(b,data.buildings))}</p>`:''}${b.reason?`<p>${esc(b.reason)}</p>`:''}${b.occupants?`<p>${Number(b.occupants)} créatures occupent ce bâtiment.</p><button type="button" data-builder-op="0" data-selection="${b.building}" data-option="1" ${b.enabled?'':'disabled'}>Évacuer (${Number(b.evacuationGold)} or en plus) et démolir</button><button type="button" data-builder-op="1" data-selection="${b.building}" ${b.fightEnabled?'':'disabled'}>Combattre les occupants puis démolir</button>`:`<button type="button" data-builder-op="0" data-selection="${b.building}" ${b.enabled?'':'disabled'}>Démolir ${esc(b.name)}</button>`}${b.recoverGrailAvailable?`<button type="button" data-builder-op="0" data-selection="26" data-option="1">Récupérer le Graal (${Number(b.recoverGrailGold)} or, aucun matériau)</button>`:''}</article>`).join(''));
  }
  for(const b of body.querySelectorAll('[data-builder-op]'))b.setAttribute('aria-pressed',String(!!choice&&b===choice.button));
  status.textContent=pending?'En attente du jeu…':choice?choice.button.textContent+' — '+(ruinWarning(data.buildings?.find(b=>b.building===choice.selection),data.buildings)||'Confirme pour effectuer ce choix.'):'Choisis une action.';
  confirm.disabled=!data.canAct||pending||!choice;
 }
 host.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-builder-open')){open=true;patch();return;}
  if(b.hasAttribute('data-builder-close')){open=false;choice=null;patch();return;}
  if(b.dataset.builderOp!==undefined){if(pending)return;choice={button:b,op:Number(b.dataset.builderOp),selection:Number(b.dataset.selection),option:Number(b.dataset.option||0)};patch();return;}
  if(b.hasAttribute('data-builder-confirm')&&choice&&data.canAct&&!pending){pending=true;command(103,data.hero,data.town,choice.op,choice.selection,choice.option);timer=setTimeout(()=>{pending=false;status.textContent='Aucun changement reçu. Vérifie les conditions avant de réessayer.';confirm.disabled=true;choice=null;},5000);patch();}
 });
 return{update(state){nativeExtensions=(state.buildings||[]).filter(b=>b.built&&b.id>=44);data=state.mode==='town'?state.caveBuilder:null;if(!data?.available){open=false;key='';choice=null;pending=false;clearTimeout(timer);}patch();}};
}
