/** Separate native-port targets. These are build inputs, not playable mod switches. */
export const profileDefinitions=Object.freeze([
 {id:'wog',packs:['wog-scripts','erm-framework','henchmen']},
 {id:'era-scripts',packs:['wog-scripts','erm-framework','henchmen','era-scripts']},
 {id:'advanced-classes',packs:['wog-scripts','erm-framework','henchmen','era-scripts','advanced-classes']},
 {id:'reborn',packs:['wog-scripts','erm-framework','henchmen','era-scripts','reborn']}
]);

export const sourcePacks=Object.freeze([
 {id:'henchmen',directory:'Enhanced Henchmen'},
 {id:'erm-framework',directory:'Era Erm Framework'},
 {id:'wog-scripts',directory:'WoG Scripts'},
 {id:'era-scripts',directory:'ERA Scripts'},
 {id:'advanced-classes',directory:'Advanced Classes Mod'}
]);

/** Full-system admission is intentionally independent of unit-test/model coverage.
 * Proofs must be checked by the native integration validator before this call.
 * A profile can only belong to one game; installed mods are never mutated here.
 */
export function profileAdmission(id,inventory,verifiedProofs=[]){
 const definition=profileDefinitions.find(profile=>profile.id===id);
 if(!definition)throw Error('Unknown ERA gameplay profile: '+id);
 const blockers=[];
 for(const packId of definition.packs){
  const pack=inventory.packs.find(pack=>pack.id===packId);
  if(!pack||!pack.files.length){blockers.push({pack:packId,reason:'missing-source'});continue;}
  const proof=verifiedProofs.find(proof=>proof.pack===packId);
  if(!proof||proof.status!=='validated-native-system'||proof.sourceSha256!==pack.sha256
   ||!proof.engineSha256||!proof.saveLoad||!proof.mobileUI||!proof.ai||!proof.completeRules){
   blockers.push({pack:packId,reason:'native-system-not-validated'});
  }
 }
 // No caller-supplied "enabled" flag may bypass missing source or native proof.
 return {id,packs:[...definition.packs],enabled:blockers.length===0,blockers};
}
