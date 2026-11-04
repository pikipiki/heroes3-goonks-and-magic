// Match the engine's bulk move rules: merge identical creatures, use free
// slots for new types, never swap away a destination stack, and leave a hero
// one creature only when every source stack would otherwise be moved.
export function bulkTransferSummary(from,to){
 if(!from||!to||from.id===to.id)return{count:0,blocked:false,keepsOne:false};
 const types=new Set((to.slots||[]).filter(Boolean).map(u=>u.id));let free=7-(to.slots||[]).filter(Boolean).length,count=0,blocked=false;
 for(const unit of (from.slots||[]).filter(Boolean)){
  if(types.has(unit.id))count+=unit.count;
  else if(free>0){free--;count+=unit.count;/* The native command uses original destination types. */}
  else blocked=true;
 }
 const keepsOne=!!from.needsLastStack&&!blocked&&count>0;
 return{count:Math.max(0,count-(keepsOne?1:0)),blocked,keepsOne};
}
