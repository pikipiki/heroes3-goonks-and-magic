// Act on release, with a click fallback for keyboards and assistive technology.
// Suppress the compatibility click so one tap can never toggle twice.
export function bindPress(button,activate,{clock=()=>performance.now()}={}){
 let press=null,lastRelease=-Infinity;
 button.addEventListener('pointerdown',event=>{if(button.disabled||event.isPrimary===false||event.button>0)return;press={id:event.pointerId,x:event.clientX,y:event.clientY};try{button.setPointerCapture(event.pointerId);}catch{}});
 button.addEventListener('pointercancel',()=>{press=null;lastRelease=clock();});
 button.addEventListener('pointerup',event=>{if(!press||press.id!==event.pointerId)return;const start=press;press=null;lastRelease=clock();try{if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);}catch{}const r=button.getBoundingClientRect();if(button.disabled||Math.hypot(event.clientX-start.x,event.clientY-start.y)>12||event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)return;event.preventDefault();event.stopPropagation();activate();});
 button.addEventListener('click',event=>{event.stopPropagation();if(button.disabled)return;if(event.detail===0||clock()-lastRelease>600)activate();});
}
