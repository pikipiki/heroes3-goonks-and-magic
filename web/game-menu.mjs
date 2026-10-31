import {cheatCodes,unavailableReason} from './cheat-codes.mjs';
const muteKey='heroes-goonk.audio-muted';
function mountGameMenu(){
  let state={},tab='settings',initialAudioApplied=false;
  let muted=false;try{muted=localStorage.getItem(muteKey)==='true';}catch{}
  const toggle=document.createElement('button');toggle.id='game-menu-toggle';toggle.textContent='☰';toggle.setAttribute('aria-label','Menu du jeu');
  const brand=document.querySelector('#mobile-app .mobile-brand');if(brand)brand.replaceWith(toggle);else document.body.append(toggle);
  const dialog=document.createElement('dialog');dialog.id='game-menu';dialog.setAttribute('aria-labelledby','game-menu-title');
  dialog.innerHTML='<header><h2 id="game-menu-title">Menu du jeu</h2><button data-menu="close" aria-label="Fermer le menu">✕</button></header><nav aria-label="Rubriques du menu"><button data-menu="settings">Son</button><button data-menu="cheats">Codes de triche</button></nav><div class="game-menu-body"></div><p class="game-menu-status" role="status"></p>';
  document.body.append(dialog);
  const content=dialog.querySelector('.game-menu-body'),status=dialog.querySelector('.game-menu-status');
  const command=(action,value=0)=>window.Module?._vcmiMobileCommand?.(action,value,0,0,0,0);
  function render(){
    dialog.querySelector('[data-menu=settings]').setAttribute('aria-pressed',String(tab==='settings'));
    dialog.querySelector('[data-menu=cheats]').setAttribute('aria-pressed',String(tab==='cheats'));
    if(tab==='settings'){
      const html='<h3>Musique et effets sonores</h3><p>Ce réglage est conservé sur cet appareil.</p><button class="sound-toggle primary" data-menu="sound" aria-pressed="'+muted+'">'+(muted?'🔊 Réactiver le son':'🔇 Couper le son')+'</button>';
      if(content.innerHTML!==html)content.innerHTML=html;
      content.querySelector('[data-menu=sound]').disabled=!initialAudioApplied;
    }else{
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
    if(!initialAudioApplied){initialAudioApplied=true;if(muted)command(28,1);}
    else if(typeof state.audioMuted==='boolean')muted=state.audioMuted;
    if(dialog.open)render();
    window.goonkGameMenuState={muted,ready:initialAudioApplied,native:state};
  });
  toggle.onclick=()=>{render();status.textContent='';dialog.showModal();};
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.cheat!==undefined){const cheat=cheatCodes.find(x=>x.id===Number(button.dataset.cheat));if(!cheat||unavailableReason(cheat,state))return;command(29,cheat.id);status.textContent='Code envoyé au moteur : '+cheat.code;return;}
    const action=button.dataset.menu;
    if(action==='close'){dialog.close();toggle.focus();}
    if(action==='settings'||action==='cheats'){tab=action;status.textContent='';render();}
    if(action==='sound'){muted=!muted;try{localStorage.setItem(muteKey,String(muted));}catch{}command(28,muted?1:0);render();status.textContent=muted?'Musique et effets coupés.':'Son réactivé.';}
  });
  dialog.addEventListener('keydown',event=>event.stopPropagation());
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountGameMenu);else mountGameMenu();
