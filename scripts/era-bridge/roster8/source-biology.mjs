import {classifySourceBiology} from '../creatures/biology.mjs';

export const SOURCE_INANIMATE_BIOLOGY_CONTRACT='source-biological-flags-inanimate-v1';

/** ALIVE and UNDEAD are independent source flags. A native nature marker can
 * suppress automatic LIVING without adding native NON_LIVING's morale effects.
 * Explicit MIND and NO_MORALE flags remain separate abilities in the compiler.
 * This contract deliberately does not infer undead behavior for ambiguous masks.
 */
export function classifySourceInanimateBiology(mask){
 const original=classifySourceBiology(mask);
 if(original.error||original.source.alive||original.source.undead)return original;
 return {source:original.source,closed:true,nature:'ERA_SOURCE_INANIMATE',
  reason:'Native nature-only marker suppresses automatic LIVING; no implicit UNDEAD, NON_LIVING, MIND_IMMUNITY or NO_MORALE is introduced.'};
}
