/** Exact split260 contract. No generic terrain-free or always-on movement aura. */
export function validateWayfarer260(root){if(!root||Object.keys(root).sort().join(',')!=='artifact,schemaVersion'||root.schemaVersion!==1||root.artifact!=='tum-era:artifact260')throw Error('Invalid original260 Wayfarer binding');return structuredClone(root);}
