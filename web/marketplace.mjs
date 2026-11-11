import {getLanguage} from './i18n.mjs';
import {compactResource, resourceDescriptors, resourceIconURL} from './resources.mjs';

const englishNames = {wood:'Wood', mercury:'Mercury', ore:'Ore', sulfur:'Sulfur', crystal:'Crystal', gems:'Gems', gold:'Gold'};
const words = {
 en:{title:'Marketplace', give:'You give', receive:'You receive', quantity:'Lots', trade:'Exchange', classic:'Classic', close:'Close marketplace', prompt:'Choose two different resources.', shortage:'You cannot afford this exchange.', success:'Exchange completed.', waiting:'Exchanging…', offTurn:'Available on your turn', timeout:'Exchange could not be confirmed.', minus:'Fewer lots', plus:'More lots', max:'Max', total:'Trade total'},
 fr:{title:'Marché', give:'Tu donnes', receive:'Tu reçois', quantity:'Lots', trade:'Échanger', classic:'Classique', close:'Fermer le marché', prompt:'Choisis deux ressources différentes.', shortage:'Tu ne peux pas payer cet échange.', success:'Échange effectué.', waiting:'Échange en cours…', offTurn:'Disponible à ton tour', timeout:'Impossible de confirmer l’échange.', minus:'Moins de lots', plus:'Plus de lots', max:'Max', total:'Total de l’échange'}
};

export function createMarketplace({root, command, refresh}) {
 const panel = document.createElement('section');
 panel.className = 'market-page';
 panel.hidden = true;
 panel.setAttribute('aria-labelledby','market-title');
 panel.innerHTML = `<header class="market-header"><img src="./web/h3-theme/resource-gold.png" alt=""><h2 id="market-title"></h2></header>
 <div class="market-sides"><section aria-labelledby="market-give"><h3 id="market-give"></h3><div class="market-grid" data-side="give"></div></section>
 <section aria-labelledby="market-receive"><h3 id="market-receive"></h3><div class="market-grid" data-side="receive"></div></section></div>
 <section class="market-deal"><div class="market-total" role="status" aria-live="polite"></div><div class="market-order"><div class="market-stepper">
 <button type="button" data-market="minus">−</button><input type="number" inputmode="numeric" min="1" step="1"><button type="button" data-market="plus">+</button><button type="button" data-market="max"></button>
 </div><button class="primary" type="button" data-market="trade"></button></div><footer class="market-view-actions"><button type="button" data-market="classic"></button><button class="primary" type="button" data-market="close">← Back</button></footer></section>`;
 root.querySelector('.mobile-play').append(panel);
 const find = s => panel.querySelector(s);
 const amount = find('input'), total = find('.market-total');
 const controls = Object.fromEntries([...panel.querySelectorAll('[data-market]')].map(button=>[button.dataset.market,button]));
 let state = {}, give = null, receive = null, lots = 1, classic = false, pending = null, timer, status = '', signature = '';

 function view() {
  panel.hidden = state.mode !== 'market' || classic;
  if(state.mode === 'market') root.dataset.marketView = classic?'classic':'mobile';
  else delete root.dataset.marketView;
 }
 function clearPending() {
  clearTimeout(timer);
  pending = null;
 }
 function terms() {
  const source = resources().find(r=>r.id===give);
  const quote = state.marketQuotes?.find(q=>q[0]===give&&q[1]===receive);
  const max = quote&&source?Math.min(Math.floor(source.value/quote[2]),Math.floor(2147483647/Math.max(quote[2],quote[3]))):0;
  return {quote,max};
 }
 const resources = () => resourceDescriptors(state.resources,state.resourceTypes);
 const resourceName = resource => getLanguage()==='en'?(englishNames[resource.key]||resource.name):resource.name;
 function renderResources(rows) {
  for(const grid of panel.querySelectorAll('.market-grid')) {
   grid.replaceChildren(...rows.map(resource=>{
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.resourceId = resource.id;
    const url = resourceIconURL(resource,window.goonkAssetURLs);
    if(url) {
     const icon = document.createElement('img');icon.src=url;icon.alt='';
     button.append(icon);
    }
    button.append(document.createElement('span'),document.createElement('small'));
    return button;
   }));
  }
 }
 function render() {
  const text = words[getLanguage()], rows=resources(), {quote,max}=terms();
  if(max) lots=Math.min(max,Math.max(1,lots));
  const nextSignature = JSON.stringify(rows.map(({id,key,icon,scope})=>[id,key,icon,scope]));
  if(nextSignature!==signature) {signature=nextSignature;renderResources(rows);}
  find('#market-title').textContent=text.title;
  find('#market-give').textContent=text.give;
  find('#market-receive').textContent=text.receive;
  controls.classic.textContent=text.classic;
  controls.close.setAttribute('aria-label',text.close);
  controls.minus.setAttribute('aria-label',text.minus);
  controls.plus.setAttribute('aria-label',text.plus);
  controls.max.textContent=text.max;
  controls.trade.textContent=pending?text.waiting:!state.turn?text.offTurn:text.trade;
  controls.trade.setAttribute('aria-busy',String(Boolean(pending)));
  amount.setAttribute('aria-label',text.quantity);
  amount.max=Math.max(1,max);
  if(document.activeElement!==amount)amount.value=max?lots:'';
  const blocked=!max||Boolean(pending);
  controls.trade.disabled=!state.turn||blocked;
  amount.disabled=blocked;
  controls.minus.disabled=blocked||lots<=1;
  controls.plus.disabled=blocked||lots>=max;
  controls.max.disabled=blocked||lots>=max;
  for(const grid of panel.querySelectorAll('.market-grid')){
   const selling=grid.dataset.side==='give';
   for(const [index,button] of [...grid.children].entries()){
    const resource=rows[index], name=resourceName(resource);
    button.disabled=Boolean(pending)||(selling?resource.id===receive:resource.id===give);
    button.setAttribute('aria-pressed',String(resource.id===(selling?give:receive)));
    button.lastElementChild.textContent=selling?compactResource(resource.value):'';
    button.lastElementChild.hidden=!selling;
    button.querySelector('span').textContent=name;
    button.title=selling?`${name} · ${resource.value}`:name;
    button.setAttribute('aria-label',button.title);
   }
  }
  const source=rows.find(r=>r.id===give), target=rows.find(r=>r.id===receive);
  if(status||!quote||!max){
   total.textContent=status?text[status]:!quote?text.prompt:text.shortage;
  }else{
   const format=new Intl.NumberFormat(getLanguage());
   total.textContent=`${format.format(lots*quote[2])} ${resourceName(source)} → ${format.format(lots*quote[3])} ${resourceName(target)}`;
   total.setAttribute('aria-label',text.total+': '+total.textContent);
   return;
  }
  total.removeAttribute('aria-label');
 }
 panel.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button||button.disabled||state.mode!=='market')return;
  if(button.dataset.resourceId!==undefined){
   const side=button.closest('[data-side]').dataset.side, id=Number(button.dataset.resourceId);
   if(side==='give')give=id;
   else receive=id;
   lots=1;status='';render();return;
  }
  const {quote,max}=terms();
  switch(button.dataset.market){
   case 'classic': classic=true;view();refresh();return;
   case 'close': command(74);return;
   case 'minus': lots--;break;
   case 'plus': lots++;break;
   case 'max': lots=max;break;
   case 'trade': {
    if(!state.turn||pending||!quote||lots<1||lots>max)return;
    const rows=resources();
    pending={give,receive,source:rows.find(r=>r.id===give).value-lots*quote[2],target:rows.find(r=>r.id===receive).value+lots*quote[3]};
    status='waiting';
    command(73,give,receive,lots,quote[2],quote[3]);
    timer=setTimeout(()=>{clearPending();status='timeout';render();},4000);
    break;
   }
  }
  render();
 });
 amount.addEventListener('input',()=>{
  const n=Number(amount.value),{max}=terms();
  if(!Number.isInteger(n)||n<1||n>max){controls.trade.disabled=true;return;}
  lots=n;status='';render();
 });
 amount.addEventListener('change',()=>{amount.value=lots;render();});
 window.addEventListener('goonk-language',()=>{if(!panel.hidden)render();});
 return {
  get active(){return !panel.hidden;},
  showMobile(){classic=false;view();render();refresh();},
  update(next){
   const changed=next.mode!==state.mode;
   const repaint=changed||JSON.stringify([next.resources,next.resourceTypes,next.turn,next.marketQuotes])!==JSON.stringify([state.resources,state.resourceTypes,state.turn,state.marketQuotes]);
   state=next;
   if(changed){clearPending();give=receive=null;lots=1;classic=false;status='';}
   view();
   if(state.mode!=='market')return;
   if(pending){
    const rows=resources();
    if(rows.find(r=>r.id===pending.give)?.value===pending.source&&rows.find(r=>r.id===pending.receive)?.value===pending.target){
     clearPending();status='success';lots=1;
    }
   }
   if(repaint)render();
  }
 };
}
