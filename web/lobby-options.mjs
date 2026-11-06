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
  if(state.mode==='dialog'){finish('Could not prepare the custom map. Try again.');return false;}
  if(request.phase==='closing'){
   if(state.mode==='menu'){request.phase='opening';command(20,humans);}
   return true;
  }
  if(request.phase==='opening'){
   if(state.mode==='lobby'&&state.lobbyReady&&state.selectedMap)configure();
   return true;
  }
  if(state.mode!=='lobby'){finish();return false;}
  if(request.phase==='configuring'){
   const config=state.customMapOptions;
   if(!state.customMap||config?.players!==players||config.humans!==humans||config.size!==size||config.levels!==(underground?2:1))return request.reopening;
   request.reopening=false;
   request.phase='preferences';
   request.faction=state.factions?.some(item=>item.id===faction)?faction:null;
   if(request.faction!==null&&state.selectedFaction!==faction)command(37,faction);
   if(Number.isInteger(difficulty)&&state.difficulty!==difficulty)command(25,difficulty);
  }
  if((request.faction===null||state.selectedFaction===request.faction)&&(!Number.isInteger(difficulty)||state.difficulty===difficulty))finish();
  return false;
 }
 function generate(values){
  const state=getState();
  if(request||!state.lobbyReady||menu.querySelector('[data-ui=begin]').disabled)return;
  try{sessionStorage.setItem('heroes-goonk.lobby-draft',JSON.stringify(values));}catch{}
  const reopening=values[1]!==state.lobbyHumanCount;
  request={values,difficulty:state.difficulty,reopening,phase:reopening?'closing':'configuring'};
  error='';onChange();
  timer=setTimeout(()=>{finish('Could not prepare the custom map. Try again.');onChange(lastState);},15000);
  if(reopening)command(0);else configure();
 }
 return{observe,get pending(){return !!request;},get error(){return error;},update(state,changingScenario=false){if(state.mode!=='lobby'){form=null;return;}if(!form?.isConnected){form=document.createElement('section');form.className='custom-game-options lobby-panel';form.innerHTML='<h2>Random map generator</h2><div class="lobby-panel-body"><p class="lobby-help">These settings apply only after you generate a new map.</p><label>Players on the new map<select data-custom-players>'+[2,3,4,5,6,7,8].map(n=>`<option>${n}</option>`).join('')+'</select></label><label>Human players on the new map (hotseat)<select data-custom-humans><option>1</option><option>2</option></select></label><label>Map size<select data-custom-size><option value=36>Small</option><option value=72>Medium</option><option value=108>Large</option><option value=144 selected>XL</option></select></label><label class="lobby-checkbox"><input type=checkbox data-custom-underground><span>Underground level</span></label><p class="lobby-help">The generated map replaces the selected scenario.</p><button type=button data-custom-generate>Generate custom map</button></div>';const area=menu.querySelector('.lobby-extra-options')||menu;area.append(form);const players=document.createElement('details');players.className='lobby-panel lobby-players';players.innerHTML='<summary><span>Players and castles on the selected map</span><strong data-scenario-player-count></strong></summary><div class="lobby-panel-body"><p class="lobby-help">Choose the starting castle for each player on the selected map.</p><div class=custom-player-towns></div></div>';area.prepend(players);form.querySelector('[data-custom-players]').onchange=()=>{const select=form.querySelector('[data-custom-humans]'),old=select.value;select.innerHTML=Array.from({length:Number(form.querySelector('[data-custom-players]').value)},(_,i)=>`<option>${i+1}</option>`).join('');select.value=Number(old)<=select.options.length?old:'1';};try{const draft=JSON.parse(new URL(location.href).searchParams.get('custom-game')||sessionStorage.getItem('heroes-goonk.lobby-draft')||'null');if(Array.isArray(draft)&&draft.length>=4){const count=Math.max(2,Math.min(8,Number(draft[0])||2));form.querySelector('[data-custom-players]').value=String(count);form.querySelector('[data-custom-players]').onchange();form.querySelector('[data-custom-humans]').value=String(Math.max(1,Math.min(count,Number(draft[1])||1)));if([36,72,108,144].includes(Number(draft[2])))form.querySelector('[data-custom-size]').value=String(draft[2]);form.querySelector('[data-custom-underground]').checked=Number(draft[3])===1;}}catch{}
 form.querySelector('[data-custom-generate]').onclick=()=>generate([Number(form.querySelector('[data-custom-players]').value),Number(form.querySelector('[data-custom-humans]').value),Number(form.querySelector('[data-custom-size]').value),form.querySelector('[data-custom-underground]').checked?1:0,Number(menu.querySelector('#mobile-faction-select')?.value||-1)]);}
 const button=form.querySelector('[data-custom-generate]');
 button.disabled=!!request||!state.lobbyReady||menu.querySelector('[data-ui=begin]').disabled;
 button.setAttribute('aria-busy',String(!!request));
 for(const input of form.querySelectorAll('select,input'))input.disabled=!!request;

 const towns=menu.querySelector('.custom-player-towns'),key=JSON.stringify(state.players||[]);
 const playerPanel=towns.closest('.lobby-players');
 playerPanel.hidden=!(state.players?.length);
 const count=playerPanel.querySelector('[data-scenario-player-count]');
 if(count.textContent!==String(state.players?.length||0))count.textContent=String(state.players?.length||0);
 if(towns._key!==key){towns._key=key;towns.innerHTML=(state.players||[]).map(p=>`<label><span class="lobby-player-label"><i class="lobby-player-colour" data-player-colour="${Number(p.color)}" aria-hidden="true"></i>${esc(p.name)}</span><select data-player-castle="${p.color}"><option value=-1>Random castle</option>${(p.factions||[]).map(f=>`<option value="${f.id}" ${f.id===p.faction?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label>`).join('');towns.querySelectorAll('select').forEach(select=>select.onchange=()=>command(57,Number(select.dataset.playerCastle),Number(select.value)));}
 for(const select of towns.querySelectorAll('select'))select.disabled=!!request||changingScenario;
}
};}
