import {createMaterialMenu} from './mui-runtime.mjs';
import {bindPress} from '../mobile-press.mjs';
const sessionKey=Symbol.for('heroes-goonk.ui-menu');
const session=globalThis[sessionKey]??={active:null,shieldUntil:0,installed:false,serial:0};
export function closeDetachedMenu(){if(session.active&&!session.active.anchor.isConnected)session.active.close(false);}
function installEvents(){
 if(session.installed)return;session.installed=true;
 document.addEventListener('pointerdown',()=>{session.shieldUntil=0;},true);
 document.addEventListener('keydown',event=>{session.shieldUntil=0;if(session.active&&event.key==='Escape'){event.preventDefault();event.stopPropagation();session.active.close();}},true);
 document.addEventListener('click',event=>{if(event.isTrusted&&performance.now()<session.shieldUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
 document.addEventListener('cancel',event=>{if(session.active&&event.target.contains(session.active.anchor)){event.preventDefault();session.active.close();}},true);
 document.addEventListener('close',event=>{if(session.active&&event.target.contains(session.active.anchor))session.active.close(false);},true);
 window.addEventListener('resize',()=>session.active?.close());window.visualViewport?.addEventListener('resize',()=>session.active?.close());
}
export function createPopupMenu({anchor,container=anchor.parentElement,role='menu',className='',label=()=>anchor.getAttribute('aria-label')||anchor.textContent,bindAnchor=true,placement}){
 installEvents();
 const host=document.createElement('span');host.className='ui-menu-mount '+className;host.style.display='contents';container.append(host);
 const material=createMaterialMenu(host,{anchor,container,role,label,className,placement,onClose:()=>close()});
 const list=material.list;list.id='ui-menu-'+(++session.serial);anchor.setAttribute('aria-controls',list.id);
 let open=false,focusFrame;
 const options=()=>[...list.querySelectorAll('button:not(:disabled),[role=option]:not([aria-disabled=true])')];
 function close(restore=true){if(!open)return;open=false;cancelAnimationFrame(focusFrame);session.shieldUntil=performance.now()+900;material.close();anchor.setAttribute('aria-expanded','false');if(session.active===api)session.active=null;if(restore&&anchor.isConnected)anchor.focus({preventScroll:true});}
 function focus(index){const items=options();if(!items.length)return;const item=items[Math.max(0,Math.min(index,items.length-1))];item.focus({preventScroll:true});if(item.offsetTop<list.scrollTop)list.scrollTop=item.offsetTop;else if(item.offsetTop+item.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=item.offsetTop+item.offsetHeight-list.clientHeight;}
 function show(){
  if(anchor.disabled)return;if(open){close();return;}session.active?.close(false);open=true;session.active=api;session.shieldUntil=performance.now()+900;
  list.setAttribute('aria-label',typeof label==='function'?label():label);anchor.setAttribute('aria-expanded','true');material.show();
  const index=Math.max(0,options().findIndex(item=>item.getAttribute('aria-selected')==='true'));focus(index);focusFrame=requestAnimationFrame(()=>{if(open&&!host.contains(document.activeElement))focus(index);});
 }
 host.addEventListener('pointerdown',event=>{if(event.target===host){event.preventDefault();event.stopPropagation();close();}});
 list.addEventListener('click',()=>close(false));
 list.addEventListener('keydown',event=>{const items=options(),index=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();focus(event.key==='Home'?0:event.key==='End'?items.length-1:index+(event.key==='ArrowDown'?1:-1));}else if(event.key==='Tab'){close(false);anchor.focus({preventScroll:true});}else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){const start=index+1,match=items.findIndex((_,offset)=>items[(start+offset)%items.length]?.textContent.trim().toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));if(match>=0){event.preventDefault();focus((start+match)%items.length);}}});
 if(bindAnchor)bindPress(anchor,show);
 anchor.setAttribute('aria-haspopup',role);anchor.setAttribute('aria-expanded','false');
 const api={anchor,host,list,show,close,get open(){return open;},setItems(items){if(open)close(false);list.replaceChildren(...items);},dispose(){close(false);material.dispose();host.remove();}};return api;
}
