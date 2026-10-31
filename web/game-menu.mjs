import {installAudioRecovery} from './audio-recovery.mjs';
import {cheatCodes,unavailableReason} from './cheat-codes.mjs';
import {ROOT} from './asset-cache.mjs';
import {opfsList} from '../opfs-worker.js';
import {formatStorage,storageSummary,storageGuide} from './game-storage.mjs';
const muteKey='heroes-goonk.audio-muted';
function mountGameMenu(){
  let state={},tab='settings',initialAudioApplied=false,pendingAudio=null,audioPhase='loading';
  let muted=false;try{muted=localStorage.getItem(muteKey)==='true';}catch{}
  const toggle=document.createElement('button');toggle.id='game-menu-toggle';toggle.textContent='☰';toggle.setAttribute('aria-label','Menu du jeu');
  const brand=document.querySelector('#mobile-app .mobile-brand');if(brand)brand.replaceWith(toggle);else document.body.append(toggle);
  const dialog=document.createElement('dialog');dialog.id='game-menu';dialog.setAttribute('aria-labelledby','game-menu-title');
  dialog.innerHTML='<header><h2 id="game-menu-title">Heroes Goonk</h2><button data-menu="close" aria-label="Fermer le menu">✕</button></header><p class="autosave-status" aria-live="polite">Sauvegarde automatique : toutes les 10 secondes</p><nav aria-label="Rubriques du menu"><button data-menu="settings">Son</button><button data-menu="cheats">Codes de triche</button><button data-menu="storage">Stockage du jeu</button></nav><div class="game-menu-body"></div><p class="game-menu-status" role="status"></p>';
  document.body.append(dialog);
  const content=dialog.querySelector('.game-menu-body'),status=dialog.querySelector('.game-menu-status');
  const command=(action,value=0,preview=0)=>window.Module?._vcmiMobileCommand?.(action,value,preview,0,0,0);
  const audio=installAudioRecovery({isMuted:()=>muted,onChange:info=>{audioPhase=info.phase;if(dialog.open&&tab==='settings')render();}});
  function render(){
    dialog.querySelector('[data-menu=settings]').setAttribute('aria-pressed',String(tab==='settings'));
    dialog.querySelector('[data-menu=cheats]').setAttribute('aria-pressed',String(tab==='cheats'));dialog.querySelector('[data-menu=storage]').setAttribute('aria-pressed',String(tab==='storage'));
    if(tab==='storage'){content.dataset.view='storage';
      if(content.dataset.storage!=='ready'){content.dataset.storage='ready';content.innerHTML=storageGuide(location.hostname)+'<dl class="storage-sizes"><div><dt>Fichiers du jeu</dt><dd data-storage-game>Calcul en cours…</dd></div><div><dt>Sauvegardes</dt><dd data-storage-saves>Calcul en cours…</dd></div></dl><p>Pour libérer cet espace en gardant tes sauvegardes, ouvre la gestion du stockage. Elle ferme le jeu. Enregistre ta partie avant de continuer.</p><button class="storage-manage primary" data-menu="manage-storage">Quitter le jeu et gérer le stockage</button><p class="storage-combat" hidden>Termine le combat avant de libérer l’espace du jeu.</p>';opfsList(ROOT).then(entries=>{if(tab!=='storage')return;const value=storageSummary(entries);content.querySelector('[data-storage-game]').textContent=formatStorage(value.gameBytes);content.querySelector('[data-storage-saves]').textContent=formatStorage(value.saveBytes)+' · '+value.saveFiles+' fichier(s)';}).catch(()=>{if(tab==='storage')for(const e of content.querySelectorAll('[data-storage-game],[data-storage-saves]'))e.textContent='Mesure indisponible';});}
      content.querySelector('[data-menu=manage-storage]').disabled=state.mode==='battle'||state.mode==='dialog';content.querySelector('.storage-combat').hidden=!['battle','dialog'].includes(state.mode);return;
    }
    delete content.dataset.storage;
    if(tab==='settings'){
      if(content.dataset.view!=='audio'){
        content.dataset.view='audio';content.innerHTML='<h3>Musique et effets sonores</h3><p>Ce réglage est conservé sur cet appareil.</p><button class="sound-toggle primary" data-menu="sound"></button><p class="audio-health" role="status"></p><button data-menu="recover-sound">Rétablir le son</button>';
      }
      const button=content.querySelector('[data-menu=sound]');button.textContent=muted?'🔊 Réactiver le son':'🔇 Couper le son';button.setAttribute('aria-pressed',String(muted));button.disabled=!initialAudioApplied;
      content.querySelector('[data-menu=recover-sound]').disabled=!initialAudioApplied||muted;
      content.querySelector('.audio-health').textContent=muted?'Musique et effets coupés.':audioPhase==='paused'?'Le navigateur a mis l’audio en pause. Touche Rétablir le son.':audioPhase==='closed'?'Audio indisponible : recharge le jeu.':audioPhase==='loading'?'Initialisation audio…':state.soundVolume===0&&state.musicVolume===0?'Les volumes du jeu sont à zéro. Touche Rétablir le son.':'Audio du jeu prêt.';
    }else{
      content.dataset.view='cheats';
      const context=state.townName||state.selectedTownName||state.heroName||'Aucune partie sélectionnée';
      const html='<p>'+escape(context)+'</p><p>Utiliser un code marque cette partie comme trichée.</p>'+cheatCodes.map(cheat=>{
        const reason=unavailableReason(cheat,state);
        return '<article class="game-cheat"><h3>'+cheat.title+'</h3><p>'+cheat.description+'</p><code>'+cheat.code+'</code><button data-cheat="'+cheat.id+'" '+(reason?'disabled':'')+' aria-label="'+escape('Appliquer : '+cheat.title)+'">'+(reason||'Appliquer')+'</button></article>';
      }).join('');
      if(content.innerHTML!==html)content.innerHTML=html;
    }
  }
  const enable=()=>{if(window.Module?._vcmiMobileEnable)window.Module._vcmiMobileEnable(window.goonkMobileActive?1:2);};
  const timer=setInterval(()=>{enable();if(initialAudioApplied)clearInterval(timer);},250);
  window.addEventListener('goonk-state',event=>{
    state=event.detail;
    if(!initialAudioApplied){initialAudioApplied=true;if(muted){pendingAudio=true;command(28,1);}}
    else if(pendingAudio!==null){if(state.audioMuted===pendingAudio)pendingAudio=null;}
    else if(typeof state.audioMuted==='boolean')muted=state.audioMuted;
    audio.observe();
    if(dialog.open)render();
    window.goonkGameMenuState={muted,ready:initialAudioApplied,native:state};
  });
  window.addEventListener('goonk-autosave-status',e=>{const s=e.detail;dialog.querySelector('.autosave-status').textContent=s.phase==='error'?'Sauvegarde automatique : '+s.error:s.phase==='saving'?'Sauvegarde automatique en cours…':s.deferred?'Combat en cours : sauvegarde différée'+(s.lastSaved?' · dernière à '+new Date(s.lastSaved).toLocaleTimeString('fr-FR'):''):s.lastSaved?'Sauvegarde automatique : '+new Date(s.lastSaved).toLocaleTimeString('fr-FR')+' · cycle 10 s':'Sauvegarde automatique : cycle 10 s · en attente d’un état enregistrable';});
  toggle.onclick=()=>{render();status.textContent='';dialog.showModal();};
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.cheat!==undefined){const cheat=cheatCodes.find(x=>x.id===Number(button.dataset.cheat));if(!cheat||unavailableReason(cheat,state))return;command(29,cheat.id);status.textContent='Code envoyé au moteur : '+cheat.code;return;}
    const action=button.dataset.menu;
    if(action==='close'){dialog.close();toggle.focus();}
    if(action==='manage-storage'&&!['battle','dialog'].includes(state.mode)){location.assign(new URL('../storage.html',import.meta.url));return;}
    if(action==='settings'||action==='cheats'||action==='storage'){tab=action;status.textContent='';render();}
    if(action==='sound'){muted=!muted;pendingAudio=muted;try{localStorage.setItem(muteKey,String(muted));}catch{}command(28,muted?1:0);if(!muted)void audio.resume().then(ok=>{if(!muted)status.textContent=ok?'Son réactivé.':'Touche Rétablir le son pour reprendre l’audio.';});audio.observe();render();status.textContent=muted?'Musique et effets coupés.':'Son demandé : reprise de l’audio…';}
    if(action==='recover-sound'&&!muted){command(28,0);void audio.resume().then(ok=>{if(muted)return;if(ok){command(28,0,1);status.textContent='Audio du jeu relancé.';}else status.textContent='Touche à nouveau Rétablir le son pour reprendre l’audio.';});}
  });
  dialog.addEventListener('keydown',event=>event.stopPropagation());
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountGameMenu);else mountGameMenu();
