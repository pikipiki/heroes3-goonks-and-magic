import {getLanguage} from './locale-state.mjs';
import {renderMarkup,setClickHandler,createAccordion} from './ui/material-components.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,'');
export function createLobbyOptions({menu,getState,command,onChange}){
 let form=null,request=null,timer=null,lastState=null,error='';
 function finish(message=''){
  clearTimeout(timer);request=null;error=message;
 }
 function configure(){
  request.phase='configuring';
  command(48,...request.values);
 }
 function observe(state){
  lastState=state;
  if(!request)return false;
  const {values:[players,humans,size,underground,faction],difficulty}=request;
  if(request.phase==='starting'){
   if(['map','town','battle'].includes(state.mode)||(state.sessionState===6&&(state.day!==undefined||state.heroId!==undefined))){finish();return false;}
   if(state.mode==='dialog'&&state.sessionState!==5){finish(getLanguage()==='fr'?'La carte aléatoire n’a pas pu démarrer. Vérifie le message du jeu, puis réessaie.':'The random map could not start. Check the game message, then retry.');return false;}
   return false;
  }
  if(state.mode==='dialog'){finish(getLanguage()==='fr'?'Impossible de préparer la carte personnalisée. Réessaie.':'Could not prepare the custom map. Try again.');return false;}
  if(request.phase==='closing'){
   if(state.mode==='menu'){request.phase='opening';command(20,humans);}
   return true;
  }
  if(request.phase==='opening'){
   if(state.mode==='lobby'&&state.lobbyReady){
    if(state.selectedMap)configure();
    else if(!request.mapRequested&&state.maps?.length){
     // A reopened lobby has no selected scenario. Holding all updates while
     // waiting for it prevented the normal default selection: a deadlock.
     const map=state.maps.find(map=>map.name===request.previousMap)||state.maps[0];
     request.mapRequested=true;command(24,map.index);
    }
   }
   return true;
  }
  if(state.mode!=='lobby'){finish();return false;}
  if(request.phase==='configuring'){
   const config=state.customMapOptions;
   if(!state.customMap||config?.players!==players||config.humans!==humans||config.size!==size||config.levels!==(underground?2:1))return request.reopening;
   request.reopening=false;request.phase='preferences';
   request.faction=state.factions?.some(item=>item.id===faction)?faction:null;
   if(request.faction!==null&&state.selectedFaction!==faction)command(37,faction);
   if(Number.isInteger(difficulty)&&state.difficulty!==difficulty)command(25,difficulty);
  }
  // ExtraOptions updates carry the whole array; restore one rule per native
  // acknowledgement so concurrent snapshots cannot overwrite earlier rules.
  const mismatch=request.wogOptions?.findIndex((value,index)=>state.wogOptions?.[index]!==undefined&&state.wogOptions[index]!==value)??-1;
  const rulesReady=mismatch<0;
  if(!rulesReady&&(request.ruleInFlight===undefined||state.wogOptions[request.ruleInFlight]===request.wogOptions[request.ruleInFlight])){request.ruleInFlight=mismatch;command(109,mismatch,request.wogOptions[mismatch]);}
  if(rulesReady&&(request.faction===null||state.selectedFaction===request.faction)&&(!Number.isInteger(difficulty)||state.difficulty===difficulty)){
   request.phase='starting';clearTimeout(timer);
   timer=setTimeout(()=>{finish(getLanguage()==='fr'?'Le lancement prend trop de temps. Tu peux réessayer.':'Starting took too long. You can retry.');onChange(lastState);},90000);
   command(22);
  }
  return false;
 }
 function generate(values){
  const state=getState();
  if(request||!state.lobbyReady||menu.querySelector('[data-ui=begin]').disabled)return;
  try{sessionStorage.setItem('heroes-goonk.lobby-draft',JSON.stringify(values));}catch{}
  const reopening=values[1]!==state.lobbyHumanCount;
  request={values,difficulty:state.difficulty,wogOptions:state.wogOptions?.slice(),previousMap:state.selectedMap,reopening,phase:reopening?'closing':'configuring'};
  error='';onChange();
  timer=setTimeout(()=>{finish(getLanguage()==='fr'?'Impossible de préparer la carte personnalisée. Réessaie.':'Could not prepare the custom map. Try again.');onChange(lastState);},30000);
  if(reopening)command(0);else configure();
 }
 return{observe,get pending(){return !!request;},get starting(){return request?.phase==='starting';},get error(){return error;},update(state,changingScenario=false){if(state.mode!=='lobby')return;if(!form?.isConnected){form=createAccordion({parent:menu.querySelector('.lobby-extra-options')||menu,className:'custom-game-options lobby-panel',markup:'<summary>Random map generator</summary><div class="lobby-panel-body"><p class="lobby-help">Choose your options above, then generate and start a new adventure.</p><label>Players on the new map<select data-custom-players>'+[2,3,4,5,6,7,8].map(n=>`<option>${n}</option>`).join('')+'</select></label><label>Human players on the new map (hotseat)<select data-custom-humans><option>1</option><option>2</option></select></label><label>Map size<select data-custom-size><option value=36>Small</option><option value=72>Medium</option><option value=108>Large</option><option value=144 selected>XL</option></select></label><label class="lobby-checkbox"><input type=checkbox data-custom-underground><span>Underground level</span></label><p class="lobby-help">Terrain is generated when the adventure starts. This starts a new game using these settings.</p><button type=button class=primary data-custom-generate>Generate and start</button></div>'});const area=menu.querySelector('.lobby-extra-options')||menu;const players=document.createElement('section');players.className='lobby-panel lobby-players';renderMarkup(players,'<h2><span>Players and castles on the selected map</span><strong data-scenario-player-count></strong></h2><div class="lobby-panel-body"><p class="lobby-help">Choose the starting castle for each player on the selected map.</p><div class=custom-player-towns></div></div>');area.prepend(players);form.querySelector('[data-custom-players]').onchange=()=>{const select=form.querySelector('[data-custom-humans]'),old=select.value;renderMarkup(select,Array.from({length:Number(form.querySelector('[data-custom-players]').value)},(_,i)=>`<option>${i+1}</option>`).join(''));select.value=Number(old)<=select.options.length?old:'1';};try{const draft=JSON.parse(new URL(location.href).searchParams.get('custom-game')||sessionStorage.getItem('heroes-goonk.lobby-draft')||'null');if(Array.isArray(draft)&&draft.length>=4){const count=Math.max(2,Math.min(8,Number(draft[0])||2));form.querySelector('[data-custom-players]').value=String(count);form.querySelector('[data-custom-players]').onchange();form.querySelector('[data-custom-humans]').value=String(Math.max(1,Math.min(count,Number(draft[1])||1)));if([36,72,108,144].includes(Number(draft[2])))form.querySelector('[data-custom-size]').value=String(draft[2]);form.querySelector('[data-custom-underground]').checked=Number(draft[3])===1;}}catch{}
 setClickHandler(form.querySelector('[data-custom-generate]'),()=>generate([Number(form.querySelector('[data-custom-players]').value),Number(form.querySelector('[data-custom-humans]').value),Number(form.querySelector('[data-custom-size]').value),form.querySelector('[data-custom-underground]').checked?1:0,Number(menu.querySelector('#mobile-faction-select')?.value||-1)]));}
 const button=form.querySelector('[data-custom-generate]');
 button.disabled=!!request||!state.lobbyReady||menu.querySelector('[data-ui=begin]').disabled;
 const fr=getLanguage()==='fr';
 const generateLabel=fr?'Générer et commencer':'Generate and start';
 if(button.textContent!==generateLabel)button.textContent=generateLabel;
 const intro=form.querySelector('.lobby-panel-body > .lobby-help');intro.textContent=fr?'Choisis les options ci-dessus, puis génère une carte et commence une nouvelle aventure.':'Choose your options above, then generate and start a new adventure.';
 const note=button.previousElementSibling;note.textContent=fr?'Le terrain est généré au lancement. Cette action commence une nouvelle partie avec ces réglages.':'Terrain is generated when the adventure starts. This starts a new game using these settings.';
 button.setAttribute('aria-busy',String(!!request));
 for(const input of form.querySelectorAll('select,input'))input.disabled=!!request;

 const towns=menu.querySelector('.custom-player-towns'),key=JSON.stringify([(state.players||[]).map(({color,name,factions})=>({color,name,factions})),getLanguage()]);
 const playerPanel=towns.closest('.lobby-players');
 playerPanel.hidden=!(state.players?.length);
 const count=playerPanel.querySelector('[data-scenario-player-count]');
 if(count.textContent!==String(state.players?.length||0))count.textContent=String(state.players?.length||0);
 if(towns._key!==key){
  towns._key=key;const fr=getLanguage()==='fr';
  renderMarkup(towns,(state.players||[]).map(p=>`<label><span class="lobby-player-label"><i class="lobby-player-colour" data-player-colour="${Number(p.color)}" aria-hidden="true"></i>${esc(p.name)}</span><select data-player-castle="${p.color}"><option value=-1>Random castle</option>${(p.factions||[]).map(f=>`<option value="${f.id}" ${f.id===p.faction?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label><label>${fr?'Revenus de':'Income for'} ${esc(p.name)}<select data-player-income="${Number(p.color)}" aria-label="${fr?'Revenus de':'Income for'} ${esc(p.name)}">${[...new Set([100,85,70,p.incomePercent??100])].map(value=>`<option value="${value}" ${value===(p.incomePercent??100)?'selected':''}>${value} %</option>`).join('')}</select></label>`).join(''));
  towns.querySelectorAll('[data-player-castle]').forEach(select=>select.onchange=()=>command(57,Number(select.dataset.playerCastle),Number(select.value)));
  towns.querySelectorAll('[data-player-income]').forEach(select=>select.onchange=()=>{select._pendingIncome={previous:select._nativeIncome??select.value,value:select.value};command(1210,Number(select.dataset.playerIncome),Number(select.value));});
 }
 for(const player of state.players||[]){
  const castle=towns.querySelector(`[data-player-castle="${Number(player.color)}"]`),income=towns.querySelector(`[data-player-income="${Number(player.color)}"]`);
  if(castle)castle.value=String(player.faction);
  if(income){
   const native=String(player.incomePercent??100),pending=income._pendingIncome;
   if(pending&&native!==pending.previous)income._pendingIncome=null;
   income._nativeIncome=native;
   const value=income._pendingIncome?.value??native;
   // Retain the source select and its choice list during acknowledgement.
   // An uncommon native percentage remains a valid choice after selecting another.
   if(![...income.options].some(option=>option.value===value)){const option=document.createElement('option');option.value=value;option.textContent=value+' %';income.append(option);}
   income.value=value;
  }
 }
 for(const select of towns.querySelectorAll('select'))select.disabled=!!request||changingScenario||!state.lobbyReady;
}
};}
