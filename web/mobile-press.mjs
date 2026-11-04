// Act on release, with a click fallback for keyboards and assistive technology.
// Suppress the compatibility click so one tap can never toggle twice.
export function bindPress(button,activate,{clock=()=>performance.now()}={}){
 button.dataset.directPress='true';
 let press=null,lastRelease=-Infinity;
 button.addEventListener('pointerdown',event=>{if(button.disabled||event.isPrimary===false||event.button>0)return;press={id:event.pointerId,x:event.clientX,y:event.clientY};try{button.setPointerCapture(event.pointerId);}catch{}});
 button.addEventListener('pointercancel',()=>{press=null;lastRelease=clock();});
 button.addEventListener('pointerup',event=>{if(!press||press.id!==event.pointerId)return;const start=press;press=null;lastRelease=clock();try{if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);}catch{}const r=button.getBoundingClientRect();if(button.disabled||Math.hypot(event.clientX-start.x,event.clientY-start.y)>12||event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)return;event.preventDefault();event.stopPropagation();activate();});
 button.addEventListener('click',event=>{event.stopPropagation();if(button.disabled)return;if(event.detail===0||clock()-lastRelease>600)activate();});
}

// Keep the original target for the entire gesture, including across an
// autosave/state update. A delayed compatibility click cannot hit a new button.
export function protectTouchClicks(root,{context=()=>'',clock=()=>performance.now()}={}){
 let held=null,lastRelease=-Infinity,activating=false;
 root.addEventListener('pointerdown',event=>{
  const button=event.target.closest?.('button');if(!button||!root.contains(button)||button.disabled||button.dataset.directPress==='true'||event.isPrimary===false||event.button>0)return;
  held={button,id:event.pointerId,x:event.clientX,y:event.clientY,context:context(),rect:button.getBoundingClientRect()};
  try{button.setPointerCapture(event.pointerId);}catch{}
 },true);
 root.addEventListener('pointercancel',()=>{held=null;lastRelease=clock();},true);
 root.addEventListener('pointerup',event=>{
  if(!held||held.id!==event.pointerId)return;const press=held;held=null;lastRelease=clock();event.preventDefault();event.stopPropagation();
  try{press.button.releasePointerCapture(event.pointerId);}catch{}
  const button=press.button,r=button.getBoundingClientRect();if(!button.isConnected||button.disabled||press.context!==context()||Math.abs(r.left-press.rect.left)>2||Math.abs(r.top-press.rect.top)>2||Math.hypot(event.clientX-press.x,event.clientY-press.y)>14||event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)return;
  activating=true;try{button.click();}finally{activating=false;}
 },true);
 root.addEventListener('click',event=>{if(!activating&&event.isTrusted&&event.detail>0&&clock()-lastRelease<750){event.preventDefault();event.stopImmediatePropagation();}},true);
 const cancel=()=>{held=null;lastRelease=clock();};window.addEventListener('blur',cancel);window.addEventListener('orientationchange',cancel);document.addEventListener('visibilitychange',cancel);return{cancel};
}
