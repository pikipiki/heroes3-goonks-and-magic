/** Exact269/27010%,27125%; distinct equipped identities count once. */
export function validateInterferencePolicy(root){
 if(!root||Array.isArray(root)||Object.keys(root).sort().join(',')!=='artifacts,schemaVersion'||root.schemaVersion!==1||!root.artifacts||Array.isArray(root.artifacts)||typeof root.artifacts!=='object')throw Error('Invalid source Interference services');
 for(const[id,service]of Object.entries(root.artifacts)){
  const percent=id==='tum-era:artifact269'||id==='tum-era:artifact270'?10:id==='tum-era:artifact271'?25:0;
  if(!percent||!service||Object.keys(service).join(',')!=='interference'||!service.interference||Object.keys(service.interference).join(',')!=='percent'||service.interference.percent!==percent)throw Error('Unsupported source Interference contract');
 }
 return structuredClone(root);
}
