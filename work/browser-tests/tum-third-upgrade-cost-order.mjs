/** Follow native buildability. Never rewrite prerequisites or prebuild a target. */
export function selectNativeCostTarget(targets,buildings,purchasedIds){
 const seen=new Set(purchasedIds);
 return targets.find(target=>!seen.has(target.id)&&buildings.some(building=>building.id===target.id&&!building.built&&building.allowed===true));
}
