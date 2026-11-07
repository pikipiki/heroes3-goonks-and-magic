import {isMobileLayout} from './mobile-render.mjs';
import {createTurnNotifications} from './turn-notifications.mjs';
import {mountHostedTurnNotifications, requestedHostedMatch} from './hosted-turn-notifications.mjs';
import {getLanguage,setLanguage} from './i18n.mjs';
import {MAP_SPEEDS,createMapSettings} from './map-settings.mjs';
import {protectMenuButtons} from './menu-press.mjs';
import {bindPress} from './mobile-press.mjs';
import {installAudioRecovery} from './audio-recovery.mjs';
import {cheatCodes,unavailableReason} from './cheat-codes.mjs';
import {ROOT} from './asset-cache.mjs';
import {opfsList} from '../opfs-worker.js';
import {formatStorage,formatStorageFiles,storageSummary,storageGuide,storageHelp} from './game-storage.mjs';
const muteKey='heroes-goonk.audio-muted';
function mountGameMenu(){
 if(!document.querySelector('#mobile-app')&&isMobileLayout()){window.addEventListener('goonk-mobile-mounted',mountGameMenu,{once:true});return;}
 if(document.querySelector('#game-menu-toggle'))return;
  let state={},tab='home',initialAudioApplied=false,newGamePending=false,pendingAudio=null,audioPhase='loading';
  let muted=false;try{muted=localStorage.getItem(muteKey)==='true';}catch{}
  const toggle=document.createElement('button');toggle.id='game-menu-toggle';toggle.textContent='☰';toggle.setAttribute('aria-label','Menu du jeu');
  const brand=document.querySelector('#mobile-app .mobile-brand');if(brand)brand.replaceWith(toggle);else document.body.append(toggle);
  const dialog=document.createElement('dialog');dialog.id='game-menu';dialog.setAttribute('aria-labelledby','game-menu-title');
  dialog.innerHTML='<header><button data-menu="back" hidden>← Back</button><h2 id="game-menu-title">Heroes Goonk</h2><button data-menu="close" aria-label="Fermer le menu">✕</button></header><p class="autosave-status" aria-live="polite">Sauvegarde automatique : toutes les 10 secondes</p><nav aria-label="Rubriques du menu"><button data-menu="hosted-match" hidden></button><button data-menu="settings">Réglages</button><button data-menu="cheats">Codes de triche</button><button data-menu="storage">Stockage du jeu</button><button data-menu="new-game" class="new-game-in-session">New game</button></nav><div class="game-menu-body"></div><p class="game-menu-status" role="status"></p>';
  document.body.append(dialog);
  const onlineTurn=document.createElement('p');
  onlineTurn.className='desktop-online-turn';onlineTurn.hidden=true;onlineTurn.setAttribute('role','status');
  document.body.append(onlineTurn);
  const content=dialog.querySelector('.game-menu-body'),status=dialog.querySelector('.game-menu-status');
  const command=(action,value=0,preview=0)=>window.Module?._vcmiMobileCommand?.(action,value,preview,0,0,0);
  let hostedAlerts, hostedRequested;
  let requestedMatch = requestedHostedMatch();
  const turnNotifications=createTurnNotifications({language:getLanguage});
  const movement=createMapSettings({send:value=>command(46,value.moveTime,value.hideEnemyMoves?1:0)});
  const audio=installAudioRecovery({isMuted:()=>muted,onChange:info=>{audioPhase=info.phase;if(dialog.open&&tab==='settings')render();}});
  function openHostedMatch(requested=null){
    if(!window.goonkHostedAlerts||state.mode!=='menu')return;
    tab='hosted-match';
    hostedRequested=requested;
    status.textContent='';
    render();
    if(!dialog.open)dialog.showModal();
  }
  window.addEventListener('goonk-open-hosted-match',()=>openHostedMatch());
  function render(){
    const hostedTitle='Multijoueur sur serveur dédié';
    const hostedEntry=dialog.querySelector('nav [data-menu=hosted-match]');
    hostedEntry.hidden=Boolean(window.goonkMobileActive)||!window.goonkHostedAlerts||state.mode!=='menu';
    hostedEntry.textContent=hostedTitle;
    dialog.querySelector('nav [data-menu=cheats]').hidden=state.cheatsAllowed===false;
    dialog.dataset.page=tab;dialog.querySelector('nav').hidden=tab!=='home';dialog.querySelector('[data-menu=back]').hidden=tab==='home';dialog.querySelector('#game-menu-title').textContent=({home:'Heroes Goonk','hosted-match':hostedTitle,settings:'Settings',cheats:'Cheat codes',storage:'Game storage','storage-help':'Storage help','new-game':'New game'})[tab]||'Heroes Goonk';dialog.querySelector('[data-menu=new-game]').hidden=tab!=='home'||!state.day;
    if(tab==='home'){content.innerHTML='';delete content.dataset.view;delete content.dataset.storage;return;}
    if(tab==='storage-help'){delete content.dataset.storage;if(content.dataset.view!=='storage-help'){content.dataset.view='storage-help';content.innerHTML=storageHelp();}return;}
    dialog.querySelector('[data-menu=settings]').setAttribute('aria-pressed',String(tab==='settings'));
    dialog.querySelector('[data-menu=cheats]').setAttribute('aria-pressed',String(tab==='cheats'));dialog.querySelector('[data-menu=storage]').setAttribute('aria-pressed',String(tab==='storage'));
    if(tab==='new-game')return;
    if(tab==='hosted-match'){
      if(content.dataset.view!=='hosted-match'){
        content.dataset.view='hosted-match';
        delete content.dataset.storage;
        content.replaceChildren();
        hostedAlerts=mountHostedTurnNotifications(content,window.goonkHostedAlerts,getLanguage,()=>dialog.close(),hostedRequested);
      }
      return;
    }
    if(tab==='storage'){content.dataset.view='storage';
      if(content.dataset.storage!=='ready'){content.dataset.storage='ready';content.innerHTML=storageGuide(location.hostname)+'<dl class="storage-sizes"><div><dt>Fichiers du jeu</dt><dd data-storage-game>Calcul en cours…</dd></div><div><dt>Sauvegardes</dt><dd data-storage-saves>Calcul en cours…</dd></div></dl><p>Pour libérer cet espace en gardant tes sauvegardes, ouvre la gestion du stockage. Elle ferme le jeu. Enregistre ta partie avant de continuer.</p><button class="storage-manage primary" data-menu="manage-storage">Quitter le jeu et gérer le stockage</button><p class="storage-combat" hidden>Termine le combat avant de libérer l’espace du jeu.</p>';opfsList(ROOT).then(entries=>{if(tab!=='storage')return;const value=storageSummary(entries);content.querySelector('[data-storage-game]').textContent=formatStorage(value.gameBytes);content.querySelector('[data-storage-saves]').textContent=formatStorage(value.saveBytes)+' · '+formatStorageFiles(value.saveFiles);}).catch(()=>{if(tab==='storage')for(const e of content.querySelectorAll('[data-storage-game],[data-storage-saves]'))e.textContent='Mesure indisponible';});}
      content.querySelector('[data-menu=manage-storage]').disabled=state.mode==='battle'||state.mode==='dialog';content.querySelector('.storage-combat').hidden=!['battle','dialog'].includes(state.mode);return;
    }
    delete content.dataset.storage;
    if(tab==='settings'){
      if(content.dataset.view!=='settings'){
        content.dataset.view='settings';content.innerHTML='<label class=language-setting>Language<select data-language><option value=en>English</option><option value=fr>Français</option></select></label><p>Native game text uses this language the next time you open the game.</p><section class="map-movement-settings"><h3>Déplacements sur la carte</h3><label class="map-speed-label">Vitesse de marche des héros<select data-map-speed aria-label="Vitesse de marche des héros">'+MAP_SPEEDS.map(speed=>'<option value="'+speed.value+'">'+speed.label+'</option>').join('')+'</select></label><p>La vitesse choisie s’applique à tes héros et à tes adversaires.</p><label><input type="checkbox" data-hide-enemy aria-describedby="enemy-movement-help"> Masquer les déplacements ennemis</label><p id="enemy-movement-help"></p><p class="map-settings-health" role="status"></p></section>'+'<h3>Musique et effets sonores</h3><p>Ce réglage est conservé sur cet appareil.</p><button class="sound-toggle primary" data-menu="sound" role="switch" aria-label="Son"></button><p class="audio-health" role="status"></p><h3 data-turn-heading></h3><button data-menu="turn-notifications" role="switch"></button><p data-turn-help></p>';
      }
      content.querySelector('[data-language]').value=getLanguage();
      const prefs=movement.current,speed=content.querySelector('[data-map-speed]'),hide=content.querySelector('[data-hide-enemy]');speed.disabled=hide.disabled=!prefs.ready;if(document.activeElement!==speed)speed.value=String(prefs.moveTime);hide.checked=prefs.hideEnemyMoves;
      const help=content.querySelector('#enemy-movement-help');
      const message=prefs.hideEnemyMoves?'Les adversaires jouent normalement, sans animation de marche ni suivi de caméra.':prefs.moveTime===0?'La caméra suit les héros ennemis visibles. La vitesse instantanée saute l’animation de marche.':'La caméra suit les héros ennemis pendant leur tour, dans les zones visibles de la carte.';
      if(help._sourceText!==message){help._sourceText=message;help.textContent=message;}
      content.querySelector('.map-settings-health').textContent=!prefs.ready?'Chargement des réglages…':prefs.pending?'Application des réglages…':'Réglages conservés sur cet appareil.';
      const button=content.querySelector('[data-menu=sound]');button.textContent=muted?'🔇 Son coupé':'🔊 Son activé';button.setAttribute('aria-checked',String(!muted));button.setAttribute('aria-busy',String(pendingAudio!==null));button.disabled=!initialAudioApplied||pendingAudio!==null;
      content.querySelector('.audio-health').textContent=muted?'Musique et effets coupés.':audioPhase==='paused'?'Audio en pause. Coupe puis réactive le son avec ce bouton.':audioPhase==='closed'?'Audio indisponible : recharge le jeu.':audioPhase==='loading'?'Initialisation audio…':state.soundVolume===0&&state.musicVolume===0?'Volume du jeu à zéro. Coupe puis réactive le son avec ce bouton.':'Audio du jeu prêt.';
      const fr=getLanguage()==='fr', alerts=content.querySelector('[data-menu=turn-notifications]');
      content.querySelector('[data-turn-heading]').textContent=fr?'Notifications de tour':'Turn notifications';
      alerts.textContent=turnNotifications.enabled?(fr?'Notifications activées':'Notifications on'):(fr?'Activer les notifications':'Enable notifications');
      alerts.setAttribute('aria-checked',String(turnNotifications.enabled));
      alerts.disabled=!turnNotifications.supported||turnNotifications.pending;
      content.querySelector('[data-turn-help]').textContent=fr
        ?'Alertes en multijoueur quand le jeu tourne en arrière-plan. Sur iPhone, ouvre le jeu depuis l’écran d’accueil.'
        :'Alerts during online games while the game is running in the background. On iPhone, open the game from the Home Screen.';
    }else{
      const context=state.townName||state.selectedTownName||state.heroName||'Aucune partie sélectionnée';
      const html='<p>'+escape(context)+'</p><p>Utiliser un code marque cette partie comme trichée.</p>'+cheatCodes.map(cheat=>{
        const reason=unavailableReason(cheat,state);
        return '<article class="game-cheat"><h3>'+cheat.title+'</h3><p>'+cheat.description+'</p><code>'+cheat.code+'</code><button data-cheat="'+cheat.id+'" '+(reason?'disabled':'')+' aria-label="'+escape('Appliquer : '+cheat.title)+'">'+(reason||'Appliquer')+'</button></article>';
      }).join('');
      if(content.dataset.view!=='cheats'||content._sourceMarkup!==html){
        content.dataset.view='cheats';content._sourceMarkup=html;content.innerHTML=html;
      }
    }
  }
  const enable=()=>{if(window.Module?._vcmiMobileEnable)window.Module._vcmiMobileEnable(window.goonkMobileActive?1:2);};
  const timer=setInterval(()=>{enable();if(initialAudioApplied)clearInterval(timer);},250);
  window.addEventListener('goonk-state',event=>{
    state=event.detail;movement.observe(state.mapSettings);
    const waiting=!isMobileLayout()&&state.onlineGame&&state.mode==='map'&&!state.turn;
    onlineTurn.hidden=!waiting;
    if(waiting){
      const text=getLanguage()==='fr'?'Tour de l’autre joueur…':'Waiting for the other player’s turn…';
      if(onlineTurn.textContent!==text)onlineTurn.textContent=text;
    }else if(onlineTurn.textContent)onlineTurn.textContent='';
    void turnNotifications.update(state);
    if(newGamePending&&['connecting','lobby','menu'].includes(state.mode)){newGamePending=false;dialog.close();}
    if(!initialAudioApplied){initialAudioApplied=true;if(muted){pendingAudio=true;command(28,1);}}
    else if(pendingAudio!==null){if(state.audioMuted===pendingAudio)pendingAudio=null;}
    else if(typeof state.audioMuted==='boolean')muted=state.audioMuted;
    audio.observe();
    if(requestedMatch&&window.goonkHostedAlerts&&state.mode==='menu'&&window.Module?._vcmiJoinHostedMatch){
      openHostedMatch(requestedMatch);requestedMatch=null;
    }
    if(dialog.open)render();
    window.goonkGameMenuState={muted,ready:initialAudioApplied,native:state};
  });
  window.addEventListener('goonk-autosave-status',e=>{const s=e.detail;dialog.querySelector('.autosave-status').textContent=s.phase==='error'?'Sauvegarde automatique : '+s.error:s.phase==='saving'?'Sauvegarde automatique en cours…':s.deferred?'Combat en cours : sauvegarde différée'+(s.lastSaved?' · dernière à '+new Date(s.lastSaved).toLocaleTimeString('fr-FR'):''):s.lastSaved?'Sauvegarde automatique : '+new Date(s.lastSaved).toLocaleTimeString('fr-FR')+' · cycle 10 s':'Sauvegarde automatique : cycle 10 s · en attente d’un état enregistrable';});
  const menuPresses=protectMenuButtons(dialog,activateMenuButton,{context:()=>tab});
  bindPress(toggle,()=>{menuPresses.cancel();tab='home';render();status.textContent='';if(!dialog.open)dialog.showModal();});
  function activateMenuButton(button){
    if(!button?.isConnected||button.disabled)return;
    if(hostedAlerts?.activate(button))return;
    if(button.dataset.cheat!==undefined){const cheat=cheatCodes.find(x=>x.id===Number(button.dataset.cheat));if(!cheat||unavailableReason(cheat,state))return;command(29,cheat.id);status.textContent='Code envoyé au moteur : '+cheat.code;return;}
    const action=button.dataset.menu;
    if(action==='hosted-match'){openHostedMatch();return;}
    if(action==='back'&&tab==='hosted-match'){
      if(hostedAlerts?.back())return;
      if(window.goonkMobileActive){dialog.close();return;}
    }
    if(action==='back'){tab=tab==='storage-help'?'storage':'home';delete content.dataset.view;render();return;}
    if(action==='storage-help'){tab='storage-help';render();return;}
    if(action==='new-game'){tab='new-game';render();content.dataset.view='new-game';content.innerHTML='<h3>Retourner au menu principal ?</h3><p>The current session will end. Your existing saved games will be kept. Save first if you want to keep your latest progress.</p><button data-menu=confirm-new-game>Retour au menu principal</button><button data-menu=back>Back</button>';return;}
    if(action==='confirm-new-game'){
      if(newGamePending||!state.day||!window.Module?._vcmiMobileCommand)return;
      newGamePending=true;button.disabled=true;button.setAttribute('aria-busy','true');command(71);return;
    }
    if(action==='close'){dialog.close();toggle.focus();}
    if(action==='manage-storage'&&!['battle','dialog'].includes(state.mode)){location.assign(new URL('../storage.html',import.meta.url));return;}
    if(action==='settings'||action==='cheats'||action==='storage'){if(content.dataset.view==='new-game')delete content.dataset.view;tab=action;status.textContent='';render();}
    if(action==='turn-notifications'){
      const change=turnNotifications.toggle();
      render();
      void change.then(enabled=>{
        const fr=getLanguage()==='fr';
        status.textContent=enabled?(fr?'Notifications activées.':'Notifications enabled.')
          :(fr?'Notifications désactivées. Vérifie l’autorisation du navigateur si nécessaire.':'Notifications off. Check browser permissions if needed.');
        render();
      });
      return;
    }
    if(action==='sound'){muted=!muted;pendingAudio=muted;try{localStorage.setItem(muteKey,String(muted));}catch{}command(28,muted?1:0);if(!muted)void audio.resume({repair:true}).then(ok=>{if(ok&&!muted)command(28,0,1);if(!muted)status.textContent=ok?'Son réactivé.':'Coupe puis réactive le son pour relancer l’audio.';});audio.observe();render();status.textContent=muted?'Musique et effets coupés.':'Son demandé : reprise de l’audio…';}

  }
  dialog.addEventListener('change',event=>{if(event.target.matches('[data-language]')){setLanguage(event.target.value);return;}if(event.target.matches('[data-map-speed],[data-hide-enemy]')){const patch=event.target.matches('[data-map-speed]')?{moveTime:Number(event.target.value)}:{hideEnemyMoves:event.target.checked};const stored=movement.change(patch);render();status.textContent=stored?'Réglages de déplacement mis à jour.':'Réglages appliqués pour cette session.';}});
  dialog.addEventListener('close',()=>{
    if(tab!=='hosted-match'||dialog.open)return;
    tab='home';
    hostedAlerts=undefined;
    content.replaceChildren();
    delete content.dataset.view;
  });
  dialog.addEventListener('keydown',event=>event.stopPropagation());
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountGameMenu);else mountGameMenu();
