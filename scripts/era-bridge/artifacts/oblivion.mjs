/** Whole source268 binding; unknown or partial policy settings stay closed. */
export const SOURCE_OBLIVION_CONTRACT='source-ring-oblivion-v1';
export const OBLIVION_NATIVE_CONTROLS=Object.freeze([
 'revival-equipped-38','revival-equipped-39','revival-backpack-38','revival-backpack-39',
 'sacrifice-equipped','sacrifice-backpack',
 'necromancy-baseline','necromancy-equipped','necromancy-backpack','necromancy-enemy','necromancy-both',
 'geometry-single','geometry-double','clone-equipped','clone-backpack','result-cache-cleared',
]);
export function validateOblivion(root){
 if(!root||Object.keys(root).sort().join(',')!=='artifact,schemaVersion'||root.schemaVersion!==1||root.artifact!=='tum-era:artifact268')throw Error('Whole original268 Ring of Oblivion binding required');
 return structuredClone(root);
}
export function validateOblivionEvidence(proof){
 if(proof?.passed!==true||proof.contract!==SOURCE_OBLIVION_CONTRACT||proof.pendingNativeControls?.length!==0||Object.keys(proof.controls??{}).sort().join(',')!==[...OBLIVION_NATIVE_CONTROLS].sort().join(','))throw Error('All16 matching native Ring of Oblivion controls required');
 for(const name of OBLIVION_NATIVE_CONTROLS)if(proof.controls[name]?.passed!==true||!/^[0-9a-f]{64}$/.test(proof.controls[name].engineSHA256??''))throw Error('Missing native proof provenance: '+name);
 return structuredClone(proof);
}
