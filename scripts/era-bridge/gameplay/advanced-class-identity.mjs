/** Original class lookup only; class promotion and full profile admission remain separate. */
import {createHash} from 'node:crypto';
import {compileErm} from '../campaigns/parser.mjs';
import {advancedClassPointsSource} from './advanced-class-points.mjs';
export const advancedClassIdentitySource=Object.freeze({
 ...advancedClassPointsSource,function:'acm_GetHeroClass',
 functionSha256:'534b93b5c019a48d978e18288d90897870a6738119084b496fd3fcb08f1adc94',
});
// Values from the pinned script's DC declarations (lines130-149), not class labels.
export const advancedClassIdentityBindings=Object.freeze({
 acm_GetHeroClass:9403,TRUE:1,ACM_NO_CLASS:0,ACM_NO_CLASS_LEVEL:0,
 ACM_CLASS_WARRIOR:1,ACM_CLASS_MAGE:2,ACM_CLASS_ADVENTURER:4,
 ACM_CLASS_HUNTER:5,ACM_CLASS_BATTLEMAGE:3,ACM_CLASS_DRUID:6,
 ACM_CLASS_LEVEL_MASTER:4,ACM_CLASS_LEVEL_GRANDMASTER:5,
});
export function compileAdvancedClassIdentity(bytes){
 bytes=Buffer.from(bytes);
 if(createHash('sha256').update(bytes).digest('hex')!==advancedClassIdentitySource.functionSha256)
  throw Error('Advanced Classes original class lookup identity changed');
 return compileErm(Buffer.concat([Buffer.from('ZVSE2\n'),bytes]),{
  source:'Advanced Classes 1.1 / acm_GetHeroClass',bindings:advancedClassIdentityBindings,
 });
}
