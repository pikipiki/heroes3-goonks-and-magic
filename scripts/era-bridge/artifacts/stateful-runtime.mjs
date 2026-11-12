/** Strict source264/265 service schema; candidates do not activate themselves. */
export function validateStatefulArtifactPolicy(root){
 if(!root||Array.isArray(root)||Object.keys(root).sort().join(',')!=='artifacts,schemaVersion'||root.schemaVersion!==1||!root.artifacts||Array.isArray(root.artifacts)||typeof root.artifacts!=='object')throw Error('Invalid source stateful artifact services');
 for(const[id,service]of Object.entries(root.artifacts))if(!['tum-era:artifact264','tum-era:artifact265'].includes(id)||!service||Object.keys(service).join(',')!=='storedEqualization'||!service.storedEqualization||Array.isArray(service.storedEqualization)||typeof service.storedEqualization!=='object'||Object.keys(service.storedEqualization).length)throw Error('Unsupported source stored equalization binding');
 return structuredClone(root);
}
