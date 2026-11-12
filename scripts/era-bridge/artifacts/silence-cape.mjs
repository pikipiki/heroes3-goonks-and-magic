/** Actual source267 CFG: neither a spell-level cap nor a bilateral cast block. */
import{compileArtifactDefinition,parseArtifactCfg}from'./artifacts.mjs';
export const SILENCE_CAPE_SOURCE_IDS=Object.freeze([43,37,42,37,41,53,36,31,32,27,54,46,62,24,47,13,51,16,17,18,31,10,64,45]);
export function compileSilenceCape({text,...options}){
 const parsed=parseArtifactCfg(text,{duplicates:'emerald-first'});
 if(parsed.diagnostics.length||parsed.entries.length!==1||parsed.entries[0].key!=='Immunities'||JSON.stringify(parsed.entries[0].value)!==JSON.stringify(SILENCE_CAPE_SOURCE_IDS))throw Error('Changed source267 immunity contract');
 return compileArtifactDefinition({...options,id:267,text,duplicates:'emerald-first'});
}
