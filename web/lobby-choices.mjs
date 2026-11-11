import {getLanguage} from './i18n.mjs';
import {factionArt, factionArtPaths} from './faction-art.mjs';
import {scenarioDetails} from './scenario-details.mjs';
import {mountScenarioFilters} from './scenario-filters.mjs';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const difficulty=['A relaxed adventure','The classic challenge','Plan every move','For experienced heroes','Every resource matters'];
function soloMapMetadata(map, state) {
 const humans=Math.min(state.lobbyHumanCount??1,map.humanSeats??1);
 const castleChoices=humans===1?Number(map.castleChoice):Math.min(humans,map.humanCastleChoices??0);
 return {...map,humans,humanSeats:humans,castleChoices};
}

export function createLobbyChoices({menu,getState,isScenarioPending=()=>false}){
 const controls=new Map(),artwork=new Map();
 let dialog=null,filters=null,source=null,pendingOpen=null;
 const options=s=>[...s.options].map(o=>({value:o.value,label:o.textContent,disabled:o.disabled}));
 const factionKey=(s,value)=>{
  const state=getState(),player=state.players?.find(p=>String(p.color)===s.dataset.playerCastle);
  const option=player?.factions?.find(f=>String(f.id)===value);
  const key=option?.key??state.factions?.find(f=>String(f.id)===value)?.key;
  return key?.split(':').at(-1);
 };
 const artPaths=(s,value)=>factionArtPaths({id:value,key:factionKey(s,value)});
 const art=(s,value)=>factionArt({id:value,key:factionKey(s,value)});
 function preloadFactionArt(s,list){
  for(const option of list)for(const url of artPaths(s,option.value)){
   if(artwork.has(url))continue;
   const image=new Image();
   image.src=url;
   artwork.set(url,image);
   void image.decode().catch(()=>{});
  }
 }
 function updateFactionCard(c,s,list){
  if(c.dataset.control!=='castle'){
   c.dataset.control='castle';
   c.innerHTML='<h3></h3><button type="button" class="lobby-choice-card" aria-haspopup="dialog"><figure class="lobby-faction-art"></figure><span><small>Starting faction</small><strong>Choose…</strong><em>Choose castle <span aria-hidden="true">›</span></em></span></button>';
   c.querySelector('button').onclick=()=>open(s);
  }
  const heading=c.querySelector('h3'),headingText=title(s);
  if(heading._sourceText!==headingText){
   heading._sourceText=headingText;
   heading.textContent=headingText;
   if(s.dataset.playerCastle!==undefined){
    const colour=document.createElement('i');
    colour.className='lobby-player-colour';
    colour.dataset.playerColour=s.dataset.playerCastle;
    colour.setAttribute('aria-hidden','true');
    heading.prepend(colour);
   }
  }
  const button=c.querySelector('button');
  button.disabled=s.disabled||!list.length;
  const choice=list.find(option=>option.value===s.value);
  const paths=choice&&!isScenarioPending()?artPaths(s,choice.value):null;
  const key=paths?.join('|');
  const label=button.querySelector('strong');
  button._artLabel=choice?.label;
  if(key&&button._shownArtKey===key&&label._sourceText!==choice.label){label._sourceText=choice.label;label.textContent=choice.label;}
  if(button._artKey===key)return;
  button._artKey=key;
  if(!key||button._shownArtKey===key)return;
  const illustration=document.createElement('div');
  illustration.innerHTML=art(s,choice.value);
  const figure=illustration.firstElementChild;
  void Promise.all([...figure.querySelectorAll('img')].map(image=>image.decode().catch(()=>{image.hidden=true;}))).then(()=>{
   if(!button.isConnected||button._artKey!==key)return;
   button.querySelector('figure').replaceWith(figure);
   button._shownArtKey=key;
   label._sourceText=button._artLabel;
   label.textContent=button._artLabel;
  });
 }
 function cancelOpening(){
  pendingOpen?.button.removeAttribute('aria-busy');
  pendingOpen=null;
 }
 const faction=s=>s.id==='mobile-faction-select'||s.hasAttribute('data-player-castle');
 const title=s=>s.id==='mobile-map-select'?(getState().mode==='load'?'Saved game':'Adventure map'):s.id==='mobile-faction-select'?'Your castle':s.id==='mobile-difficulty'?'Difficulty':s.closest('label')?.querySelector('.lobby-player-label')?.textContent||[...s.closest('label').childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
 function change(s,value){if(s.disabled||s.value===String(value))return;const counter=document.activeElement?.dataset.counter;s.value=String(value);s.dispatchEvent(new Event('change',{bubbles:true}));update(getState());const c=controls.get(s),focus=counter?c?.querySelector('[data-counter="'+counter+'"]'):c?.querySelector('[data-tile-value="'+CSS.escape(String(value))+'"]')||c?.querySelector('button');(focus&&!focus.disabled?focus:c)?.focus({preventScroll:true});}
 function close(){dialog?.close();source=null;}
 async function open(s){
  if(s.disabled||pendingOpen?.select===s)return;
  cancelOpening();
  const isFaction=faction(s),button=controls.get(s)?.querySelector('button');
  const opening=isFaction?{select:s,button}:null;
  if(opening){pendingOpen=opening;button.setAttribute('aria-busy','true');}
  if(!dialog?.isConnected){dialog=document.createElement('dialog');dialog.className='lobby-picker';dialog.setAttribute('aria-labelledby','lobby-picker-title');dialog.innerHTML='<header><h2 id="lobby-picker-title" tabindex="-1"></h2><button type="button" data-picker-close aria-label="Close choices">✕</button></header><div class="lobby-picker-content"><label class="lobby-picker-search">Search<input type="search" aria-label="Search choices" placeholder="Search…"></label><div class="lobby-picker-grid" role="group"></div><p class="lobby-picker-empty" hidden>No matching choices.</p></div><footer><button type="button" data-picker-back>← Back</button></footer>';menu.append(dialog);dialog.querySelector('[data-picker-close]').onclick=close;dialog.querySelector('[data-picker-back]').onclick=close;dialog.addEventListener('cancel',()=>source=null);filters=mountScenarioFilters(dialog);dialog.querySelector('.lobby-picker-grid').onclick=e=>{const b=e.target.closest('[data-choice-value]');if(!b||b.disabled||!source)return;const selected=source,value=b.dataset.choiceValue;close();change(selected,value);};}
  dialog.dataset.kind=isFaction?'castle':'map';
  dialog.querySelector('h2').textContent=title(s);
  dialog.querySelector('.lobby-picker-grid').setAttribute('aria-label',title(s));
  dialog.querySelector('.lobby-picker-search').hidden=isFaction;
  const state=getState(),isMap=!isFaction&&state.mode==='lobby';
  dialog.querySelector('.lobby-picker-empty').textContent='No matching choices.';
  const maps=new Map((!isFaction&&state.mode==='lobby'?state.maps??[]:[]).map(map=>[String(map.index),soloMapMetadata(map,state)]));
  const fr=getLanguage()==='fr';
  dialog.querySelector('.lobby-picker-grid').innerHTML=options(s).map(o=>{
   const map=maps.get(o.value);
   const name=`<span class="lobby-choice-name">${esc(o.label)}</span>`;
   const metadata=map?scenarioDetails(map,fr):'';
   const details=metadata?`<small class="lobby-map-meta">${esc(metadata)}</small>`:'';
   const copy=isFaction?name:`<span class="lobby-choice-copy">${name}${details}</span>`;
   return `<button type="button" data-choice-value="${esc(o.value)}" aria-pressed="${o.value===s.value}" ${o.disabled?'disabled':''}>${isFaction?art(s,o.value):'<img src="./web/h3-theme/adventure-map.svg" alt="">'}${copy}<span class="lobby-choice-check" aria-hidden="true">${o.value===s.value?'✓':''}</span></button>`;
  }).join('');
  filters.update([...dialog.querySelectorAll('[data-choice-value]')].map(row=>({row,map:maps.get(row.dataset.choiceValue)})),{french:fr,enabled:isMap});
  if(opening){
   await Promise.all([...dialog.querySelectorAll('.lobby-faction-art img')].map(image=>image.decode().catch(()=>{image.hidden=true;})));
   if(pendingOpen!==opening)return;
   cancelOpening();
   if(!s.isConnected||!button.isConnected||s.disabled||getState().mode!=='lobby')return;
  }
  source=s;dialog.showModal();
  dialog.querySelector('.lobby-picker-content').scrollTop=0;
  if(isMap){dialog.querySelector('h2').focus({preventScroll:true});return;}
  const active=dialog.querySelector('[data-choice-value][aria-pressed=true]');active?.focus({preventScroll:true});active?.scrollIntoView({block:'nearest'});
 }
 function update(state){if(!['lobby','load'].includes(state.mode)){cancelOpening();if(dialog?.open)close();for(const [s,c]of controls)if(!s.isConnected){c.remove();controls.delete(s);}return;}
  for(const [s,c]of controls)if(!s.isConnected){c.remove();controls.delete(s);if(source===s)close();if(pendingOpen?.select===s)cancelOpening();}
  for(const s of menu.querySelectorAll('select:not(.lobby-picker select)')){let c=controls.get(s);if(!c){c=document.createElement('section');c.className='lobby-setting';c.tabIndex=-1;c.dataset.setting=s.id||(s.dataset.playerCastle!==undefined?'player-'+s.dataset.playerCastle:s.hasAttribute('data-custom-players')?'players':s.hasAttribute('data-custom-humans')?'humans':'size');s.closest('label').classList.add('lobby-native-label');s.closest('label').after(c);controls.set(s,c);}
   c.hidden=s.closest('label').hidden;c.setAttribute('aria-busy',String(s.dataset.updating==='true'));
   if(s.id==='mobile-map-select'){
    if(c.dataset.control!=='map'){
     c.dataset.control='map';
     c.innerHTML='<h3></h3><button type="button" class="lobby-choice-card" aria-haspopup="dialog"><img class="lobby-map-emblem" src="./web/h3-theme/adventure-map.svg" alt=""><span><small></small><strong></strong><em></em></span></button>';
     c.querySelector('button').onclick=()=>open(s);
    }
    const busy=s.dataset.updating==='true',load=state.mode==='load',label=state.customMap?state.selectedMap:s.selectedOptions[0]?.textContent;
    const map=state.maps?.find(item=>String(item.index)===s.value);
    const selected=state.customMap?state.customMapOptions:map;
    const fr=getLanguage()==='fr';
    const summary=selected?scenarioDetails(state.customMap?{...selected,width:selected.size,height:selected.size}:soloMapMetadata(selected,state),fr):'';
    for(const [selector,text] of [['h3',title(s)],['small',load?'Saved adventure':summary||'Selected scenario'],['strong',busy?(label?'Selecting scenario…':'Loading scenarios…'):label||'Choose a scenario'],['em',busy?'Please wait…':load?'Choose save ›':'Browse maps ›']]){
     const node=c.querySelector(selector);
     if(node._sourceText!==text){node._sourceText=text;node.textContent=text;}
    }
    c.querySelector('button').disabled=s.disabled||!s.options.length;
    continue;
   }
   const list=options(s);
   if(faction(s)){preloadFactionArt(s,list);updateFactionCard(c,s,list);continue;}
   const key=JSON.stringify([list,s.value,s.disabled,s.dataset.updating,title(s)]);if(c._key===key)continue;c._key=key;
   const heading=`<h3>${esc(title(s))}</h3>`;
   if(s.id==='mobile-difficulty'||s.hasAttribute('data-custom-size')){const isDifficulty=s.id==='mobile-difficulty';c.dataset.control='tiles';c.innerHTML=heading+`<div class="lobby-choice-tiles" role="group" aria-label="${esc(title(s))}">${list.map((o,i)=>`<button type="button" data-tile-value="${esc(o.value)}" aria-pressed="${s.value===o.value}" ${s.disabled||o.disabled?'disabled':''}><span class="lobby-tile-symbol" aria-hidden="true">${isDifficulty?'◆'.repeat(i+1):['S','M','L','XL'][i]}</span><strong>${esc(o.label)}</strong></button>`).join('')}</div>`+(isDifficulty?`<p class="lobby-choice-help">${difficulty[Number(s.value)]||''}</p>`:'');c.querySelectorAll('[data-tile-value]').forEach(b=>b.onclick=()=>change(s,b.dataset.tileValue));
   }else if(s.hasAttribute('data-custom-players')||s.hasAttribute('data-custom-humans')){c.dataset.control='counter';const index=list.findIndex(o=>o.value===s.value);c.innerHTML=heading+`<div class="lobby-counter"><button type="button" data-counter="-1" aria-label="Decrease ${esc(title(s))}" ${s.disabled||index<=0?'disabled':''}>−</button><output aria-live="polite"><strong>${esc(s.value)}</strong><span>${s.hasAttribute('data-custom-humans')?'Human players':'New map players'}</span></output><button type="button" data-counter="1" aria-label="Increase ${esc(title(s))}" ${s.disabled||index>=list.length-1?'disabled':''}>+</button></div>`;c.querySelectorAll('[data-counter]').forEach(b=>b.onclick=()=>{const i=list.findIndex(o=>o.value===s.value),next=list[i+Number(b.dataset.counter)];if(next)change(s,next.value);});
   }
  }
 }
 menu.addEventListener('change',()=>queueMicrotask(()=>update(getState())));
 return{update};
}
