import {touchGeometry,sameTouchGeometry,isPointerClick} from './touch-geometry.mjs';
// Keep the original menu button through a touch, even when a status update
// changes the layout. Its delayed click must never hit a different action.
export function protectMenuButtons(root,activate,{context=()=>'',clock=()=>performance.now(),nativeClick=false}={}){
 let held=null,shieldUntil=-Infinity;
 const consume=e=>{e.preventDefault();e.stopImmediatePropagation();};
 const cancel=()=>{held=null;shieldUntil=clock()+900;};
 const doc=root.ownerDocument;doc.addEventListener('pointerdown',()=>{shieldUntil=-Infinity;},true);doc.addEventListener('click',e=>{if(clock()<shieldUntil&&!root.contains(e.target)&&(e.detail>0||e.pointerType==='touch'||e.pointerType==='pen'))consume(e);},true);
 root.addEventListener('pointerdown',e=>{
  shieldUntil=-Infinity;const button=e.target.closest?.('button');if(!button||!root.contains(button)||e.button>0||nativeClick||button.hasAttribute('data-native-click'))return;
  consume(e);if(e.isPrimary===false){cancel();return;}
  held={button,id:e.pointerId,x:e.clientX,y:e.clientY,disabled:button.disabled,context:context(),geometry:touchGeometry(button),rect:button.getBoundingClientRect()};try{button.setPointerCapture(e.pointerId);}catch{}
 },true);
 root.addEventListener('pointerup',e=>{
  if(!held||held.id!==e.pointerId)return;const p=held;held=null;shieldUntil=clock()+900;consume(e);try{p.button.releasePointerCapture(e.pointerId);}catch{}
  const r=p.button.getBoundingClientRect();if(!sameTouchGeometry(p.button,p.geometry)||!p.button.isConnected||p.disabled||p.button.disabled||p.context!==context()||Math.hypot(e.clientX-p.x,e.clientY-p.y)>12||Math.abs(r.x-p.rect.x)>2||Math.abs(r.y-p.rect.y)>2||e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
  activate(p.button);
 },true);
 root.addEventListener('pointercancel',cancel,true);
 root.addEventListener('lostpointercapture',e=>{if(held?.id===e.pointerId)cancel();},true);
 root.addEventListener('click',e=>{
  const button=e.target.closest?.('button');
  if(!button||!root.contains(button))return;
  consume(e);
  if(!button.disabled&&(nativeClick||!isPointerClick(e)||button.hasAttribute('data-native-click')))activate(button);
 },true);
 // Form controls keep their browser defaults; their input must stay in the menu.
 for(const type of ['pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup','touchstart','touchmove','touchend','wheel'])root.addEventListener(type,e=>e.stopPropagation());
 return {cancel};
}
