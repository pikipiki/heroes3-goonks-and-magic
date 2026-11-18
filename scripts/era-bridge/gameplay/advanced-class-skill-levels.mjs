/** Original get/set skill-level routing only; skill effects and pack admission are separate. */
import {createHash} from 'node:crypto';
import {compileErm} from '../campaigns/parser.mjs';
import {advancedClassPointsSource} from './advanced-class-points.mjs';
export const advancedClassSkillLevelsSource=Object.freeze({
 ...advancedClassPointsSource,function:'acm_GetSecSkillLevel + acm_SetSecSkillLevel',
 functionSha256:'93fd9124497fa6524bd189b296ae0ab5256a5cd73852e43f1f71d0d5284d9557',
});
export const advancedClassSkillLevelsBindings=Object.freeze({
 acm_GetSecSkillLevel:9405,acm_SetSecSkillLevel:9406,
 H3_Mod_Check_Skill_Level:9407,H3_Mod_Set_Skill_ExtraLevel:9408,
 SKILL_NOT_LEARNED:0,SKILL_EXPERT:3,ACM_SKILL_MASTER:4,ACM_SKILL_GRANDMASTER:5,
 FALSE:0,TRUE:1,
});
export function compileAdvancedClassSkillLevels(bytes){
 bytes=Buffer.from(bytes);
 if(createHash('sha256').update(bytes).digest('hex')!==advancedClassSkillLevelsSource.functionSha256)
  throw Error('Advanced Classes original skill-level routing identity changed');
 return compileErm(Buffer.concat([Buffer.from('ZVSE2\n'),bytes]),{
  source:'Advanced Classes 1.1 / skill-level routing',bindings:advancedClassSkillLevelsBindings,
 });
}
