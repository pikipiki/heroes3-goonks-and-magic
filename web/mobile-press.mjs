import {touchGeometry,sameTouchGeometry,isPointerClick} from './touch-geometry.mjs';
// Older iOS can send a trusted MouseEvent with detail=0 after a touch.
// Keyboard-generated detail=0 clicks stay usable after their keydown.
function compatibilityClickGuard(clock){
 let until=0;
 return{start(){until=clock()+1000;},keydown(event){if(event.key==='Enter'||event.key===' ')until=0;},matches(event){return isPointerClick(event)||(event.isTrusted===true&&clock()<until);}};
}
// Act on release, with a click fallback for keyboards and assistive technology.
// Suppress the compatibility click so one tap can never toggle twice.
export function bindPress(button,activate,{clock=()=>Date.now()}={}){
 button.dataset.directPress='true';
 let press=null;const clicks=compatibilityClickGuard(clock);button.addEventListener('keydown',event=>clicks.keydown(event));
 button.addEventListener('pointerdown',event=>{if(button.disabled||event.isPrimary===false||event.button>0)return;clicks.start();press={id:event.pointerId,x:event.clientX,y:event.clientY,geometry:touchGeometry(button)};try{button.setPointerCapture(event.pointerId);}catch{}});
 button.addEventListener('pointercancel',()=>{press=null;});
 button.addEventListener('pointerup',event=>{if(!press||press.id!==event.pointerId)return;const start=press;press=null;try{if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);}catch{}const r=button.getBoundingClientRect();if(button.disabled||!sameTouchGeometry(button,start.geometry)||Math.hypot(event.clientX-start.x,event.clientY-start.y)>12||event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)return;event.preventDefault();event.stopPropagation();activate();});
 button.addEventListener('click',event=>{event.stopPropagation();if(button.disabled)return;if(!clicks.matches(event))activate();});
}

// Keep the original target for the entire gesture, including across an
// autosave/state update. A delayed compatibility click cannot hit a new button.
export function protectTouchClicks(root,{context=()=>'',clock=()=>Date.now()}={}){
 let held=null,activating=false;const clicks=compatibilityClickGuard(clock);
 root.addEventListener('keydown',event=>clicks.keydown(event),true);
 root.addEventListener('pointerdown',event=>{
  if(event.isPrimary!==false&&!(event.button>0))clicks.start();
  const button=event.target.closest?.('button');if(!button||!root.contains(button)||button.disabled||button.dataset.directPress==='true'||event.isPrimary===false||event.button>0)return;
  held={button,id:event.pointerId,x:event.clientX,y:event.clientY,context:context(),geometry:touchGeometry(button),rect:button.getBoundingClientRect()};
  try{button.setPointerCapture(event.pointerId);}catch{}
 },true);
 root.addEventListener('pointercancel',()=>{held=null;},true);
 root.addEventListener('pointerup',event=>{
  if(!held||held.id!==event.pointerId)return;const press=held;held=null;event.preventDefault();event.stopPropagation();
  try{press.button.releasePointerCapture(event.pointerId);}catch{}
  const button=press.button,r=button.getBoundingClientRect();if(!button.isConnected||button.disabled||!sameTouchGeometry(button,press.geometry)||press.context!==context()||Math.abs(r.left-press.rect.left)>2||Math.abs(r.top-press.rect.top)>2||Math.hypot(event.clientX-press.x,event.clientY-press.y)>14||event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)return;
  activating=true;try{button.click();}finally{activating=false;}
 },true);
 root.addEventListener('click',event=>{if(!activating&&event.target.closest?.('button')&&clicks.matches(event)){event.preventDefault();event.stopImmediatePropagation();}},true);
 const cancel=()=>{held=null;};window.addEventListener('blur',cancel);window.addEventListener('orientationchange',cancel);document.addEventListener('visibilitychange',cancel);return{cancel};
}
