// A bulk transfer replaces the destination formation. Its old stacks return
// to the source; a hero retains one creature if the destination was empty.
export function bulkTransferSummary(from,to){
 if(!from||!to||from.id===to.id)return{count:0,blocked:false,keepsOne:false};
 const units=(from.slots||[]).filter(Boolean),total=units.reduce((n,u)=>n+u.count,0);
 const keepsOne=!!from.needsLastStack&&!(to.slots||[]).some(Boolean)&&total>0;
 return{count:Math.max(0,total-(keepsOne?1:0)),blocked:false,keepsOne};
}
