import {renderMarkup} from './render.mjs';
import {escapeUI,uiText} from './primitives.mjs';
import {plainGameText} from '../game-text.mjs';
if(typeof document!=='undefined'){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./battle-last-spell.css',import.meta.url).href;document.head.append(link);}
// A cast is acknowledged by the native battle camera. Merely choosing a spell
// or hovering a target must not replace the last acknowledged cast's name.
export function createBattleLastSpell(root){
 const host=document.createElement('div');host.className='ui-battle-last-spell';host.hidden=true;root.querySelector('.mobile-play').append(host);
 let name='',sequence=null,signature='';
 return {update(state,{inBattle=state.mode==='battle'}={}){
  if(!inBattle){name='';sequence=null;}
  const event=state.battleCamera;
  if(inBattle&&event?.kind==='spell'&&event.sequence!==sequence&&String(event.label||'').trim()){
   sequence=event.sequence;name=plainGameText(event.label).trim();
  }
  host.hidden=state.mode!=='battle'||!name;
  const label=uiText('Last spell','Dernier sort'),next=JSON.stringify([label,name]);
  if(next===signature)return;signature=next;
  renderMarkup(host,`<p class="ui-battle-last-spell-label" role="status" aria-live="polite" aria-atomic="true"><span>${escapeUI(label)} :</span> <span data-last-spell-name>${escapeUI(name)}</span></p>`);
 }};
}
