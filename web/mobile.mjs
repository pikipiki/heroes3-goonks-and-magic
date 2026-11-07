import {plainGameText} from './game-text.mjs';
import {deleteSoloAutosave} from './runtime-scheduling.mjs';
import {isVisibleScenario,savedGameTitle,scenarioTitle} from './scenario-title.mjs';
import {createOnlineLogin} from './online-login.mjs';
import {createOnlineLobby} from './online-lobby.mjs';
import {createMarketplace} from './marketplace.mjs';
import{createLobbyChoices}from'./lobby-choices.mjs';
import{createHeroTransition,opensMobileWindow}from'./hero-transition.mjs';
import{hasHDCreaturePortrait}from'./goonk-hd-portraits.mjs';
import {createBattleAutocombat} from './battle-autocombat.mjs';
import {createCampaignSetup} from './campaign-setup.mjs';
import {createHeroEquipment} from './hero-equipment.mjs';
import {createHeroExchange} from './hero-exchange.mjs';
import {canCancelSpell,createSpellTargetingRecovery,spellTargetCell} from './spell-targeting.mjs';
import {heroMovementSummary,watchHeroMovement} from './hero-movement.mjs';
import {createMenuLaunch,restartLaunchURL} from './menu-launch.mjs';
import {touchGeometry,sameTouchGeometry,localPointer} from './touch-geometry.mjs';
import {createLobbyOptions} from './lobby-options.mjs';
import {getLanguage} from './i18n.mjs';
import {creaturePortrait,paintCreaturePortraits} from './creature-portraits.mjs';
import {createMobileSpellbook} from './spellbook.mjs';
import {createMageGuild} from './mage-guild.mjs';
import {createActionFeedback} from './action-feedback.mjs';
import {renderArmyPanel} from './army-panel.mjs';
import {canViewWeeklyRecruits,createGameCalendar} from './game-calendar.mjs';
import {createWeeklyRecruits} from './weekly-recruits.mjs';
import {recruitmentSummary} from './recruitment-summary.mjs';
import {createCanvasSizer} from './mobile-render.mjs';
import {createNativeFort} from './town-recruitment.mjs';
import {protectBattleControls} from './battle-controls.mjs';
import {paintBattleFloor} from './battle-floor.mjs';
import {createBattleDirector,paintBattleAction} from './battle-director.mjs';
import {battleGuidance,paintActiveCreature,paintShotTargets,paintMeleeTargets,paintSpellTargets} from './battle-guidance.mjs';
import {createBattleDualView,fitBattleDetail} from './battle-dual-view.mjs';
import {createCreaturePresentation} from './creature-presentation.mjs';
import {paintMapOverview,mapOverviewTarget,mapOverviewViewport} from './map-overview.mjs';
import {anchorMobileViewport,coalesceViewportResize,createMapPan,enableFullscreenOnPlay} from './mobile-viewport.mjs';
import {canCloseTavern} from './native-dialog.mjs';
import {createMobileTavern} from './mobile-tavern.mjs';
import {renderResources} from './resources.mjs';
import {createTownPortrait,isGoonkTown,supportsTownPortrait} from './town-portrait.mjs';
import {createTownBuildingMenu} from './town-building-menu.mjs';
import {battleCapabilities,battleTeamCapabilities} from './battle-phase.mjs';
import {bindPress,protectTouchClicks} from './mobile-press.mjs';
import {fitNativeBattle,nativeBattleClose,paintMovementRange,paintBattleGrid,battleFocus,drawUnit,NATIVE_BATTLE_REGION} from './battle-scene.mjs';
import {installAutosave} from './autosave.mjs';
import {fitRegion,fitTown,scenePoint,mapDrag,battleHex} from './mobile-layout.mjs';
import {isMobileLayout} from './mobile-render.mjs';
isMobileLayout();
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const homeMenu = '<h1>Le royaume des Goonks</h1><p>Une aventure au bout des doigts.<br>Explore, construis et mène tes peluches au combat.</p><button class="primary" data-action="20">Nouvelle aventure</button><button data-action="23">Charger une partie</button><button data-action="47">Mode campagne</button>';
function mount(){
 installAutosave();
 if(!window.goonkMobileActive)return;document.documentElement.classList.add('goonk-mobile');
 const root=document.createElement('section');root.id='mobile-app';root.dataset.mode='menu';root.setAttribute('aria-label','Heroes Goonk tactile');root.innerHTML=`<header class="mobile-top"><span class="mobile-brand">GOONK</span><div class="mobile-title">Préparation de l’aventure</div><div class="mobile-resources" hidden></div><button class="battle-view" data-ui="battle-view" aria-label="Changer la vue du combat" hidden>Vue entière</button><div class="battle-team-actions" role="group" aria-label="Commandes de l’équipe" hidden><button data-ui="battle-auto" aria-pressed="false">▶ Autocombat</button><button data-ui="battle-retreat">Retraite</button></div><button class="hero-mobile-switch" data-ui="hero-mobile">Vue mobile</button><button class="recruit-close" data-ui="cancel-recruit" aria-label="Fermer le recrutement" hidden>✕</button></header><main class="mobile-play"><canvas id="mobile-scene" aria-label="Scène de jeu tactile"></canvas><div class="scene-tools"><button data-ui="zoom-out" aria-label="Dézoomer">−</button><button data-ui="zoom-in" aria-label="Zoomer">+</button><button data-ui="overview" aria-label="Vue d’ensemble">Vue</button><button data-ui="center" class="map-center" aria-label="Recentrer sur le héros">◎ Héros</button><button data-ui="center-town" class="map-castle" aria-label="Recentrer sur le château">♜ Château</button></div><section class="battle-panel" hidden><canvas id="battle-creature-detail" width="128" height="128" aria-label="Créature sélectionnée" hidden></canvas><h2 class="battle-turn"></h2><p class="battle-selection" aria-live="polite"></p><div class="battle-tools"><button data-ui="battle-magic">Magie</button><button data-ui="creature-spell" hidden>Ability</button></div><div class="battle-unit-list"></div><section class="battle-precision" hidden><canvas id="battle-detail" width="264" height="264" aria-label="Loupe de la case choisie"></canvas><div class="battle-arrows"><button data-battle-step="-22,-42" aria-label="Case en haut à gauche">↖</button><button data-battle-step="22,-42" aria-label="Case en haut à droite">↗</button><button data-battle-step="-44,0" aria-label="Case à gauche">←</button><button data-battle-step="44,0" aria-label="Case à droite">→</button><button data-battle-step="-22,42" aria-label="Case en bas à gauche">↙</button><button data-battle-step="22,42" aria-label="Case en bas à droite">↘</button></div></section></section><nav class="recruit-choices" aria-label="Créatures à recruter" hidden></nav><section class="mobile-recruit-amount" hidden><label>Quantité <input id="recruit-number" aria-label="Quantité à recruter" type="number" min="0" step="1"></label><input id="recruit-range" aria-label="Ajuster le recrutement" type="range" min="0" step="1"><p class="recruit-summary"></p></section><canvas id="mobile-overview" width="192" height="130" aria-label="Vue d’ensemble du champ de bataille" hidden></canvas><p class="scene-hint" aria-live="polite"></p><button class="town-view" data-ui="town-view" hidden>Vue entière</button><section id="town-overview" hidden></section><div class="mobile-menu"></div></main><nav class="mobile-nav" aria-label="Actions du jeu"></nav><section class="mobile-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" hidden><header class="sheet-head"><button data-ui="sheet-back">← Back</button><h2 id="sheet-title"></h2><button data-ui="close-sheet" aria-label="Fermer le panneau">✕</button></header><div class="sheet-body"></div></section><div class="toast-mobile" role="status" hidden></div>`;document.body.append(root);
 anchorMobileViewport(root);
 enableFullscreenOnPlay();
 const updateCalendar=createGameCalendar(root);
 const viewButton=root.querySelector('[data-ui="overview"]');
 let viewLabel='Vue';
 function syncViewButton(){
  const label=state.mode==='map'?(state.worldView?'Quitter la vue':zoom===1?'Vue large':'Vue normale'):'Vue';
  if(viewLabel===label)return;
  viewLabel=label;
  viewButton.textContent=label;
  viewButton.setAttribute('aria-label',state.mode==='map'?label:'Vue d’ensemble');
 }
 const original=document.querySelector('#canvas'),scene=root.querySelector('#mobile-scene'),ctx=scene.getContext('2d'),overview=root.querySelector('#mobile-overview'),overviewCtx=overview.getContext('2d');
 const sceneSize=createCanvasSizer();
 const landscapeMap=matchMedia('(orientation:landscape) and (max-height:600px)');
 const nav=root.querySelector('.mobile-nav'),sheet=root.querySelector('.mobile-sheet'),body=root.querySelector('.sheet-body'),menu=root.querySelector('.mobile-menu');
 const weeklyRecruits=createWeeklyRecruits(body);
 function showHomeMenu(){
  menu.dataset.kind='menu';
  menu.innerHTML=homeMenu+'<button type="button" data-open-multiplayer>Multijoueur</button>';
  const multiplayer=menu.querySelector('[data-open-multiplayer]');
  multiplayer.hidden=!(window.goonkOnlineConfigured||window.goonkHostedAlerts);
  bindPress(multiplayer,showMultiplayerMenu);
  return multiplayer;
 }
 function showMultiplayerMenu(){
  menu.dataset.kind='multiplayer';
  menu.innerHTML='<h1 tabindex="-1">Multijoueur</h1><button type="button" data-action="75">Appareil de l’hôte</button><button type="button" data-open-hosted-match>Serveur dédié</button><button type="button" data-multiplayer-back>Retour</button>';
  menu.querySelector('[data-action="75"]').hidden=!window.goonkOnlineConfigured;
  const hosted=menu.querySelector('[data-open-hosted-match]');
  hosted.hidden=!window.goonkHostedAlerts;
  bindPress(hosted,()=>window.dispatchEvent(new Event('goonk-open-hosted-match')));
  bindPress(menu.querySelector('[data-multiplayer-back]'),()=>showHomeMenu().focus());
  menu.querySelector('h1').focus({preventScroll:true});
 }
 showHomeMenu();
 const lobbyOptions=createLobbyOptions({menu,getState:()=>state,command:(...args)=>command(...args),onChange:next=>update(next||state,true)});
 const lobbyChoices=createLobbyChoices({menu,getState:()=>state,isScenarioPending:()=>!!requestedMapName});
 const battleControls=protectBattleControls(root);
 let pendingAuto=null,deletingSoloAutosave=false;
 let navHTML='',state={mode:'menu'},mode='',zoom=1,focus=null,layout,paintedGeometry=null,region,lastFrame=0,selectedPoint=null,gesture=null,initialDistance=0,sheetKind='',armySelection=null,armySignature='',armyPending=false,armyTimer=null,armyFocus=null,splitAmount=0,pointers=new Map(),previousFocus,pendingRecruit=null,townArmy=[],recruitChoices=[],activeRecruitLevel=0,recruitLoading=false,expectedRecruitId=null,battleTab='enemies',battleMove=false,battleView='whole',battleCamera=null,requestedMapName=null,lobbyDefaultRequested=false,pendingFaction=null,pendingDifficulty=null,townWhole=false,townPortraitEnabled=true,detailReturn='';
 const effectiveBattle=()=>pendingAuto===true?{...state,autoCombat:true}:state;
 const feedback=createActionFeedback(root);
 const launchStatus=document.createElement('section');launchStatus.className='menu-launch-status';launchStatus.hidden=true;launchStatus.setAttribute('role','status');root.querySelector('.mobile-play').append(launchStatus);
 function renderLaunch(value){const active=!!value;for(const button of root.querySelectorAll('.mobile-menu [data-action]')){button.disabled=active;if(active&&!value.failed&&Number(button.dataset.action)===value.action)button.setAttribute('aria-busy','true');else button.removeAttribute('aria-busy');}if(!value){launchStatus.hidden=true;delete launchStatus.dataset.phase;return;}launchStatus.hidden=false;const phase=value.action+':'+value.failed;if(launchStatus.dataset.phase===phase)return;launchStatus.dataset.phase=phase;launchStatus.innerHTML=value.failed?'<h2>Game options did not open</h2><p>The game is not responding. Restart to try again. Your local saves and downloaded game files will be kept.</p><button data-ui="restart-launch">Restart and try again</button>':'<p>Opening game options…</p><progress aria-label="Opening game options"></progress>';}
 const launch=createMenuLaunch({onChange:value=>{if(value?.failed)feedback.clear();renderLaunch(value);}});setInterval(()=>{if(!document.hidden)launch.tick();},500);
 const command=(a,b=0,c=0,d=0,e=0,f=0)=>{if(!launch.begin(a,state.mode))return;feedback.begin(a,state);if(opensMobileWindow(a,b))heroTransition.begin(state.mode);window.Module?._vcmiMobileCommand?.(a,b,c,d,e,f);};
 const autocombat=createBattleAutocombat({command,onChange:value=>{pendingAuto=value;renderBattlePanel();controls();},onError:message=>notify(message)});
 const battleStance=action=>{
  if(!battleCapabilities(effectiveBattle()).combatReady||!Number.isInteger(state.activeStack)||(action===12&&state.canWait===false))return;
  selectedPoint=null;
  command(action,state.activeStack,state.round);
 };
 const spellRecovery=createSpellTargetingRecovery({command:(action,value=0)=>{if(action===44)autocombat.request(state,!!value);else if(action===12||action===13)battleStance(action);else command(action,value);},onChange:()=>{renderBattlePanel();controls();},onError:message=>notify(message)});
 setInterval(()=>{spellRecovery.update(state);autocombat.update(state);},250);
 const cancelSpell=(action=null,value=0)=>{selectedPoint=null;battleMove=false;if(sheetKind)closeSheet();return spellRecovery.request(state,action,value);};
 const pointer=(p,action=0)=>window.Module?._vcmiMobilePointer?.(p.x,p.y,action);
 const touches=protectTouchClicks(root,{context:()=>state.mode+':'+sheetKind+':'+state.heroId+':'+state.activeStack});
 const mapPan=createMapPan(d=>window.Module?._vcmiMobilePan?.(d.x,d.y));
 const notify=text=>{const box=root.querySelector('.toast-mobile');box.textContent=text;box.hidden=false;clearTimeout(box.timer);box.timer=setTimeout(()=>box.hidden=true,2800);};
 const director=createBattleDirector(),cameraMotion=matchMedia('(prefers-reduced-motion: reduce)');let battleDetailScale=1,battleSession=false;
 const dualBattle=createBattleDualView({root,scene,getState:effectiveBattle,getView:()=>battleView,onFocus:(point,unit)=>{
  if(sheetKind)return;
  director.explore(point);selectedPoint=null;focus=point;battleCamera={...point};
  if(unit&&(unit.stackId!==state.activeStack||state.spellTargeting))selectBattlePoint({x:unit.x,y:unit.y});
  renderBattlePanel();controls();
 }});
 let assetEntries=null;const assetLookup=new Map();
 const asset=icon=>{if(!icon)return '';const entries=window.goonkAssetURLs||[];if(entries!==assetEntries){assetEntries=entries;assetLookup.clear();}const key=icon.toLowerCase();if(assetLookup.has(key))return assetLookup.get(key);const match=entries.find(e=>e.path.toLowerCase().endsWith('/sprites2x/'+key))||entries.find(e=>e.path.toLowerCase().endsWith('/sprites/'+key));const url=match?.url||'';assetLookup.set(key,url);return url;};
 const creatureView=createCreaturePresentation({root,command,pointer,openRecruit,buildingArt:(state,building)=>townBuildings.artURL(state,building),openBuildings:(id,name,unitId)=>townBuildings.open({id,name,unitId})});
 const spellbook=createMobileSpellbook({root,command});
 const mageGuild=createMageGuild({root,command,pointer,asset,resetView:()=>{zoom=1;focus=null;resetGestures();}});
 const campaignSetup=createCampaignSetup({root,command});
 const heroEquipment=createHeroEquipment({root,command,onViewChange:()=>controls()});
 const tavern=createMobileTavern({root,command,pointer});
 const nativeFort=createNativeFort({root,getState:()=>state,pointer});
 const portraitTown=createTownPortrait({root,scene,asset,command,getState:()=>state});
 const portrait=unit=>{if(hasHDCreaturePortrait(unit))return creaturePortrait(unit);const url=asset(unit?.icon);return url?`<img data-native-portrait="${Number(unit.id)}" src="${escape(url)}" alt="${escape(unit.name)}">`:creaturePortrait(unit);};
 const heroExchange=createHeroExchange({root,command,refresh:controls,portrait});
 root.addEventListener('error',event=>{const image=event.target;if(image.matches?.('img[data-native-portrait]')){const holder=document.createElement('span');holder.innerHTML=creaturePortrait({id:Number(image.dataset.nativePortrait),name:image.alt});image.replaceWith(holder.firstElementChild);}},true);
 const btn=(text,ui,primary=false,disabled=false)=>`<button data-ui="${ui}" ${disabled?'disabled':''} class="${primary?'primary':''}">${text}</button>`;
 const paintHeroMovement=watchHeroMovement(nav);
 const onlineLogin=createOnlineLogin(root,command);
 const onlineLobby=createOnlineLobby(root,command);
 const turnLimits=[0,1,2,3,5,10];
 function controls(){
  const m=state.mode,cap=battleCapabilities(effectiveBattle()),target=(state.battleUnits||[]).find(u=>selectedPoint&&Math.hypot(u.x-selectedPoint.x,u.y-selectedPoint.y)<16),blocked=!state.spellTargeting&&target?.enemy&&target.canShootAt===false&&target.canMeleeAt===false;let items;
  if(m==='map')items=[heroMovementSummary(state,getLanguage()),btn('➤ Marcher','move',true,!state.hasPath||!state.turn),btn('<span aria-hidden="true">⛨ </span>Équipement','heroes',false,!state.heroName&&!state.heroes?.length),btn('♜ Villes','towns'),btn('♟ Armée','army',false,!state.turn||!state.armies?.length),...(state.turn&&state.exchangePartners?.length?[btn('<span aria-hidden="true">⇄ </span>Échanger','hero-exchange',true)]:[]),btn('☀ Terminer le tour','endturn',false,!state.turn)];
  else if(m==='online-lobby'&&(state.onlineCanCreate||state.onlineInvitation)){
   const fr=getLanguage()==='fr';
   items=[...(state.onlineCanCreate?[btn(fr?'Créer une partie':'Create game','online-create',!state.onlineInvitation)]:[]),
    ...(state.onlineInvitation?[btn((fr?'Invitation de ':'Invitation from ')+escape(state.onlineInvitation),'online-invitation',true)]:[]),
    btn('↩ Back','back')];
  }
  else if(m==='online-lobby'&&state.onlineMatch){
   const fr=getLanguage()==='fr', minutes=state.onlineTurnMinutes||0;
   const timerLabel=(fr?'Chrono':'Turn timer')+' · '+(minutes?minutes+' min':fr?'désactivé':'off');
   items=[...(state.onlineHost&&!state.onlineLoading?[btn(fr?'Choisir un scénario':'Choose a scenario','online-scenario',false,!state.onlineRoomLimit),btn(timerLabel,'online-timer',false,!state.selectedMap)]:[]),
    ...(state.onlineHost&&state.onlineLoading&&state.onlineSaveAvailable?[btn(fr?'Dernière partie en ligne':'Last online save','online-save')]:[]),
    ...(state.onlineHost?[btn(state.onlineLoading?(fr?'Reprendre':'Resume game'):(fr?'Commencer':'Start game'),'begin',true,!state.selectedMap||(state.onlineLoading&&!state.onlineCanResume))]:[]),
    btn('↩ Back','back')];
  }
  else if(m==='market')items=[btn('Mobile view','market-mobile'),btn('↩ Back','market-back')];
  else if(m==='hero-exchange')items=heroExchange.classic?[btn('Vue mobile','exchange-mobile'),btn('Fermer l’échange','exchange-close'),btn('＋ Zoom','zoom-in'),btn('− Zoom','zoom-out')]:[];
  else if(m==='hero')items=[btn('↩ Back','hero-back'),btn('＋ Zoom','zoom-in'),btn('− Zoom','zoom-out')];
  else if(m==='fort'||m==='creature')items=[btn('↩ Back','presentation-back')];
  else if(canCloseTavern(state))items=[];
  else if(m==='dialog'&&state.dialogKind==='fort')items=[btn('Retour au château','back')];
  else if(m==='dialog'&&state.dialogKind==='commander')items=[btn('↩ Back','presentation-back'),btn('＋ Zoom','zoom-in'),btn('− Zoom','zoom-out')];
  else if(m==='dialog'&&state.dialogKind==='commander-level-up'){
   const fr=getLanguage()==='fr';
   items=[btn(fr?'✓ Valider la compétence':'✓ Confirm skill','accept',true),btn('＋ Zoom','zoom-in'),btn('− Zoom','zoom-out')];
  }
  else if(m==='town')items=[['Carte','back','town-exit'],['Recruter des héros','recruit-heroes','town-fort'],['Armées','army','town-split'],['Construire','build','town-hall']].map(([label,ui,icon])=>`<button data-ui="${ui}" class="town-action"><img src="./web/h3-theme/${icon}.png" alt=""><span>${label}</span></button>`);
  else if(m==='battle'&&cap.tactics)items=[btn('✓ Placer','target',true,!selectedPoint||!cap.move),btn('⚔ Combattre','end-tactics',false,!cap.endTactics),btn('Troupes','tactic-units',false,!cap.endTactics),btn('Suivante','next-tactics',false,!cap.endTactics)];
  else if(m==='battle')items=[btn(state.spellTargeting?'✓ Confirmer le sort':target?.enemy?(target.canShootAt?'✓ Confirm shot':'✓ Confirm attack'):'✓ Confirmer','target',true,blocked||!selectedPoint||!cap.move||!!spellRecovery.pending||(state.spellTargeting&&!spellTargetCell(state,selectedPoint))||(battleMove&&state.focus&&Math.hypot(selectedPoint.x-state.focus.x,selectedPoint.y-state.focus.y)<2)),btn('◎ Cibles','targets',false,!cap.move||!!spellRecovery.pending),btn(state.canWait===false?'Déjà attendu':'◷ Attendre','wait',false,state.canWait===false||!(cap.combatReady||cap.targeting)||!!spellRecovery.pending),btn('⛨ Défendre','defend',false,!(cap.combatReady||cap.targeting)||!!spellRecovery.pending)];
  else if(m==='recruit')items=[btn('Recruter','confirm-recruit',true,!state.turn||recruitLoading||!(state.recruitAmount>0)),btn('Tout','max-recruit',false,!(state.recruitMaximum>0)),btn('Annuler','cancel-recruit')];
  else if(m==='campaign')items=[btn('Back','back')];
  else if(m==='lobby')items=[btn('▶ Commencer','begin'),btn('✓ Valider','accept'),btn('↩ Retour','back')];
  else items=[btn('✓ Valider','accept',true),btn('↩ Retour','back'),btn('＋ Zoom','zoom-in'),btn('− Zoom','zoom-out')];
  if(m==='online-lobby'&&onlineLobby.classic)(items ||= []).push(btn(getLanguage()==='fr'?'Vue mobile':'Mobile view','online-mobile'));
  if(['menu','lobby','load','campaign','spellbook','mage-guild','connecting','online-login'].includes(m))items=[];
  const heroScroll=nav.querySelector('.hero-movement-list')?.scrollLeft||0;
  const html=items.join('');if(navHTML!==html){
   const template=document.createElement('template');template.innerHTML=html;
   const next=[...template.content.children],current=[...nav.children];
   if(next.length===current.length&&next.every((button,i)=>button.dataset.ui===current[i].dataset.ui)){
    next.forEach((button,i)=>{const old=current[i];old.disabled=button.disabled;old.className=button.className;if(old._sourceMarkup!==button.innerHTML){old._sourceMarkup=button.innerHTML;old.innerHTML=button.innerHTML;}});
   }else nav.replaceChildren(...next);
   navHTML=html;
  }const presentationBack=nav.querySelector('[data-ui=presentation-back]');if(presentationBack&&!presentationBack.dataset.directPress)bindPress(presentationBack,()=>command(43));feedback.paint();const heroList=nav.querySelector('.hero-movement-list');if(heroList)heroList.scrollLeft=heroScroll;paintHeroMovement();
 }
 const marketplace=createMarketplace({root,command,refresh:controls});
 function update(next,refresh=false){
  if(!refresh&&lobbyOptions.observe(next))return;
  if(feedback.starting&&next.mode==='menu')return;feedback.observe(next);launch.observe(next);
  if(!['battle','dialog'].includes(next.mode))battleSession=false;
  if(next.mode!=='lobby'){lobbyDefaultRequested=false;pendingFaction=null;pendingDifficulty=null;}else{if(next.selectedFaction===pendingFaction)pendingFaction=null;if(next.difficulty===pendingDifficulty)pendingDifficulty=null;}
  if(['town','fort'].includes(next.mode)){
   const slots=next.armies?.[0]?.slots||[];
   if(pendingRecruit&&slots.filter(u=>u?.id===pendingRecruit.id).reduce((n,u)=>n+u.count,0)>=pendingRecruit.before+pendingRecruit.amount){notify('Recrutement confirmé : '+pendingRecruit.amount+' '+pendingRecruit.name+' dans la garnison');pendingRecruit=null;}
   townArmy=slots;recruitChoices=[...new Map((next.recruits||[]).map(u=>[u.level,u])).values()];
  }
  if(next.mode==='recruit'&&state.mode==='dialog')pendingRecruit=null;
  if(next.mode==='recruit'&&next.recruitUnit?.id===expectedRecruitId)recruitLoading=false;
  const changedTurn=next.turn!==state.turn,changedActor=next.activeStack!==state.activeStack,changedPhase=!!next.tacticsMode!==!!state.tacticsMode;const change=next.mode!==state.mode;const changedSpell=!!next.spellTargeting!==!!state.spellTargeting;state=next;if(changedSpell){selectedPoint=null;battleMove=false;}spellRecovery.update(state);autocombat.update(state);root.dataset.mode=state.mode;window.goonkMobileState=state;if(state.mode==='map'&&!state.heroName&&state.heroes?.length&&state.turn)command(4,0);
  root.querySelector('.mobile-title').textContent=(state.mode==='creature'?state.creatureUnit?.name:null)||state.dialogTitle||(state.mode==='battle'&&state.autoCombat?'Autocombat':null)||(state.mode==='recruit'?'Recruter '+(state.recruitUnit?.name||''):null)||state.townName||state.activeUnit?.name||state.heroName||({menu:'Le royaume des Goonks',lobby:'Préparer la partie',dialog:'Votre décision','hero-exchange':'Échange entre héros'}[state.mode])||'Heroes Goonk';
  const hasResources=renderResources(root.querySelector('.mobile-resources'),state.resources,state.resourceTypes);root.dataset.hasResources=String(hasResources&&!['battle','hero','hero-exchange'].includes(state.mode));updateCalendar(state,sheetKind==='weekly-recruits');
  menu.hidden=!['menu','lobby','load','campaign','connecting'].includes(state.mode);
  if(state.mode==='connecting'&&menu.dataset.kind!=='connecting'){menu.dataset.kind='connecting';menu.innerHTML='<h1>Opening game options</h1><p>Preparing your game…</p>';}
  if(['lobby','load'].includes(state.mode)&&menu.dataset.kind!==state.mode){menu.dataset.kind=state.mode;menu.innerHTML='<div class="lobby-scroll"><header class="lobby-intro"><img src="./web/h3-theme/town-fort.png" alt=""><div><p class="lobby-eyebrow">Heroes Goonk</p><h1>Ton aventure</h1><p id="lobby-choice" aria-live="polite">Choisis la carte et la difficulté.</p></div></header><section class="lobby-panel lobby-adventure"><h2>Adventure settings</h2><div class="lobby-panel-body"><label>Carte<select id="mobile-map-select" aria-label="Carte"></select></label><label class="faction-choice">Château<select id="mobile-faction-select" aria-label="Château"></select></label><label>Difficulté<select id="mobile-difficulty" aria-label="Difficulté"><option value="0">Facile</option><option value="1" selected>Normale</option><option value="2">Difficile</option><option value="3">Expert</option><option value="4">Impossible</option></select></label></div></section><div class="lobby-extra-options"></div></div><footer class="lobby-footer"><button type="button" data-delete-solo-autosave hidden>Supprimer la sauvegarde automatique</button><p class="lobby-status" aria-live="polite"></p><div><button data-ui="back">← Back</button><button class="primary" data-ui="begin">Commencer</button></div></footer>';menu.querySelector('#mobile-map-select').onchange=e=>{lobbyDefaultRequested=true;requestedMapName=(state.maps||[]).find(m=>m.index===Number(e.target.value))?.name;e.target.disabled=true;e.target.dataset.updating='true';menu.querySelector('[data-ui=begin]').disabled=true;command(state.mode==='load'?27:24,Number(e.target.value));update(state,true);};menu.querySelector('#mobile-difficulty').onchange=e=>{pendingDifficulty=Number(e.target.value);e.target.disabled=true;e.target.dataset.updating='true';menu.querySelector('[data-ui=begin]').disabled=true;command(25,pendingDifficulty);};menu.querySelector('#mobile-faction-select').onchange=e=>{pendingFaction=Number(e.target.value);e.target.disabled=true;e.target.dataset.updating='true';menu.querySelector('[data-ui=begin]').disabled=true;command(37,pendingFaction);update(state,true);};}
  if(['lobby','load'].includes(state.mode)){const factionSelect=menu.querySelector('#mobile-faction-select');factionSelect.parentElement.hidden=state.mode==='load'||!(state.factions?.length);const factionsHTML=(state.allowRandomFaction?'<option value="-1">Aléatoire</option>':'')+(state.factions||[]).map(f=>`<option value="${f.id}">${escape(f.name)}</option>`).join('');if(factionSelect._sourceMarkup!==factionsHTML){factionSelect._sourceMarkup=factionsHTML;factionSelect.innerHTML=factionsHTML;}if(document.activeElement!==factionSelect)factionSelect.value=String(pendingFaction??state.selectedFaction);factionSelect.disabled=lobbyOptions.pending||pendingFaction!==null||!state.lobbyReady;factionSelect.dataset.updating=String(pendingFaction!==null);if(document.activeElement!==menu.querySelector('#mobile-difficulty')&&state.difficulty!==undefined)menu.querySelector('#mobile-difficulty').value=String(pendingDifficulty??state.difficulty);menu.querySelector('#mobile-difficulty').disabled=lobbyOptions.pending||pendingDifficulty!==null||!state.lobbyReady;menu.querySelector('#mobile-difficulty').dataset.updating=String(pendingDifficulty!==null);menu.querySelector('h1').textContent=state.mode==='load'?'Reprendre la partie':'Ton aventure';menu.querySelector('#mobile-difficulty').parentElement.hidden=state.mode==='load';const select=menu.querySelector('#mobile-map-select');
   const maps=state.mode==='load'?(state.maps||[]):(state.maps||[]).filter(isVisibleScenario);
   const mapOptions=maps.map(m=>`<option value="${m.index}">${escape(state.mode==='load'?savedGameTitle(m):scenarioTitle(m.name))}</option>`).join('');
   if(document.activeElement!==select&&select._sourceMarkup!==mapOptions){select._sourceMarkup=mapOptions;select.innerHTML=mapOptions;}
   const selected=state.mode==='load'?maps.find(m=>m.index===state.selectedIndex):maps.find(m=>m.name===state.selectedMap);
   if(document.activeElement!==select){
    const pending=maps.find(m=>m.name===requestedMapName);
    select.value=String(pending?.index??(!state.customMap?selected?.index:undefined)??'');
   }
   const deleteSave=menu.querySelector('[data-delete-solo-autosave]');
   deleteSave.hidden=state.mode!=='load'||!/^saves[\\/]goonk-auto(?:\.vsgm1)?$/i.test(selected?.file||'');
   deleteSave.disabled=deletingSoloAutosave;
   deleteSave.onclick=async()=>{
    if(deletingSoloAutosave||!window.confirm(getLanguage()==='fr'?'Supprimer cette sauvegarde automatique ?':'Delete this autosave?'))return;
    deletingSoloAutosave=true;
    update(state,true);
    try{
     await deleteSoloAutosave(window.Module);
     location.replace(restartLaunchURL(location.href,23));
    }catch{
     deletingSoloAutosave=false;
     update(state,true);
     window.alert(getLanguage()==='fr'?'Impossible de supprimer cette sauvegarde.':'Could not delete this autosave.');
    }
   };
   const choice=menu.querySelector('#lobby-choice'),mapLabel=state.mode==='load'?(savedGameTitle(selected)||state.selectedMap):scenarioTitle(state.selectedMap),choiceText=mapLabel||'Choisis la carte et la difficulté.';
   if(choice._sourceText!==choiceText){choice._sourceText=choiceText;choice.textContent=choiceText;}
   const hiddenSelection=state.mode==='lobby'&&!isVisibleScenario({name:state.selectedMap});
   if(!lobbyOptions.pending&&state.mode==='lobby'&&state.lobbyReady&&!state.customMap&&!lobbyDefaultRequested){
    const preferred=maps.find(map=>map.width===144&&map.castleChoice);
    if(preferred||!state.mapsLoading){lobbyDefaultRequested=true;const map=preferred||((!state.selectedMap||hiddenSelection)&&maps[0]);if(map&&map.name!==state.selectedMap){requestedMapName=map.name;command(24,map.index);}}
   }
   if(requestedMapName===state.selectedMap)requestedMapName=null;factionSelect.disabled ||= !!requestedMapName;select.disabled=deletingSoloAutosave||lobbyOptions.pending||!!requestedMapName||pendingFaction!==null||!state.lobbyReady;select.dataset.updating=String(!!requestedMapName);menu.querySelector('[data-ui=begin]').disabled=deletingSoloAutosave||lobbyOptions.pending||!state.lobbyReady||!state.selectedMap||hiddenSelection||!!requestedMapName||pendingFaction!==null||pendingDifficulty!==null;const start=menu.querySelector('[data-ui=begin]');start.textContent=state.mode==='load'?'Load game':'Start adventure';const status=menu.querySelector('.lobby-status'),statusText=lobbyOptions.pending?'Preparing custom map…':lobbyOptions.error||(start.disabled?'Updating game settings…':mapLabel+' · Ready to play');if(status._sourceText!==statusText){status._sourceText=statusText;status.textContent=statusText;}menu.querySelector('.lobby-footer [data-ui=back]').disabled=deletingSoloAutosave||lobbyOptions.pending;menu.querySelector('.lobby-adventure h2').textContent=state.mode==='load'?'Saved game':'Adventure settings';}
  if(state.mode==='campaign'){if(menu.dataset.kind!=='campaign'){menu.dataset.kind='campaign';menu.innerHTML='<h1>Campaigns</h1><p>Choose a campaign.</p><div class=campaign-list></div>'+btn('Back','back');}const list=menu.querySelector('.campaign-list'),key=JSON.stringify(state.campaigns||[]);if(list._key!==key){list._key=key;list.innerHTML=(state.campaigns||[]).map(c=>`<button data-campaign="${c.index}">${escape(c.name)}</button>`).join('')||'<p>No compatible campaigns are installed.</p>';}}
  lobbyOptions.update(state,!!requestedMapName||pendingFaction!==null);lobbyChoices.update(state);renderLaunch(launch.pending);
  if(state.mode==='menu'&&!['menu','multiplayer'].includes(menu.dataset.kind))showHomeMenu();
  if(state.mode==='menu'&&menu.dataset.kind==='menu'){
   menu.querySelector('[data-open-multiplayer]').hidden=!(window.goonkOnlineConfigured||window.goonkHostedAlerts);
  }
  // Keep the army sheet on screen until the creature presentation is ready.
  if(change&&state.mode==='creature'&&sheetKind==='army')detailReturn='army';
  if(change){if(!['lobby','load'].includes(state.mode))requestedMapName=null;mode=state.mode;if(mode==='battle'){if(!battleSession){window.goonkBattleSpriteBounds=[];command(15);battleCamera=null;battleView='whole';}battleSession=true;}if(mode==='town')townWhole=true;selectedPoint=null;zoom=1;focus=null;if(sheetKind)closeSheet();}
  if(state.mode==='battle'&&(change||changedActor||changedPhase)){selectedPoint=null;battleMove=false;const actor=battleGuidance(state).actor;if(actor){focus=state.focus||actor;battleCamera={...focus};}}
  tavern.update(state);
  root.querySelector('.recruit-close').hidden=state.mode!=='recruit';
  creatureView.update(state);spellbook.update(state);mageGuild.update(state);heroEquipment.update(state);heroExchange.update(state);campaignSetup.update(state);marketplace.update(state);onlineLogin.update(state);onlineLobby.update(state);
  if(detailReturn==='army'&&['map','town'].includes(state.mode)){detailReturn='';showList('army');}
  const choices=root.querySelector('.recruit-choices');choices.hidden=true;

  const amountBox=root.querySelector('.mobile-recruit-amount');amountBox.hidden=state.mode!=='recruit';
  if(state.mode==='recruit'){for(const input of amountBox.querySelectorAll('input')){input.max=state.recruitMaximum||0;input.disabled=recruitLoading||!(state.recruitMaximum>0);if(document.activeElement!==input)input.value=state.recruitAmount||0;}const summary=amountBox.querySelector('.recruit-summary'),text=recruitmentSummary(state);summary.setAttribute('aria-live','polite');if(summary.textContent!==text)summary.textContent=text;}
  root.dataset.battleView='native';root.querySelector('.battle-view').hidden=state.mode!=='battle';syncBattleView();overview.hidden=!['map','town'].includes(state.mode)||(state.mode==='town'&&root.dataset.townLayout==='portrait');if(state.mode==='map'){overview.setAttribute('aria-label','Vue d’ensemble de la carte. Flèches pour déplacer la vue.');overview.setAttribute('role','group');overview.tabIndex=0;}else{overview.removeAttribute('role');overview.removeAttribute('tabindex');}root.querySelector('.map-center').disabled=!state.heroName;root.querySelector('.map-castle').disabled=!state.towns?.length;renderBattlePanel();
  const townOverview=root.querySelector('#town-overview');townOverview.hidden=state.mode!=='town';
  root.querySelector('.town-view').hidden=state.mode!=='town';
  if(state.mode==='town'){overview.hidden=false;overview.setAttribute('aria-label','Town overview');const shortcuts=[['town-fort','Recruitment hall','town-fort'],['town-guild','Mage guild','town-fort'],['town-market','Marketplace','resource-gold']];const html=`<div class="town-recruit-strip" aria-label="Town buildings">${shortcuts.map(([ui,name,icon])=>`<button data-ui="${ui}"><img src="${ui==='town-guild'?(asset('goonk/structure-mageGuild1.png')||'./web/h3-theme/'+icon+'.png'):'./web/h3-theme/'+icon+'.png'}" alt=""><span>${name}</span></button>`).join('')}</div>`;if(townOverview._sourceMarkup!==html){townOverview._sourceMarkup=html;townOverview.innerHTML=html;}}


  
  const hint=state.mode==='recruit'?'Choisis la quantité, puis confirme. Les recrues rejoignent la garnison.':state.mode==='map'?(!state.turn?'Tour adverse en cours…':state.hasPath?`Trajet choisi${state.pathTurns?' · '+state.pathTurns+' jour(s)':''}. Confirme avec Marcher.`:state.exchangePartners?.length?'Utilise Échanger pour transférer des objets ou des troupes.':'Touche une case ou un château pour préparer un trajet. Ouvre tes châteaux avec Villes.'):state.mode==='battle'?(state.targetUnit?`${state.targetUnit.name} × ${state.targetUnit.count} — Confirme ton action.`:'Glisse pour voir le champ de bataille. Touche une case, puis confirme.'):state.mode==='town'?'Construis et recrute avec les commandes ci-dessous.':'Pince pour zoomer. Glisse pour atteindre les commandes.';
  const seconds=Math.ceil(Math.max(0,state.turnRemainingMs||0)/1000);
  const countdown=state.mode==='map'&&state.turnRemainingMs!==undefined
   ? Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+' · ' : '';
  root.querySelector('.scene-hint').textContent=countdown+hint;controls();if(sheetKind==='army'&&(changedTurn||armySignature!==JSON.stringify(state.armies||[])))refreshArmy();if(sheetKind==='build')townBuildings.update(state);if(sheetKind==='weekly-recruits')weeklyRecruits.update(state);
  if(!refresh&&state.mode==='town'&&state.openTownHall)void townBuildings.open();
 }
 const townBuildings=createTownBuildingMenu({body,getState:()=>state,asset,backButton:sheet.querySelector('[data-ui="sheet-back"]'),canOpen:route=>state.mode===(route?'fort':'town')&&!sheetKind,
  openSheet,closeSheet,command,notify});
 const heroTransition=createHeroTransition(update,{ready:next=>portraitTown.prepare(next,townPortraitEnabled)});
 window.addEventListener('goonk-state',event=>{
  const next=event.detail;
  if(next.mode==='town')townBuildings.warm(next);else if(next.mode!=='fort')townBuildings.cancel(['menu','lobby','load'].includes(next.mode));
  heroTransition.receive(next,state.mode);
 });
 const enable=()=>{if(window.Module?._vcmiMobileEnable){window.Module._vcmiMobileEnable(1);return true;}return false;};
 const ready=setInterval(()=>{enable();if(window.goonkMobileState)clearInterval(ready);},250);
 function resetGestures(){touches.cancel();battleControls.cancel();mapPan.cancel();for(const id of pointers.keys()){try{if(scene.hasPointerCapture(id))scene.releasePointerCapture(id);}catch{}}pointers.clear();gesture=null;initialDistance=0;selectedPoint=null;layout=null;paintedGeometry=null;}
 function syncBattleView(){dualBattle.sync();const button=root.querySelector('.battle-view'),text=nativeBattleClose(scene.clientWidth,scene.clientHeight,battleView)?'Vue entière':'Rapprocher';if(button.textContent!==text)button.textContent=text;const pressed=String(battleView==='whole');if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);if(root.dataset.battleCamera!==battleView)root.dataset.battleCamera=battleView;}
 bindPress(root.querySelector('.battle-view'),()=>{if(state.mode!=='battle')return;const chosen=selectedPoint;battleView=nativeBattleClose(scene.clientWidth,scene.clientHeight,battleView)?'whole':'close';resetGestures();selectedPoint=chosen;syncBattleView();renderBattlePanel();controls();});
 function closeSheet(){
  const weekly=sheetKind==='weekly-recruits';
  const route=sheetKind==='build'?townBuildings.cancel():null;
  clearTimeout(armyTimer);armyPending=false;armyFocus=null;sheet.removeAttribute('aria-busy');sheet.hidden=true;sheetKind='';delete root.dataset.sheet;armySelection=null;
  resetGestures();
  if(weekly){command(88,0);updateCalendar(state);}
  const restore=()=>{
   if(sheetKind)return;
   root.querySelector('.mobile-play').inert=false;nav.inert=false;
   if(route&&state.mode==='fort')creatureView.focusHallUnit(route.unitId);
   else if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  };
  // Let the touch release finish before the revealed creature cards accept focus.
  if(weekly||route&&state.mode==='fort')requestAnimationFrame(restore);else restore();
 }
 bindPress(sheet.querySelector('[data-ui="close-sheet"]'),closeSheet);
 bindPress(sheet.querySelector('[data-ui="sheet-back"]'),()=>{if(sheetKind!=='build'||!townBuildings.back())closeSheet();});
 function openRecruit(level){if(!recruitChoices.length){notify('Aucune recrue disponible dans les logements construits.');return;}resetGestures();activeRecruitLevel=level??recruitChoices[0].level;expectedRecruitId=recruitChoices.find(u=>u.level===activeRecruitLevel)?.id;recruitLoading=true;root.querySelector('#recruit-number').blur();controls();if(state.mode==='recruit')command(33);command(30,activeRecruitLevel);}

 function openSheet(kind,title){previousFocus=document.activeElement;resetGestures();root.querySelector('.mobile-play').inert=true;nav.inert=true;sheetKind=kind;root.dataset.sheet=kind;sheet.hidden=false;root.querySelector('#sheet-title').textContent=title;body.innerHTML='';root.querySelector('[data-ui="close-sheet"]').focus({preventScroll:true});}
 function refreshArmy(){
  clearTimeout(armyTimer);armyPending=false;sheet.removeAttribute('aria-busy');
  const scroll=body.scrollTop,focused=document.activeElement,army=armyFocus?.army??focused?.dataset.army,slot=armyFocus?.slot??focused?.dataset.slot;armyFocus=null;
  body.replaceChildren();showList('army',true);body.scrollTop=scroll;
  if(army!==undefined&&slot!==undefined)body.querySelector('[data-army="'+army+'"][data-slot="'+slot+'"]')?.focus({preventScroll:true});
 }
 root.addEventListener('goonk-recruit-all',()=>{if(!state.turn)return;openSheet('recruit-all','Recruit all creatures');body.innerHTML='<p>Recruit all available creatures you can afford, using the highest available upgrades? They will join the garrison. Army space and resource costs still apply.</p>'+btn('Recruit all','confirm-recruit-all',true)+btn('Cancel','close-sheet');});
 function showList(kind,refresh=false){
  if(kind==='towns'&&state.towns?.length===1){command(5,state.towns[0].index);return;}
  if(kind==='heroes'){if(state.mode==='map'&&(state.heroName||state.heroes?.length)){closeSheet();if(!state.heroName)command(4,state.heroes[0].index);command(55);}else notify('Select a hero on the map first.');return;}
  if(kind==='heroes'||kind==='towns'){openSheet(kind,kind==='heroes'?'Tes héros':'Tes villes');for(const item of state[kind]||[]){const el=document.createElement('button');el.className='mobile-card';el.style.width='100%';el.textContent=item.name+(kind==='heroes'?` · ${item.movement} points`:'');el.onclick=()=>{command(kind==='heroes'?4:5,item.index);closeSheet();};body.append(el);}if(!body.children.length)body.textContent='Aucun élément disponible.';}
  if(kind==='build'&&state.mode==='town'){void townBuildings.open();return;}
  if(kind==='recruit'){openRecruit();return;}


  if(kind==='equipment'){if(state.mode==='map'&&state.heroName){closeSheet();command(55);}else notify('Select a hero on the map first.');return;}
  if(kind==='army'){if(!refresh)openSheet(kind,'Organiser les armées');armySelection=null;armySignature=JSON.stringify(state.armies||[]);
   renderArmyPanel({body,armies:state.armies||[],portrait,showVisitorPlaceholder:state.mode==='town'||Number.isInteger(state.armyTownId),readOnly:!state.turn,onTransferAll:(from,to)=>{command(58,from,to);armyPending=true;sheet.setAttribute('aria-busy','true');clearTimeout(armyTimer);armyTimer=setTimeout(()=>{if(sheetKind==='army'&&armyPending){refreshArmy();notify('Aucun changement confirmé. Vérifie les emplacements disponibles.');}},8000);},onInfo:(army,slot)=>{if(!heroTransition.pending)command(41,army,slot);}, onMessage:notify,onMove:({fromArmy,fromSlot,toArmy,toSlot,amount})=>{
    command(amount?11:10,fromArmy,fromSlot,toArmy,toSlot,amount);armyFocus={army:String(toArmy),slot:String(toSlot)};armyPending=true;sheet.setAttribute('aria-busy','true');clearTimeout(armyTimer);
    armyTimer=setTimeout(()=>{if(sheetKind==='army'&&armyPending){refreshArmy();notify('Aucun changement confirmé. Vérifie la destination et réessaie.');}},8000);
   }});
  }
 }
 for(const input of root.querySelectorAll('.mobile-recruit-amount input'))input.addEventListener('input',()=>{const value=Number(input.value);if(Number.isInteger(value)&&value>=0&&value<=state.recruitMaximum){for(const other of root.querySelectorAll('.mobile-recruit-amount input'))if(other!==input)other.value=value;command(31,value);}});
 function renderBattlePanel(){
  const panel=root.querySelector('.battle-panel');root.querySelector('#battle-creature-detail').hidden=false;panel.hidden=state.mode!=='battle';const team=root.querySelector('.battle-team-actions');team.hidden=panel.hidden;if(panel.hidden)return;
  const teamCap=battleTeamCapabilities(state),auto=team.querySelector('[data-ui=battle-auto]');team.querySelector('[data-ui=battle-retreat]').disabled=!teamCap.retreat||pendingAuto!==null||!!spellRecovery.pending;auto.disabled=!teamCap.auto||pendingAuto!==null||!!spellRecovery.pending;auto.setAttribute('aria-pressed',String(!!state.autoCombat));auto.setAttribute('aria-busy',String(pendingAuto!==null||spellRecovery.pending?.action===44));auto.setAttribute('aria-label',state.autoCombat?'Arrêter l’autocombat':'Activer l’autocombat');auto.textContent=spellRecovery.pending?.action===44?'Activation…':pendingAuto!==null?(pendingAuto?(state.canQueueAutoCombat?'Autocombat en attente…':'Activation…'):'Arrêt…'):state.autoCombat?'■ Arrêter l’auto':'▶ Autocombat';
  const cap=battleCapabilities(effectiveBattle()),guidance=battleGuidance(effectiveBattle()),range=guidance.ready?guidance.cells.length+' case'+(guidance.cells.length===1?'':'s')+' accessible'+(guidance.cells.length===1?'':'s')+'. ':'',target=(state.battleUnits||[]).find(u=>selectedPoint&&Math.hypot(u.x-selectedPoint.x,u.y-selectedPoint.y)<16),shown=target||state.activeUnit;
  panel.querySelector('.battle-turn').textContent=state.autoCombat?'Autocombat':cap.tactics?(shown?'À placer · '+shown.name+' × '+shown.count:'Placement des troupes'):shown?shown.name+' × '+shown.count+(state.spellTargeting?'':shown.shooter?' · Ranged':' · Melee'):'Préparation du combat';
  const shotHint=guidance.shotTargets.length?'Viseur bleu : tir sans déplacement. ':'';
  const meleeHint=guidance.meleeTargets?.length?'Épées dorées : ennemis à portée de frappe. ':'';
  const healHint=guidance.beneficialTargets?.length?'Croix verte : alliés pouvant recevoir un soin ou sort bénéfique. ':'';
  const spellSides=[];
  if(guidance.spellTargets.some(u=>!u.enemy)||guidance.beneficialTargets?.length)spellSides.push('+ Alliés');
  if(guidance.spellTargets.some(u=>u.enemy))spellSides.push('◇ Ennemis');
  const spellHint=(state.selectedSpell||'Spell')+' · '+(spellSides.length?spellSides.join(' · '):
   (state.battleCells||[]).every(c=>c.spellTarget===false)?'No valid target.':'Choose a valid target, then confirm.');
  panel.querySelector('.battle-selection').textContent=pendingAuto===true&&!state.autoCombat?'Autocombat dès que ta troupe peut jouer.':spellRecovery.pending?'Cancelling spell…':state.spellTargeting?spellHint :state.autoCombat?'L’ordinateur joue pour ton équipe. Arrête l’auto en haut pour reprendre la main.':state.manualControl===false?'Returning to manual control…':cap.tactics?(cap.endTactics?range+'Touche une case dorée, puis « Placer ». La troupe reste sélectionnée.':'Placement en cours de validation ou de préparation…'):!cap.combatReady?'Tour '+(state.round??1)+' · Animation ou tour adverse…':target?.enemy?(guidance.shotTargets.includes(target)?'Tir sans déplacement. Confirme pour tirer.':state.activeUnit?.shooter?'Melee attack · Target cannot be shot from here.':'Melee attack · Confirm to strike.'):selectedPoint&&battleMove?'Déplacement préparé · Confirme pour marcher.':shotHint+meleeHint+healHint+'Tour '+(state.round??1)+' · '+range+'Choisis une case dorée ou une cible.'+(state.heroSpellCastLimitReached?' Hero magic returns next round.':'');
  const magicButton=panel.querySelector('[data-ui=battle-magic]');magicButton.textContent=spellRecovery.pending?'Cancelling…':canCancelSpell(state)?'✕ Cancel spell':'Magie';magicButton.setAttribute('aria-label',canCancelSpell(state)?'Cancel selected spell':'Magie');
  const description=guidance.ready?`Créature active : ${guidance.actor.name} × ${guidance.actor.count}. ${guidance.cells.length} cases accessibles. ${shotHint}${meleeHint}${healHint}`.trim():state.spellTargeting?spellHint:'Champ de bataille';if(scene.getAttribute('aria-label')!==description)scene.setAttribute('aria-label',description);
  const creatureSpell=panel.querySelector('[data-ui=creature-spell]');
  creatureSpell.hidden=!state.creatureCanCast||!cap.combatReady||state.spellTargeting;
  creatureSpell.textContent=state.activeUnit?.commander?(getLanguage()==='fr'?'Sort du commandant':'Commander spell'):(getLanguage()==='fr'?'Sort de la créature':'Creature spell');
  const precision=panel.querySelector('.battle-precision');precision.hidden=!selectedPoint;precision.classList.toggle('battle-preview-only',!battleMove);precision.querySelector('.battle-arrows').hidden=!battleMove;
  const list=panel.querySelector('.battle-unit-list');list.hidden=battleMove;
  for(const button of panel.querySelectorAll('.battle-tools button')){button.setAttribute('aria-pressed',String(button.dataset.ui==='battle-'+(battleMove?'move':battleTab)));button.disabled=button.dataset.ui==='battle-magic'?!!spellRecovery.pending||(!canCancelSpell(state)&&(!cap.magic||!state.heroHasSpellbook||state.heroCanCast===false)):button.dataset.ui==='battle-move'?!cap.move:button.dataset.ui==='battle-retreat'?!cap.combatReady||state.canRetreat===false:false;}for(const button of panel.querySelectorAll('[data-battle-step]')){const [dx,dy]=button.dataset.battleStep.split(',').map(Number),base=selectedPoint||state.focus||{x:300,y:300},candidate={x:base.x+dx,y:base.y+dy},snapped=battleHex(candidate);button.disabled=!state.canAct||Math.hypot(candidate.x-snapped.x,candidate.y-snapped.y)>1;}
  const html=(state.battleUnits||[]).filter(u=>(battleTab==='allies'?!u.enemy:u.enemy)&&(!state.spellTargeting||spellTargetCell(state,u))).map(u=>`<button class="battle-unit" data-battle-target="${u.x},${u.y}" ${!battleCapabilities(effectiveBattle()).move?'disabled':''} aria-pressed="${!!selectedPoint&&Math.hypot(u.x-selectedPoint.x,u.y-selectedPoint.y)<16}"><canvas width="90" height="90" data-unit-preview="${u.x},${u.y}" aria-hidden="true"></canvas><span>${escape(u.name)}<small>× ${u.count}</small>${battleTargetBadge(u,guidance)}</span></button>`).join('');if(list._sourceMarkup!==html){list._sourceMarkup=html;list.innerHTML=html;}
 }
 function battleTargetBadge(unit,guidance){
  if(guidance.spellTargets.includes(unit))return unit.enemy
   ?'<small class="spell-enemy-indicator">◇ Sort · Ennemi</small>'
   :'<small class="spell-ally-indicator">+ Sort · Allié</small>';
  if(guidance.beneficialTargets?.includes(unit))return '<small class="spell-ally-indicator">+ Soin / Bénéfique</small>';
  if(guidance.shotTargets.includes(unit))return '<small class="ranged-indicator">◎ Tir sans déplacement</small>';
  if(guidance.meleeTargets?.includes(unit))return '<small class="melee-indicator">⚔ À portée d’épée</small>';
  return '';
 }
 function showBattleTargets(){
  const guidance=battleGuidance(effectiveBattle());
  if(state.tacticsMode)battleTab='allies';
  const spell=state.spellTargeting;
  openSheet('battle-targets',spell?(getLanguage()==='fr'?'Choisir la cible du sort':'Choose a spell target'):state.tacticsMode?'Choisir une troupe à placer':battleTab==='allies'?'Choisir un allié':'Choisir un adversaire');
  const list=document.createElement('div');list.className='battle-unit-list';
  if(!spell&&!state.tacticsMode)body.insertAdjacentHTML('beforeend',btn('Adversaires','battle-enemies')+btn('Alliés','battle-allies'));
  const targets=(state.battleUnits||[]).filter(u=>spell?spellTargetCell(state,u):battleTab==='allies'?!u.enemy:u.enemy);
  list.innerHTML=targets.map(u=>`<button class="battle-unit" data-battle-target="${u.x},${u.y}" ${!battleCapabilities(effectiveBattle()).move?'disabled':''}><canvas width="90" height="90" data-unit-preview="${u.x},${u.y}" aria-hidden="true"></canvas><span>${escape(u.name)}<small>× ${u.count}</small>${battleTargetBadge(u,guidance)}</span></button>`).join('');
  if(spell&&!targets.length)list.textContent=getLanguage()==='fr'?'Aucune troupe ne peut recevoir ce sort.':'No unit can receive this spell.';
  body.append(list);
 }
 function paintBattlePreviews(){const active=(state.battleUnits||[]).find(u=>selectedPoint&&Math.hypot(u.x-selectedPoint.x,u.y-selectedPoint.y)<16)||(state.battleUnits||[]).find(u=>u.stackId===state.activeStack)||(state.battleUnits||[]).find(u=>u.id===state.activeUnit?.id)||(state.battleUnits||[]).find(u=>!u.enemy),detail=root.querySelector('#battle-creature-detail'),dc=detail.getContext('2d');dc.clearRect(0,0,128,128);if(active)drawUnit(dc,active,window.goonkBattleAtlas,window.goonkBattleAtlasIds,64,64,124);const atlas=window.goonkBattleAtlas,ids=window.goonkBattleAtlasIds;for(const canvas of root.querySelectorAll('[data-unit-preview]')){const [x,y]=canvas.dataset.unitPreview.split(',').map(Number),unit=(state.battleUnits||[]).find(u=>u.x===x&&u.y===y),c=canvas.getContext('2d');c.clearRect(0,0,90,90);if(unit)drawUnit(c,unit,atlas,ids,45,45,88);}if(selectedPoint){const unit=(state.battleUnits||[]).find(u=>Math.hypot(u.x-selectedPoint.x,u.y-selectedPoint.y)<16),canvas=root.querySelector('#battle-detail'),c=canvas.getContext('2d');c.clearRect(0,0,264,264);if(unit)drawUnit(c,unit,atlas,ids,132,132,250);}}
 root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled)return;if(button.dataset.heroIndex!==undefined){if(state.mode==='map'&&state.turn){selectedPoint=null;focus=null;resetGestures();command(4,Number(button.dataset.heroIndex));}return;}if(button.dataset.heroScroll!==undefined){const list=nav.querySelector('.hero-movement-list');list?.scrollBy({left:Number(button.dataset.heroScroll)*list.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}if(button.dataset.campaign!==undefined){command(52,Number(button.dataset.campaign));return;}if(button.dataset.action){command(Number(button.dataset.action));return;}if(button.dataset.battleTarget){if(sheetKind==='battle-targets')closeSheet();const [x,y]=button.dataset.battleTarget.split(',').map(Number);if(state.tacticsMode){selectedPoint=null;focus={x,y};pointer({x,y},1);return;}if(state.spellTargeting){selectBattlePoint({x,y});return;}selectedPoint={x,y};battleMove=false;focus={x,y};pointer(selectedPoint,0);renderBattlePanel();controls();return;}if(button.dataset.battleStep){const [x,y]=button.dataset.battleStep.split(',').map(Number),base=selectedPoint||state.focus||{x:300,y:300};selectedPoint=battleHex({x:base.x+x,y:base.y+y});focus=selectedPoint;pointer(selectedPoint,0);renderBattlePanel();controls();return;}if(button.dataset.recruitLevel!==undefined){openRecruit(Number(button.dataset.recruitLevel));return;}const ui=button.dataset.ui;if(ui==='restart-launch'&&launch.pending?.failed){button.disabled=true;location.assign(restartLaunchURL(location.href,launch.pending.action));return;}

  if(ui==='battle-enemies'||ui==='battle-allies'){battleMove=false;battleTab=ui.split('-')[1];showBattleTargets();return;}if(ui==='battle-move'){battleMove=true;selectedPoint=battleHex(state.focus||selectedPoint||{x:300,y:300});focus=selectedPoint;pointer(selectedPoint,0);renderBattlePanel();controls();return;}if(ui==='battle-magic'){if(canCancelSpell(state)){cancelSpell();return;}if(!battleCapabilities(effectiveBattle()).magic)return;if(!state.heroHasSpellbook||state.heroCanCast===false){notify('Your hero cannot cast a spell right now.');return;}command(14);return;}
  if(ui==='battle-auto'){if(canCancelSpell(state)){cancelSpell(44,1);return;}if(!battleTeamCapabilities(state).auto||pendingAuto!==null)return;autocombat.request(state,!state.autoCombat);return;}
  if(ui==='battle-retreat'||ui==='native-retreat'){if(canCancelSpell(state)&&state.canRetreat===true){cancelSpell(38);return;}if(!battleCapabilities(effectiveBattle()).combatReady||state.canRetreat===false)return;closeSheet();command(38);return;}
  if(['native-options','native-surrender'].includes(ui)){closeSheet();pointer({x:{'native-options':20,'native-retreat':125,'native-surrender':75}[ui],y:575},1);return;}
  if(ui==='creature-info'&&state.mode==='recruit'&&state.recruitUnit?.description){
   openSheet('creature-info',state.recruitUnit.name);
   const description=document.createElement('p');
   description.textContent=state.recruitUnit.description;
   body.append(description);
   return;
  }
  if(ui==='confirm-recruit-all'){closeSheet();if(!state.turn)return;command(53);notify('Recruitment requested.');return;}
  if(ui==='weekly-recruits'){
   if(!sheetKind&&canViewWeeklyRecruits(state)){
    openSheet('weekly-recruits','Recrues de la semaine');
    weeklyRecruits.open(state);
    updateCalendar(state,true);
    command(88,1);
   }
   return;
  }
  if(ui==='town-fort'){command(54);return;}
  if(ui==='town-guild'||ui==='town-market'){const matches=ui==='town-guild'?['mageGuild1','mageGuild2','mageGuild3','mageGuild4','mageGuild5']:['marketplace'];const building=(state.buildings||[]).filter(b=>b.built&&matches.includes(String(b.key).split(':').at(-1))).at(-1);if(building)command(39,building.id);else notify('Build this structure first.');return;}
  if(ui==='recruit-heroes'){
   const tavern=state.buildings?.find(b=>String(b.key).split(':').at(-1)==='tavern');
   if(state.mode==='town'&&tavern?.built)command(39,tavern.id);
   else notify(tavern?.state===2?'La taverne est interdite dans cette ville.':'Construis une taverne pour recruter des héros.');
   return;
  }
  if(ui==='online-mobile'){onlineLobby.show();return;}
  if(ui==='online-create'){command(81);return;}
  if(ui==='online-save'){command(80);return;}
  if(ui==='online-timer'){command(79,turnLimits[(turnLimits.indexOf(state.onlineTurnMinutes||0)+1)%turnLimits.length]);return;}
  if(ui==='online-invitation'){command(78);return;}
  if(ui==='online-scenario'){onlineLobby.openScenarios();return;}
  if(ui==='market-mobile'){marketplace.showMobile();return;}if(ui==='market-back'){command(74);return;}
  if(ui==='hero-exchange'){
   if(state.mode!=='map'||!state.turn||!state.exchangePartners?.length)return;
   const partners=state.exchangePartners;
   if(partners.length===1){command(91,partners[0].id);return;}
   openSheet('exchange-partner','Choisis un héros pour l’échange');
   for(const partner of partners){
    const choice=document.createElement('button');
    choice.type='button';choice.className='mobile-card';choice.textContent=partner.name;
    choice.addEventListener('click',()=>{
     closeSheet();
     if(state.turn&&state.exchangePartners?.some(candidate=>candidate.id===partner.id))command(91,partner.id);
    });
    body.append(choice);
   }
   return;
  }
  if(ui==='exchange-mobile'){heroExchange.showMobile();return;}
  if(ui==='exchange-close'){command(93);return;}
  if(ui==='hero-mobile'){heroEquipment.showMobile();return;}if(ui==='hero-back'){command(63);return;}
  if(ui==='native-equipment'){closeSheet();command(55);return;}
  if(['equipment','heroes','towns','build','recruit','army'].includes(ui))return showList(ui);
  if(ui==='confirm-recruit'){if(!state.turn||recruitLoading)return;const u=state.recruitUnit,amount=Number(root.querySelector('#recruit-number').value);if(!u||!Number.isInteger(amount)||amount<1||amount>state.recruitMaximum){notify('Choisis une quantité entre 1 et '+state.recruitMaximum);return;}pendingRecruit={id:u.id,name:u.name,amount,before:townArmy.filter(s=>s?.id===u.id).reduce((n,s)=>n+s.count,0)};command(31,amount);command(32);return;}if(ui==='max-recruit'){command(31,state.recruitMaximum||0);return;}if(ui==='cancel-recruit'){pendingRecruit=null;recruitLoading=false;expectedRecruitId=null;command(33);return;}
  if(ui==='presentation-back'){command(43);return;}if(ui==='close-sheet')return closeSheet();if(ui==='zoom-in'){zoom=Math.min(4,zoom*1.25);return;}if(ui==='zoom-out'){zoom=Math.max(.5,zoom/1.25);return;}if(ui==='overview'){
   if(state.mode==='map'&&state.worldView){zoom=1;focus=null;resetGestures();command(87);return;}
   zoom=state.mode==='map'?(zoom===1?.5:1):(zoom===1?2:1);focus=null;return;
  }
  if(ui==='wait'||ui==='defend'){
   const action=ui==='wait'?12:13;
   if(canCancelSpell(state))cancelSpell(action);else battleStance(action);
   return;
  }
  if(ui==='move'){command(2);selectedPoint=null;}if(ui==='target'&&selectedPoint&&!spellRecovery.pending&&battleCapabilities(effectiveBattle()).move){
   if(state.spellTargeting){
    const cell=spellTargetCell(state,selectedPoint);
    if(!cell)return;
    director.confirm(state,cell);selectedPoint=null;controls();
    command(14,3,cell.hex);
   }else{director.confirm(state,selectedPoint);pointer(selectedPoint,1);selectedPoint=null;}
   return;
  }if(ui==='spell')command(14);if(ui==='back')command(0);if(ui==='accept')command(1);if(ui==='demo'){command(21);notify('Carte Goonk choisie. Appuie sur Commencer.');}if(ui==='begin')command(22);
  if(ui==='end-tactics'&&battleCapabilities(effectiveBattle()).endTactics){selectedPoint=null;command(35);return;}if(ui==='next-tactics'&&battleCapabilities(effectiveBattle()).endTactics){selectedPoint=null;command(36);return;}if(ui==='tactic-units'&&battleCapabilities(effectiveBattle()).endTactics){battleTab='allies';showBattleTargets();return;}
  if(ui==='targets'){
   battleMove=false;
   battleTab='enemies';
   showBattleTargets();return;
  }if(ui==='cast-from-sheet'||ui==='creature-spell'){if(!battleCapabilities(effectiveBattle()).magic){closeSheet();notify('La magie est disponible après le placement, pendant ton tour.');return;}const creatureCast=ui==='creature-spell';closeSheet();command(14,creatureCast?1:0);return;}
  if(ui==='town-view'){if(supportsTownPortrait(state)&&root.clientWidth<root.clientHeight){townPortraitEnabled=!townPortraitEnabled;townWhole=!townPortraitEnabled;}else townWhole=!townWhole;focus=null;resetGestures();return;}if(ui==='center'){zoom=1;focus=null;resetGestures();command(6);if(sheetKind)closeSheet();}if(ui==='center-town'){if(state.mode==='map'&&state.towns?.length){zoom=1;focus=null;resetGestures();if(state.towns.length===1)command(56,state.towns[0].index);else{openSheet('town-focus','Choose a castle');for(const town of state.towns){const b=document.createElement('button');b.className='mobile-card';b.textContent=town.name;b.onclick=()=>{command(56,town.index);closeSheet();};body.append(b);}}}return;}if(ui==='save'&&state.mode==='map'&&state.turn){command(7);closeSheet();notify('Sauvegarde demandée : Goonk-mobile');}if(ui==='endturn'&&state.mode==='map'&&state.turn){command(3);return;}
 });
 sheet.addEventListener('keydown',event=>{if(event.key==='Escape'){closeSheet();event.stopPropagation();}if(event.key==='Tab'){const buttons=[...sheet.querySelectorAll('button:not(:disabled),input:not(:disabled)')];if(event.shiftKey&&document.activeElement===buttons[0]){buttons.at(-1)?.focus();event.preventDefault();}else if(!event.shiftKey&&document.activeElement===buttons.at(-1)){buttons[0]?.focus();event.preventDefault();}}});
 function getRegion(){if(state.mode==='map')return {x:6,y:6,w:598,h:550};if(state.mode==='town')return {x:0,y:0,w:800,h:374};if(state.mode==='battle')return NATIVE_BATTLE_REGION;return state.rect&&state.rect.w>0?state.rect:{x:0,y:0,w:800,h:600};}
 function selectBattlePoint(point){if(spellRecovery.pending)return;if(point.y<86||point.y>558||point.x<58||point.x>742){if(!state.spellTargeting)pointer(point,1);return;}if(!battleCapabilities(effectiveBattle()).move)return;const unit=(state.battleUnits||[]).find(u=>Math.abs(u.x-point.x)<25&&point.y>=u.y-58&&point.y<=u.y+16);if(state.spellTargeting){
   const cell=spellTargetCell(state,unit||point);
   selectedPoint=cell?{x:cell.x,y:cell.y}:null;
   battleMove=false;
   if(!cell)notify('This spell cannot target that unit or hex.');
   renderBattlePanel();controls();return;
  }if(state.tacticsMode&&unit){if(!unit.enemy)pointer({x:unit.x,y:unit.y},1);return;}selectedPoint=unit?{x:unit.x,y:unit.y}:battleHex(point);const cell=(state.battleCells||[]).find(c=>c.x===selectedPoint.x&&c.y===selectedPoint.y);if(unit?.enemy&&unit.canShootAt===false&&unit.canMeleeAt===false){selectedPoint=null;notify('Target out of range. Move closer before attacking.');return;}if(!unit&&cell&&!cell.reachable){selectedPoint=null;notify('Cette case est hors de portée ou bloquée.');return;}battleMove=!unit||unit.stackId===state.activeStack;pointer(selectedPoint,0);renderBattlePanel();controls();}
 scene.addEventListener('pointerdown',event=>{event.preventDefault();if(!sameTouchGeometry(scene,paintedGeometry))return;const local=localPointer(scene,event);if(!local)return;scene.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:local.x,y:local.y});if(pointers.size===2){const [a,b]=[...pointers.values()];initialDistance=Math.hypot(a.x-b.x,a.y-b.y);gesture=null;return;}gesture={startX:local.x,startY:local.y,x:local.x,y:local.y,time:Date.now(),moved:false,geometry:touchGeometry(scene)};});
 scene.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId))return;if(!sameTouchGeometry(scene,paintedGeometry)){resetGestures();return;}const local=localPointer(scene,event);if(!local)return;pointers.set(event.pointerId,{x:local.x,y:local.y});if(pointers.size===2){if(state.mode==='battle')return;const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(initialDistance>0)zoom=Math.max(.5,Math.min(4,zoom*distance/initialDistance));initialDistance=distance;return;}if(!gesture||!layout)return;const dx=local.x-gesture.x,dy=local.y-gesture.y;gesture.moved ||= Math.hypot(local.x-gesture.startX,local.y-gesture.startY)>9;gesture.x=local.x;gesture.y=local.y;if(gesture.moved){if(state.mode==='map')(()=>{const d=mapDrag(dx,dy,layout.scale);mapPan.add(d.x,d.y);})();else if((state.mode!=='town'||!townWhole)&&(state.mode!=='battle'||dualBattle.active||nativeBattleClose(scene.clientWidth,scene.clientHeight,battleView))){focus={x:(focus?.x??layout.x+layout.w/2)-dx/layout.scale,y:(focus?.y??layout.y+layout.h/2)-dy/layout.scale};if(state.mode==='battle'){battleCamera={...focus};director.explore(focus);}}}});
 scene.addEventListener('pointerup',event=>{pointers.delete(event.pointerId);initialDistance=0;if(!gesture||!layout||!sameTouchGeometry(scene,paintedGeometry)||!sameTouchGeometry(scene,gesture.geometry)){resetGestures();return;}const local=localPointer(scene,event);if(!local)return;const g=gesture;gesture=null;if(g.moved)return;let point=scenePoint(local.x,local.y,layout);if(!point)return;if(Date.now()-g.time>550){if(state.mode==='map')selectedPoint=null;pointer(point,2);setTimeout(()=>pointer(point,3),1700);return;}if(state.mode==='battle'){selectBattlePoint(point);}else if(state.mode==='map'){selectedPoint=point;pointer(point,4);}else pointer(point,1);});
 scene.addEventListener('pointercancel',event=>{pointers.delete(event.pointerId);gesture=null;initialDistance=0;});
 function centerMapOverview(point){
  if(!point)return;
  mapPan.cancel();focus=null;selectedPoint=null;pointer(point,5);
 }
 overview.addEventListener('pointerdown',event=>{const r=overview.getBoundingClientRect();if(state.mode==='map'){event.preventDefault();event.stopPropagation();const point=mapOverviewTarget(state.mapOverview,event.clientX-r.left-overview.clientLeft,event.clientY-r.top-overview.clientTop,overview.clientWidth,overview.clientHeight);centerMapOverview(point);return;}if(state.mode==='town'){townWhole=false;focus={x:(event.clientX-r.left)/r.width*800,y:187};return;}focus={x:(event.clientX-r.left)/r.width*800,y:45+(event.clientY-r.top)/r.height*510};if(zoom===1)zoom=2;});
 overview.addEventListener('keydown',event=>{if(state.mode!=='map')return;const steps={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]},step=steps[event.key];if(!step)return;event.preventDefault();event.stopPropagation();const area=mapOverviewViewport(state.mapOverview,layout,240,240);if(!area)return;const point=mapOverviewTarget(state.mapOverview,Math.max(0,Math.min(239,area.x+area.w/2+step[0])),Math.max(0,Math.min(239,area.y+area.h/2+step[1])),240,240);centerMapOverview(point);});
 function frame(time){requestAnimationFrame(frame);if(document.hidden||!original.width)return;if(heroTransition.frame())return;paintCreaturePortraits(root);if(spellbook.active||mageGuild.active||marketplace.active||onlineLogin.active||onlineLobby.active)return;if(campaignSetup.paint(original)){sceneSize.release(scene);layout=null;overview.hidden=true;return;}if(heroEquipment.paint(original)||heroExchange.paint(original)||creatureView.paint(original)){sceneSize.release(scene);layout=null;overview.hidden=true;return;}lastFrame=time;const tracking=director.frame(state,selectedPoint);dualBattle.sync();if(tavern.paint(original)||nativeFort.paint(original)){sceneSize.release(scene);layout=null;overview.hidden=true;return;}const w=scene.clientWidth,h=scene.clientHeight;if(!w||!h)return;const pixels=sceneSize.fit(scene,w,h,Math.min(devicePixelRatio||1,2));

  ctx.setTransform(pixels.x,0,0,pixels.y,0,0);if(portraitTown.paint(ctx,w,h,state,townPortraitEnabled)){layout=null;overview.hidden=true;const view=root.querySelector('.town-view');view.textContent='Vue classique';view.setAttribute('aria-pressed','true');return;}
  syncViewButton();
  region=getRegion();let z=zoom;if(state.mode==='map'){const base=Math.min(w/region.w,h/region.h);const scale=landscapeMap.matches?Math.max(w/region.w,h/region.h):Math.min(1.4,Math.max(.8,Math.min(w/320,h/420)));z=zoom*scale/base;}if(state.mode==='battle'){const target=battleView==='close'?tracking.focus:battleFocus(state,focus,battleCamera);if(!battleCamera)battleCamera={...target};else{const factor=cameraMotion.matches?1:.28;battleCamera.x+=(target.x-battleCamera.x)*factor;battleCamera.y+=(target.y-battleCamera.y)*factor;}}layout=state.mode==='battle'?((dualBattle.active||battleView==='close')?(()=>{const next=fitBattleDetail(w,h,battleCamera,tracking.points);battleDetailScale+=(next.scale-battleDetailScale)*(cameraMotion.matches?1:.18);return fitBattleDetail(w,h,battleCamera,tracking.points,battleDetailScale);})():fitNativeBattle(w,h,battleCamera,battleView)):state.mode==='town'?fitTown(w,h,focus,townWhole):fitRegion(w,h,region,state.mode==='battle'?1:z,state.mode==='battle'?null:focus);ctx.setTransform(pixels.x,0,0,pixels.y,0,0);ctx.clearRect(0,0,w,h);const sx=original.width/800,sy=original.height/600;ctx.drawImage(original,layout.x*sx,layout.y*sy,layout.w*sx,layout.h*sy,layout.dx,layout.dy,layout.w*layout.scale,layout.h*layout.scale);
  if(state.mode==='map'){overview.hidden=!state.mapOverview;if(!overview.hidden){if(overview.width!==240||overview.height!==240){overview.width=240;overview.height=240;}paintMapOverview(overviewCtx,original,state.mapOverview,layout);}}
  if(state.mode==='town'){overview.hidden=false;if(overview.width!==240||overview.height!==112){overview.width=240;overview.height=112;}overviewCtx.drawImage(original,0,0,800*sx,374*sy,0,0,240,112);overviewCtx.strokeStyle='#ffec9e';overviewCtx.lineWidth=3;overviewCtx.strokeRect(layout.x/800*240,layout.y/374*112,layout.w/800*240,layout.h/374*112);const view=root.querySelector('.town-view');view.textContent=supportsTownPortrait(state)&&root.clientWidth<root.clientHeight?'Vue portrait':townWhole?'Vue rapprochée':'Vue entière';view.setAttribute('aria-pressed',String(townWhole));}
  paintedGeometry=touchGeometry(scene);
  if(selectedPoint&&state.mode==='battle'){ctx.strokeStyle='#ffe5a0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(layout.dx+(selectedPoint.x-layout.x)*layout.scale,layout.dy+(selectedPoint.y-layout.y)*layout.scale,19,0,Math.PI*2);ctx.stroke();}
  if(state.mode==='battle'){paintBattleFloor(ctx,state,layout);const guidance=battleGuidance(effectiveBattle());paintShotTargets(ctx,guidance.shotTargets,layout);paintMeleeTargets(ctx,guidance.meleeTargets,layout);paintActiveCreature(ctx,guidance,layout);paintBattleAction(ctx,tracking,layout);const activeSpellOrBuffTargets=[...new Set([...guidance.spellTargets,...(guidance.beneficialTargets||[])])];paintSpellTargets(ctx,activeSpellOrBuffTargets,layout);syncBattleView();dualBattle.paint(original,layout,selectedPoint,tracking);paintBattlePreviews();}
 }
 requestAnimationFrame(frame);
 const resize=coalesceViewportResize(()=>({width:root.clientWidth,height:root.clientHeight,sceneWidth:scene.clientWidth,sceneHeight:scene.clientHeight,top:state.mode==='map'&&landscapeMap.matches?0:Math.round((root.querySelector('.mobile-top').getBoundingClientRect().bottom-root.getBoundingClientRect().top)*4)/4}),size=>{const selected=state.mode==='battle'?selectedPoint:null;resetGestures();selectedPoint=selected;focus=state.mode==='battle'?(selected||battleCamera):null;root.style.setProperty('--mobile-top-height',size.top+'px');});
 window.addEventListener('resize',()=>{touches.cancel();resize();});window.addEventListener('orientationchange',()=>{resetGestures();resize();});window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);window.addEventListener('blur',resetGestures);document.addEventListener('visibilitychange',resetGestures);new ResizeObserver(resize).observe(root.querySelector('.mobile-top'));resize();

 window.goonkAssetsReady?.then(()=>{const image=(window.goonkAssetURLs||[]).find(x=>x.path.endsWith('/goonk/town.png'));if(image)menu.style.setProperty('--welcome-image',`url("${image.url}")`);});
 controls();window.dispatchEvent(new Event('goonk-mobile-mounted'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
