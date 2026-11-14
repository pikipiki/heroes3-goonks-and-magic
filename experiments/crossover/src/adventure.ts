import {sharedField} from './shared-field.js';
import {battlePlan,battleResult,type BattlePlan,type BattleState,type HeroesStack} from './battle.js';
import type {NativeBridge,CreatureSoundKind} from './native-bridge.js';
type HeroWindow = Window & {goonkCrossoverSounds?:{battleId:number;rows:{id:number;bytes:Uint8Array;kind?:CreatureSoundKind}[]};Module?: {_vcmiCrossoverCommand?(op:number,id:number,ptr:number,count:number):void;_vcmiMobileCommand?(...args:number[]):void;_malloc(n:number):number;_free(n:number):void;HEAPU8:Uint8Array};goonkCrossoverInstalled?:boolean;goonkMobileState?: Record<string,unknown>};
type StarWindow = Window & {openbwPrepareCrossover?():Promise<unknown>;openbwLaunchCrossover?(plan:BattlePlan):Promise<void>;openbwCrossover?:NativeBridge};
export function installAdventure(target:Window,base:URL,onExit:()=>void,trial=false):()=>void {
 const win=target as HeroWindow,doc=win.document;
 if(win.goonkCrossoverInstalled){if(trial)win.dispatchEvent(new Event('goonk-crossover-demo'));return()=>{};}win.goonkCrossoverInstalled=true;
 const style=doc.createElement('link');style.rel='stylesheet';style.href=new URL('adventure.css',base).href;doc.head.append(style);
 const makeButton=(id:string,label:string,action:string):HTMLButtonElement=>{const button=doc.createElement('button');button.id=id;button.type='button';button.textContent=label;button.dataset.crossoverAction=action;button.setAttribute('translate','no');return button;};
 const demo=makeButton('crossover-demo','Démo Heroes × StarCraft','demo');demo.innerHTML='<span>Démo Heroes × StarCraft</span><small>Archers, piquiers et Marines</small>';demo.disabled=true;
 const menuDemo=makeButton('crossover-demo-menu','Démo Heroes × StarCraft','demo');
 const toggle=makeButton('crossover-toggle','Combats en temps réel : activés','toggle');toggle.setAttribute('aria-pressed','true');
 const mainStatus=doc.createElement('p'),menuStatus=doc.createElement('p');for(const status of [mainStatus,menuStatus]){status.className='crossover-menu-status';status.setAttribute('translate','no');status.setAttribute('role','status');}
 const hint=(text:string):void=>{for(const status of [mainStatus,menuStatus])status.textContent=text;};
 const closeMenu=():void=>{doc.querySelector<HTMLDialogElement>('#game-menu')?.close();};
 let enabled=true,configured=false,disposed=false,plan:BattlePlan|undefined,frame:HTMLIFrameElement|undefined,panel:HTMLElement|undefined,timer:number|undefined,sent=false,starting=false,selected=false,autoAttack=false,isDemo=trial,latestMode='',checkpoint=false,sceneDispose:(()=>void)|undefined;
 let settingsButton:HTMLButtonElement|undefined,latestOnline=false,latestTurn=false;
 let warmFrame:HTMLIFrameElement|undefined,warmPromise:Promise<StarWindow>|undefined,assetsReady=false;
 const prepareEngine=():Promise<StarWindow>=>{
  if(warmPromise)return warmPromise;
  assetsReady=false;hint('Préparation de StarCraft…');
  warmFrame=doc.createElement('iframe');warmFrame.dataset.crossoverEngine='';warmFrame.title='Moteur de combat';warmFrame.setAttribute('aria-hidden','true');warmFrame.tabIndex=-1;
  warmFrame.style.cssText='position:fixed;width:min(100vw,800px);height:min(100vh,500px);left:0;top:0;opacity:0;pointer-events:none;border:0;z-index:-1';
  const preparedFrame=warmFrame;
  warmPromise=new Promise<StarWindow>((resolve,reject)=>{
   preparedFrame.addEventListener('load',async()=>{try{
    const sc=preparedFrame.contentWindow as StarWindow;if(!sc.openbwPrepareCrossover)throw Error('Préparation du moteur StarCraft indisponible.');
    await sc.openbwPrepareCrossover();if(disposed)return;
    assetsReady=true;hint('');demo.disabled=latestOnline||latestMode!=='menu'||trial;menuDemo.disabled=latestOnline||checkpoint||!latestTurn;
    configured=false;resolve(sc);
   }catch(error){hint(String(error));reject(error);}},{once:true});
   preparedFrame.src=new URL('starcraft/index.html',base).href;doc.body.append(preparedFrame);
  });
  return warmPromise;
 };
 const cancelled=new Set<number>();
 const mountControls=():void=>{
  const home=doc.querySelector('#mobile-app .mobile-menu[data-kind="menu"]');
  if(home&&!home.contains(demo)){const first=home.querySelector('[data-action="20"]');if(first)first.after(demo);else home.append(demo);home.append(mainStatus);}
  settingsButton ||= doc.querySelector<HTMLButtonElement>('#game-menu-toggle')||undefined;
  const top=doc.querySelector('#mobile-app .mobile-top');
  if(settingsButton){
   if(latestMode==='menu'&&home&&!home.contains(settingsButton)){home.append(settingsButton);settingsButton.textContent='Options';settingsButton.setAttribute('aria-label','Options du jeu');}
   else if(latestMode!=='menu'&&top&&!top.contains(settingsButton)){top.prepend(settingsButton);settingsButton.textContent='☰';settingsButton.setAttribute('aria-label','Menu du jeu');}
  }
  const nav=doc.querySelector('#game-menu nav');if(nav&&!nav.contains(menuDemo)){nav.append(menuDemo,toggle,menuStatus);}
 };
 const command=(op:number,id:number,rows:[number,number][]=[]):void=>{
  const m=win.Module;if(!m?._vcmiCrossoverCommand)throw Error('Moteur Heroes sans passerelle de combat.');
  const bytes=new Int32Array(rows.flat()),pointer=rows.length?m._malloc(bytes.byteLength):0;
  try{if(rows.length)m.HEAPU8.set(new Uint8Array(bytes.buffer),pointer);m._vcmiCrossoverCommand(op,id,pointer,rows.length);}finally{if(pointer)m._free(pointer);}
 };
 const closePanel=():void=>{sceneDispose?.();sceneDispose=undefined;if(timer!==undefined)win.clearInterval(timer);timer=undefined;frame?.remove();frame=undefined;panel?.remove();panel=undefined;plan=undefined;sent=false;if(!disposed)void prepareEngine().catch(()=>{});};
 const begin=(value:{battleId:number;stacks:HeroesStack[]}):void=>{
  if(plan?.battleId===value.battleId||cancelled.has(value.battleId))return;
  closePanel();closeMenu();plan=battlePlan(value);
  panel=doc.createElement('section');panel.id='crossover-arena';panel.setAttribute('translate','no');panel.setAttribute('aria-label','Combat Heroes × StarCraft');
  panel.innerHTML='<div class="field"><iframe title="Moteur de combat" aria-hidden="true" tabindex="-1"></iframe><canvas id="crossover-field"></canvas></div><header class="battle-heading"><div class="heading-label"><span class="eyebrow">HEROES GOONK</span><h2>Combat en temps réel</h2></div><button id="crossover-cancel" aria-label="Reprendre le combat Heroes classique">↩ Classique</button><p id="crossover-battle-status" role="status">Préparation du combat…</p><progress aria-label="Préparation des données du combat"></progress></header><aside aria-label="Commandes du combat"><div class="battle-actions"><button id="crossover-start" disabled>Commencer le combat</button><button id="crossover-attack" aria-pressed="false" disabled>Avancer et attaquer</button><button id="crossover-stop" disabled>Arrêter</button><button id="crossover-select-all" disabled>Tout sélectionner</button><button id="crossover-sound" disabled aria-pressed="true">Son activé</button></div><p id="crossover-selection" class="battle-selection" role="status">Sélectionne une troupe, puis touche un ennemi pour attaquer.</p><section aria-label="Armées"><h3>Les combattants</h3><div id="crossover-roster"></div></section><details><summary>Comment jouer</summary><p>Choisis une troupe, puis touche le terrain pour la déplacer ou un ennemi pour l’attaquer. Touche directement un ennemi pour attaquer : aucun bouton supplémentaire. Le premier ordre démarre le combat. « Avancer et attaquer » sert uniquement à avancer vers un point en engageant les ennemis rencontrés. « Arrêter » annule ses ordres. Tes troupes restent inactives sans ordre.</p></details></aside>';
  panel.hidden=true;doc.body.append(panel);panel.querySelector('iframe')!.remove();
  const prepared=prepareEngine();frame=warmFrame!;warmFrame=undefined;warmPromise=undefined;
  const activePanel=panel,activeFrame=frame,activePlan=plan,canvas=panel.querySelector<HTMLCanvasElement>('#crossover-field')!;
  const status=panel.querySelector<HTMLElement>('#crossover-battle-status')!,start=panel.querySelector<HTMLButtonElement>('#crossover-start')!,attack=panel.querySelector<HTMLButtonElement>('#crossover-attack')!,stop=panel.querySelector<HTMLButtonElement>('#crossover-stop')!,all=panel.querySelector<HTMLButtonElement>('#crossover-select-all')!,progress=panel.querySelector<HTMLProgressElement>('progress')!,selection=panel.querySelector<HTMLElement>('#crossover-selection')!;
  const sound=panel.querySelector<HTMLButtonElement>('#crossover-sound')!;
  const audio=():void=>{const api=(activeFrame.contentWindow as StarWindow).openbwCrossover;void api?.enableAudio?.().catch(()=>{sound.textContent='Activer le son';selection.textContent='Touche « Activer le son » pour autoriser les sons du combat.';});};
  activePanel.addEventListener('pointerdown',audio,{capture:true});
  sound.onclick=()=>{const api=(activeFrame.contentWindow as StarWindow).openbwCrossover;api?.setMuted?.(!api.audioState?.().muted);audio();updateSound();};
  const updateSound=():void=>{const muted=(activeFrame.contentWindow as StarWindow).openbwCrossover?.audioState?.().muted??false;sound.textContent=muted?'Son coupé':'Son activé';sound.setAttribute('aria-pressed',String(!muted));sound.setAttribute('aria-label',muted?'Activer les sons du combat':'Couper les sons du combat');};
  const roster=panel.querySelector<HTMLElement>('#crossover-roster')!,cards=new Map<number,{button:HTMLButtonElement;count:HTMLElement}>();
  let ready=false,chosen:number|undefined;
  for(const row of plan.stacks.filter(row=>row.side===0)){
   const button=doc.createElement('button');button.className='army-card';button.dataset.crossoverGroup=String(row.id);button.type='button';button.disabled=true;button.setAttribute('aria-pressed','false');
   const count=doc.createElement('strong'),name=doc.createElement('span');count.textContent=String(row.count);name.textContent=row.name;button.append(count,name);roster.append(button);cards.set(row.id,{button,count});
   button.onclick=()=>canvas.dispatchEvent(new CustomEvent('crossover-select-group',{detail:row.id}));
  }
  const enemy=doc.createElement('div');enemy.className='army-card enemy';const enemyCount=doc.createElement('strong'),enemyName=doc.createElement('span');enemyCount.textContent=String(plan.stacks.filter(row=>row.side===1).reduce((sum,row)=>sum+row.count,0));enemyName.textContent='Ennemis · '+[...new Set(plan.stacks.filter(row=>row.side===1).map(row=>row.name))].join(', ');enemy.append(enemyCount,enemyName);roster.append(enemy);
  const updateSelection=():void=>{for(const [id,{button}] of cards)button.setAttribute('aria-pressed',String(chosen!==undefined&&(chosen<0||chosen===id)));attack.disabled=stop.disabled=!ready||chosen===undefined;};
  canvas.addEventListener('crossover-selection',event=>{const data=(event as CustomEvent).detail;chosen=data.id;selection.dataset.feedback=attack.getAttribute('aria-pressed')==='true'?'armed':'';selection.textContent=data.name+(attack.getAttribute('aria-pressed')==='true'?' · choisis une cible.':'');updateSelection();});
  canvas.addEventListener('crossover-order-issued',event=>{attack.setAttribute('aria-pressed','false');attack.textContent='Avancer et attaquer';selection.dataset.feedback='confirmed';const kind=canvas.dataset.orderFeedback;if(!start.hidden&&(kind==='attack'||kind==='move')){audio();(activeFrame.contentWindow as StarWindow).openbwCrossover!.start();start.hidden=true;}selection.textContent=(event as CustomEvent).detail;});
  all.onclick=()=>canvas.dispatchEvent(new Event('crossover-select-all'));
  attack.onclick=()=>{const active=attack.getAttribute('aria-pressed')!=='true';attack.setAttribute('aria-pressed',String(active));attack.textContent=active?'Choisir un point':'Avancer et attaquer';selection.dataset.feedback=active?'armed':'';canvas.dispatchEvent(new CustomEvent('crossover-command-mode',{detail:active?'attack':'move'}));selection.textContent=active?'Touche un point du terrain pour avancer en attaquant. Un ennemi se cible directement.':'Choisis un point où déplacer la sélection.';};
  stop.onclick=()=>canvas.dispatchEvent(new Event('crossover-stop-selection'));
  start.onclick=()=>{audio();try{(frame!.contentWindow as StarWindow).openbwCrossover!.start();start.hidden=true;}catch(e){status.textContent=String(e);}};
  panel.querySelector<HTMLButtonElement>('#crossover-cancel')!.onclick=()=>{cancelled.add(activePlan.battleId);command(2,activePlan.battleId);closePanel();hint('Combat repris dans Heroes, sans appliquer les pertes du test annulé.');};
  void (async()=>{
   try{
    const sc=await prepared;if(!sc.openbwLaunchCrossover)throw Error('Chargement de StarCraft incomplet.');
    await sc.openbwLaunchCrossover(activePlan);
    const sounds=win.goonkCrossoverSounds;if(sounds?.battleId===activePlan.battleId&&sounds.rows.length)await sc.openbwCrossover!.prepareCreatureSounds?.(sounds.rows);
    if(disposed||panel!==activePanel||frame!==activeFrame||plan!==activePlan)return;
    if(timer!==undefined)win.clearInterval(timer);progress.hidden=true;status.textContent='Prêt · contrôle manuel';ready=true;start.disabled=all.disabled=sound.disabled=false;updateSound();
    for(const {button} of cards.values())button.disabled=false;
    sceneDispose=sharedField(win,canvas,sc.openbwCrossover!,activePlan);
    await new Promise<void>(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(()=>resolve())));
    if(panel!==activePanel)return;panel.hidden=false;
    timer=win.setInterval(()=>{
     try{
      const native=sc.openbwCrossover?.battle();if(!native)return;
      start.disabled=all.disabled=native.finished;ready=!native.finished;updateSelection();
      const message=native.finished?'Résultat transmis à Heroes…':native.frame===0?'Prêt · contrôle manuel':`Combat en cours · ${Math.floor(native.frame*0.042)} s`;if(status.textContent!==message)status.textContent=message;
      let opponents=0;for(const group of native.groups){const card=cards.get(group.id);if(card){if(card.count.textContent!==String(group.survivors))card.count.textContent=String(group.survivors);card.button.disabled=group.survivors===0||native.finished;}else if(group.side===1)opponents+=group.survivors;}
      if(enemyCount.textContent!==String(opponents))enemyCount.textContent=String(opponents);
      if(native.finished&&!sent){const rows=battleResult(activePlan,native as BattleState);sent=true;command(1,activePlan.battleId,rows);win.dispatchEvent(new CustomEvent('goonk-crossover-submitted',{detail:{version:1,plan:structuredClone(activePlan),result:structuredClone(native)}}));}
     }catch(e){status.textContent=String(e);}
    },200);
   }catch(e){activePanel.hidden=false;progress.hidden=true;status.textContent=String(e)+' Tu peux reprendre le combat classique.';}
  })();
 };
 const observe=(event:Event):void=>{
  const state=(event as CustomEvent).detail;if(!state||disposed)return;latestMode=state.mode;latestOnline=!!state.onlineGame;latestTurn=!!state.turn;mountControls();
  demo.disabled=!assetsReady||!!state.onlineGame||trial||state.mode!=='menu';
  menuDemo.hidden=toggle.hidden=state.mode!=='map';menuDemo.disabled=!assetsReady||!!state.onlineGame||checkpoint||!state.turn;
  toggle.disabled=!!state.onlineGame||!state.turn;menuDemo.textContent=isDemo?'Rejouer la démo':'Démo Heroes × StarCraft';
  if(state.mode==='menu'){configured=false;cancelled.clear();if(!trial)isDemo=false;}
  if(state.mode==='load')isDemo=false;
  if(trial&&state.mode==='menu'&&!starting){starting=true;win.Module?._vcmiMobileCommand?.(20,1,0,0,0,0);}
  if(trial&&state.mode==='lobby'&&state.lobbyReady&&!selected){selected=true;win.setTimeout(()=>{if(!disposed)win.Module?._vcmiMobileCommand?.(111,0,0,0,0,0);},0);}
  if(trial&&selected&&state.mode==='lobby'&&state.selectedMap==='Crossover - duel StarCraft'&&state.lobbyReady){selected=false;trial=false;autoAttack=true;win.Module?._vcmiMobileCommand?.(22,0,0,0,0,0);}
  if(state.mode==='map'&&state.turn&&!configured){try{command(0,enabled?1:0);configured=true;}catch(e){hint(String(e));}}
  if(autoAttack&&state.mode==='map'&&state.turn&&state.crossoverEnabled){autoAttack=false;win.Module?._vcmiMobileCommand?.(112,0,0,0,0,0);}
  if(state.crossover){try{begin(state.crossover);}catch(e){hint(String(e));}}
  else if(plan&&(state.dialogKind==='battle-result'||state.mode==='map'||state.mode==='dialog')){if(sent)hint('Bilan du combat reçu. Confirme-le pour reprendre l’aventure.');closePanel();}
 };
 const startDemo=():void=>{closeMenu();trial=true;isDemo=true;starting=false;selected=false;hint('Ouverture de la démo…');};
 const persisted=(event:Event):void=>{const detail=(event as CustomEvent).detail;if(!checkpoint||!String(detail?.path).toLowerCase().endsWith('/avant-demo-starcraft.vsgm1'))return;checkpoint=false;if(detail.ok){startDemo();win.Module?._vcmiMobileCommand?.(71,0,0,0,0,0);}else hint('Sauvegarde impossible : ton aventure reste ouverte.');};
 const checkpointReply=(event:Event):void=>{if(checkpoint&&!(event as CustomEvent).detail.accepted){checkpoint=false;hint('Attends la fin du déplacement, puis relance la démo.');}};
 const demoAction=():void=>{if(!assetsReady){hint('StarCraft se prépare avant la partie…');return;}if(!latestMode||latestMode==='menu')startDemo();else if(latestMode==='map'&&!checkpoint){if(isDemo){startDemo();win.Module?._vcmiMobileCommand?.(71,0,0,0,0,0);}else{checkpoint=true;hint('Sauvegarde de ton aventure avant la démo…');win.Module?._vcmiMobileCommand?.(113,0,0,0,0,0);}}};
 const click=(event:Event):void=>{const button=(event.target as Element).closest?.<HTMLButtonElement>('button[data-crossover-action]');if(!button||button.disabled)return;event.preventDefault();event.stopImmediatePropagation();if(button.dataset.crossoverAction==='demo')demoAction();else{enabled=!enabled;command(0,enabled?1:0);toggle.textContent=`Combats en temps réel : ${enabled?'activés':'désactivés'}`;toggle.setAttribute('aria-pressed',String(enabled));}};
 doc.addEventListener('click',click,true);win.addEventListener('goonk-mobile-mounted',mountControls);win.addEventListener('goonk-save-persisted',persisted);win.addEventListener('goonk-crossover-checkpoint',checkpointReply);win.addEventListener('goonk-crossover-demo',demoAction);win.addEventListener('goonk-state',observe);mountControls();void prepareEngine().catch(()=>{});
 return()=>{disposed=true;delete win.goonkCrossoverInstalled;doc.removeEventListener('click',click,true);win.removeEventListener('goonk-mobile-mounted',mountControls);win.removeEventListener('goonk-save-persisted',persisted);win.removeEventListener('goonk-crossover-checkpoint',checkpointReply);win.removeEventListener('goonk-crossover-demo',demoAction);win.removeEventListener('goonk-state',observe);closePanel();warmFrame?.remove();if(settingsButton)doc.querySelector('#mobile-app .mobile-top')?.prepend(settingsButton);for(const node of [demo,menuDemo,toggle,mainStatus,menuStatus,style])node.remove();};
}
