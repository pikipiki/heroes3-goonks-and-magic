/** Source CRT law binding; a descriptor is an obligation until its policy is enrolled. */
export const SOURCE_DEATH_BLOW_CONTRACT='source-deathblow-crt-v1';
const actors=new Map([[238,'tum-era:ancestralBehemoth'],[318,'tum-era:eraCreature318'],[361,'tum-era:eraCreature361'],[319,'tum-era:eraCreature319']]);
export function requireSourceDeathBlowBinding(binding,{sourceId,kind,nativeExperienceProfile}={}){
 const admitted=kind==='cfg'?[238,318]:kind==='xp'?[361,319]:[];
 if(!binding||binding.contract!==SOURCE_DEATH_BLOW_CONTRACT||binding.operation!=='deathBlowCRT'||binding.kind!==kind||binding.sourceId!==sourceId||binding.nativeId!==actors.get(sourceId)||!admitted.includes(sourceId)||nativeExperienceProfile!==true||binding.nativeExperienceProfile!==true)throw new TypeError('source-deathblow-crt-binding-required');
 if(!binding.parameters||typeof binding.parameters!=='object'||Array.isArray(binding.parameters)||![Object.prototype,null].includes(Object.getPrototypeOf(binding.parameters))||Object.keys(binding.parameters).length)throw new TypeError('source-deathblow-crt-empty-operation-required');
 return {contract:SOURCE_DEATH_BLOW_CONTRACT,operation:'deathBlowCRT',parameters:{},sourceId,nativeId:binding.nativeId,kind,nativeExperienceProfile:true,implementation:'EraBridgePolicies deathBlowCRT + BattleActionProcessor source CRT route',evidence:['docs/era-bridge/source-death-blow-evidence.json'],activationReady:false};
}
export function createSourceDeathBlowBinding({contract,sourceId,nativeId,kind,nativeExperienceProfile}={}){
 return requireSourceDeathBlowBinding({contract,operation:'deathBlowCRT',parameters:{},sourceId,nativeId,kind,nativeExperienceProfile},{sourceId,kind,nativeExperienceProfile});
}
