/** Exact independent source180/220 registry, consumed by native phase4 only. */
export function validateAdvancedArtifactPolicy(policy){
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x),keys=(x,expected)=>object(x)&&JSON.stringify(Object.keys(x).sort())===JSON.stringify([...expected].sort());
 if(!keys(policy,['schemaVersion','artifacts'])||policy.schemaVersion!==1||!object(policy.artifacts))throw new TypeError('Invalid source advanced artifact policy');
 for(const [id,value]of Object.entries(policy.artifacts)){
  if(id==='tum-era:artifact180'){
   if(!keys(value,['perceivedStrength'])||!keys(value.perceivedStrength,['multiplier'])||value.perceivedStrength.multiplier!==3)throw new TypeError('Original180 requires perceived multiplier3');
  }else if(id==='tum-era:artifact220'){
   if(!keys(value,['lightningRod'])||!keys(value.lightningRod,[]))throw new TypeError('Original220 requires named LightningRod service');
  }else throw new TypeError('Unsupported advanced artifact identity');
 }
 return policy;
}
