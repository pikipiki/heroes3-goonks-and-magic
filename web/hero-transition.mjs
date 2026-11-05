// Native state is published before its canvas is presented. Keep the previous
// mobile view intact until a complete presentation frame has passed.
export function createHeroTransition(apply){let pending=null,frames=0;return{
 receive(next,currentMode){if(next.mode==='hero'&&currentMode!=='hero'){if(!pending)frames=0;pending=next;return;}pending=null;frames=0;apply(next);},
 frame(){if(!pending)return false;if(++frames<2)return true;const next=pending;pending=null;frames=0;apply(next);return false;},
 get pending(){return !!pending;}
};}
