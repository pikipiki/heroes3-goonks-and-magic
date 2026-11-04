// CSS pixels, not the canvas backing resolution or the previous orientation.
const viewports=new WeakMap();
function revision(win){
 if(!win)return 0;
 let state=viewports.get(win);
 const key=()=>{const v=win.visualViewport;return [win.innerWidth,win.innerHeight,v?.width,v?.height,v?.offsetLeft,v?.offsetTop,v?.scale].join(':');};
 if(!state){state={key:key(),value:0};viewports.set(win,state);const changed=()=>{const next=key();if(next!==state.key){state.key=next;state.value++;}};win.addEventListener('resize',changed);win.addEventListener('orientationchange',()=>{state.value++;changed();});win.visualViewport?.addEventListener('resize',changed);win.visualViewport?.addEventListener('scroll',changed);}
 const next=key();if(next!==state.key){state.key=next;state.value++;}return state.value;
}
export function touchGeometry(element){const r=element.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width??r.right-r.left,height:r.height??r.bottom-r.top,revision:revision(element.ownerDocument?.defaultView)};}
export function sameTouchGeometry(element,before){if(!before)return false;const now=touchGeometry(element);return now.revision===before.revision&&['left','top','width','height'].every(k=>Math.abs(now[k]-before[k])<1);}
export function localPointer(element,event){const r=element.getBoundingClientRect();if(!r.width||!r.height)return null;return {x:(event.clientX-r.left)*(element.clientWidth/r.width),y:(event.clientY-r.top)*(element.clientHeight/r.height)};}
// Safari can report detail=0 on touch-generated clicks. Only a completed
// pointer pair may activate pointer controls; detail=0 keyboard clicks stay valid.
export const isPointerClick=e=>e.detail>0||!!e.pointerType||!!e.sourceCapabilities?.firesTouchEvents;
