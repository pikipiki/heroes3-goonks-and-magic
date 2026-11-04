/** Scoped category correspondence; requires explicit caller opt-in and native controls. */
export const nativeBiologyContract='source-biological-flags-v1';
export function classifySourceBiology(mask){
 if(!Number.isInteger(mask)||mask< -2147483648||mask>2147483647)throw Error('Signed source flag mask required');const bits=mask>>>0,alive=!!(bits&16),undead=!!(bits&0x40000),mind=!!(bits&0x400),noMorale=!!(bits&0x20000),source={alive,undead,mind,noMorale};
 if(alive&&undead)return{source,closed:false,error:'CONFLICTING_BIOLOGY_FLAGS',reason:'ALIVE+UNDEAD absent from pinned175 masks; Poison and Resurrection gates differ. No guessed dual nature.'};
 if(alive)return{source,closed:true,nature:'LIVING',reason:'Presence of nativeLIVING equals originalALIVE without adding native nature exclusions'};
 if(undead&&mind&&noMorale)return{source,closed:true,nature:'UNDEAD',reason:'Native derived mental immunity and zero morale are already explicit sourceMIND/NO_MORALE'};
 if(!undead&&mind&&noMorale)return{source,closed:true,nature:'NON_LIVING',reason:'Native extra mental exclusions and zero morale are redundant with explicit sourceMIND/NO_MORALE'};
 return{source,closed:false,reason:'NativeNON_LIVING/UNDEAD would introduce mental exclusions or zero morale absent from source flags'};
}
