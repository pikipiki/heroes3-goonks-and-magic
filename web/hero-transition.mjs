// Native windows can render before their throttled snapshot reaches the browser.
// Freeze the already presented mobile view from the opening command until the
// new snapshot and its canvas are ready. A rejected/no-op command cannot stall it.
const adapted=new Set(['map','battle','hero','spellbook','fort','recruit','creature','town','campaign-scenario','market','hero-exchange']);
export function opensMobileWindow(action,value=0){return [0,5,30,33,39,41,42,43,49,54,55,63,72,74,93].includes(action)||action===14&&value===0||action===62&&value===17;}
export function createHeroTransition(apply,{now=()=>performance.now(),timeout=2000,ready=()=>true}={}){let pending=null,frames=0,waiting=null;return{
 begin(currentMode){if(!waiting)waiting={mode:currentMode,until:now()+timeout};},
 receive(next,currentMode){
  if(waiting&&!next.openTownHall&&next.mode===waiting.mode&&now()<waiting.until)return;
  waiting=null;
  if(!next.openTownHall&&adapted.has(next.mode)&&(currentMode!==next.mode||!ready(next))){if(pending?.mode!==next.mode)frames=0;pending=next;return;}
  pending=null;frames=0;apply(next);
 },
 frame(){if(waiting){if(now()<waiting.until)return true;waiting=null;}
  if(!pending)return false;if(!ready(pending)){frames=0;return true;}if(++frames<2)return true;const next=pending;pending=null;frames=0;apply(next);return false;},
 get pending(){return !!pending||!!waiting;}
};}
