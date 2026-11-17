// Bulk transfers preserve the destination, merge matching creature types and
// leave one creature with a source hero when everything else fits.
export function bulkTransferSummary(from,to){
 if(!from||!to||from.id===to.id)return{count:0,blocked:false,keepsOne:false};
 const groups=new Map();
 for(const unit of to.slots||[])if(unit?.count>0)groups.set(unit.id,(groups.get(unit.id)||0)+unit.count);
 let count=0,blocked=false;
 for(const unit of from.slots||[])if(unit?.count>0){
  if(!groups.has(unit.id)&&groups.size>=7){blocked=true;continue;}
  groups.set(unit.id,(groups.get(unit.id)||0)+unit.count);count+=unit.count;
 }
 const keepsOne=!!from.needsLastStack&&!blocked&&count>0;
 return{count:Math.max(0,count-(keepsOne?1:0)),blocked,keepsOne};
}
