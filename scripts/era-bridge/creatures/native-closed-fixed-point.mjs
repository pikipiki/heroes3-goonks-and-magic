/** All admitted members must be locally complete and depend only on admitted members. */
export function closeCreatureDependencies(records,registered=new Set()){
 const byId=new Map();for(const r of records){if(byId.has(r.nativeId)||registered.has(r.nativeId))throw Error('Conflicting creature identity:'+r.nativeId);byId.set(r.nativeId,r);}
 const accepted=new Set(records.filter(r=>r.obligations.length===0).map(r=>r.nativeId)),removed=[];let changed=true;
 while(changed){changed=false;for(const nativeId of [...accepted]){const r=byId.get(nativeId),missing=r.dependencies.filter(id=>!registered.has(id)&&!accepted.has(id));if(missing.length){accepted.delete(nativeId);removed.push({nativeId,missing,code:'dependency-not-closed'});changed=true;}}}
 return{accepted:records.filter(r=>accepted.has(r.nativeId)),rejected:records.filter(r=>!accepted.has(r.nativeId)),removed};
}
export function assertPinned(label,actual,expected){if(actual!==expected)throw Error('Changed pinned source:'+label);}
