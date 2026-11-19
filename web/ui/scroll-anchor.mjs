// Keep a form's viewport stable across availability/feedback updates. Native
// touch focus may move a scroller after the event, particularly on WebKit.
// Dragging or wheeling cancels the anchor; scroll gestures are never blocked.
export function createScrollAnchor(root){
 let snapshot=null,generation=0,pointer=null;
 function capture(){
  const scroll=[];for(let node=root.parentElement;node;node=node.parentElement){const style=getComputedStyle(node);if(/auto|scroll/.test(style.overflowY)&&node.scrollHeight>node.clientHeight)scroll.push({node,top:node.scrollTop,left:node.scrollLeft,height:node.scrollHeight,width:node.scrollWidth});}
  snapshot={scroll,id:++generation};
 }
 function cancel(){snapshot=null;generation++;}
 const move=event=>{const point=event.touches?.[0]||event;if(pointer&&Math.hypot(point.clientX-pointer.x,point.clientY-pointer.y)>8)cancel();};
 root.addEventListener('pointerdown',event=>{pointer={x:event.clientX,y:event.clientY};capture();},{passive:true});
 root.addEventListener('pointermove',move,{passive:true});root.addEventListener('touchmove',move,{passive:true});root.addEventListener('wheel',cancel,{passive:true});
 root.addEventListener('keydown',event=>{if(event.target.matches('input[type=radio]')&&[' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))capture();});
 return{
  begin(){if(!snapshot)capture();},
  restore(){
   const saved=snapshot;if(!saved)return;
   const apply=()=>{if(!root.isConnected||generation!==saved.id)return;for(const {node,top,left,height,width}of saved.scroll)if(node.isConnected&&Math.abs(node.scrollHeight-height)<=1&&Math.abs(node.scrollWidth-width)<=1){node.scrollTop=top;node.scrollLeft=left;}};
   apply();requestAnimationFrame(()=>{apply();requestAnimationFrame(()=>{apply();if(snapshot===saved)snapshot=null;});});
  },
 };
}
