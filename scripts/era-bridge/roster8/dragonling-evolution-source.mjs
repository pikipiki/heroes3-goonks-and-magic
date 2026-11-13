/** This global script is independent from actor CFG/XP closure. */
export const SOURCE_DRAGONLING_EVOLUTION_CONTRACT='source-dragonling-daily-evolution-v1';
export const DRAGONLING_EVOLUTION_PAIRS=Object.freeze([[341,26],[342,82],[343,134],[344,135],[345,132]].map(Object.freeze));
const targets=['core:greenDragon','core:redDragon','core:fairieDragon','core:rustDragon','core:azureDragon'];
export function sourceDragonlingEvolutionPolicy({contract,rebornEnabled,actorContracts,allowPrivateNativeReview=false}={}){
 if(contract!==SOURCE_DRAGONLING_EVOLUTION_CONTRACT||typeof rebornEnabled!=='boolean')throw Error('Explicit daily evolution contract and Reborn setting required');
 for(const[source]of DRAGONLING_EVOLUTION_PAIRS){const c=actorContracts?.[source];if(!c?.complete||!c?.nativeValidated||c.nativeId!=='tum-era:eraCreature'+source)throw Error('Actual source/native Dragonling contract required '+source);if(c.active!==true&&!allowPrivateNativeReview)throw Error('Production evolution requires registered original Dragonlings '+source);}
 return{schemaVersion:1,rebornEnabled,minimumRank:10,pairs:DRAGONLING_EVOLUTION_PAIRS.map(([source],i)=>({from:'tum-era:eraCreature'+source,to:targets[i]}))};
}
