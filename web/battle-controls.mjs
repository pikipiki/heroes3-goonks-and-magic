// Keep release and compatibility-click handling in one place for battle controls.
// A layout change after release must never redirect the delayed click to a neighbor.
export function protectBattleControls(root,{clock=()=>performance.now()}={}){
 let held=null,shieldUntil=-Infinity,activating=false;
 const selector='.mobile-top button,.mobile-nav button,.battle-tools button,.battle-follow-action';
 const context=()=>root.dataset.mode+':'+(root.dataset.sheet||'');
 const consume=e=>{e.preventDefault();e.stopImmediatePropagation();};
 const cancel=()=>{held=null;shieldUntil=clock()+900;};
 root.addEventListener('pointerdown',event=>{
  shieldUntil=-Infinity;
  if(root.dataset.mode==='battle'&&event.isPrimary===false){cancel();consume(event);return;}
  const button=event.target.closest?.(selector);
  if(root.dataset.mode!=='battle'||!button||event.isPrimary===false||event.button>0){held=null;return;}
  held={button,disabledAtStart:button.disabled,id:event.pointerId,x:event.clientX,y:event.clientY,context:context(),rect:button.getBoundingClientRect()};consume(event);
  try{button.setPointerCapture(event.pointerId);}catch{}
 },true);
 root.addEventListener('pointerup',event=>{
  if(!held||event.pointerId!==held.id)return;
  const press=held;held=null;shieldUntil=clock()+900;consume(event);
  const b=press.button,r=b.getBoundingClientRect(),old=press.rect;
  try{if(b.hasPointerCapture(event.pointerId))b.releasePointerCapture(event.pointerId);}catch{}
  if(!b.isConnected||press.disabledAtStart||b.disabled||press.context!==context()||Math.hypot(event.clientX-press.x,event.clientY-press.y)>12||event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom||Math.abs(r.left-old.left)>2||Math.abs(r.top-old.top)>2)return;
  activating=true;try{b.click();}finally{activating=false;}
 },true);
 root.addEventListener('pointercancel',event=>{if(held?.id===event.pointerId){cancel();consume(event);}},true);
 root.addEventListener('lostpointercapture',event=>{if(held?.id===event.pointerId)cancel();},true);
 root.addEventListener('click',event=>{
  const touch=event.pointerType==='touch'||event.pointerType==='pen'||event.sourceCapabilities?.firesTouchEvents;
  if(!activating&&clock()<shieldUntil&&(event.detail>0||touch))consume(event);
 },true);
 window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);
 const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./battle-controls.css',import.meta.url).href;document.head.append(link);
 return {cancel};
}
