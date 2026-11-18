import fs from 'node:fs';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
import {compileAdvancedClassSkillLevels,advancedClassSkillLevelsBindings} from '../../scripts/era-bridge/gameplay/advanced-class-skill-levels.mjs';
export const skillLevelInputs=[-10,-1,0,1,2,3,4,5,6,10,2147483647,-2147483648];
export const skillLevelExpected=[0,0,0,1,2,3,4,5,5,5,5,0];
export function advancedClassSkillLevelsFixture(){
 const body=fs.readFileSync('tests/fixtures/era-gameplay/advanced-class-skill-levels-1.1.erm');
 compileAdvancedClassSkillLevels(body);
 const probes=skillLevelInputs.map((input,index)=>`
!#FU(acm_SetSecSkillLevel):P7/0/${input};
!#HE7:S0/?v901;
!#FU(acm_GetSecSkillLevel):P7/0/?v902;
!#SN:W^H3_Pathfinding_0_Hero7^/?v903;
!#SN:W^H3_Pathfinding_1_Hero7^/?v904;
!#IF:M^SKILL ${index} %V901/%V902/%V903/%V904^;`).join('\n');
 // Controlled dependency adapters for Pathfinding only. The original helpers
 // read skill-name arrays and local z strings, which are not admitted here.
 const source=Buffer.concat([Buffer.from('ZVSE2\n'),body,Buffer.from(`
!?FU(H3_Mod_Check_Skill_Level);
!!VRx2:S0; !!VRx3:S0;
!!FU&x4<>0:E;
!!SN:W^H3_Pathfinding_0_Hero%X1^/?x2;
!!SN:W^H3_Pathfinding_1_Hero%X1^/?x3;
!?FU(H3_Mod_Set_Skill_ExtraLevel);
!!FU&x4<>0:E;
!!SN:W^H3_Pathfinding_0_Hero%X1^/x2;
!!SN:W^H3_Pathfinding_1_Hero%X1^/x3;
!#IF:M^SKILL ENTRY^;
${probes}
!#FU(acm_SetSecSkillLevel):P7/0/5;
!#HE7:S0/2;
!#FU(acm_GetSecSkillLevel):P7/0/?v902;
!#IF:M^SKILL STALE %V902^;
!#HE7:S1/3;
!#FU(acm_GetSecSkillLevel):P7/1/?v902;
!#IF:M^SKILL OTHER %V902^;
!#VRv950:S10 F9/3;
!#VRv951:S6 F0/5/0/17;
!#VRv952:S3 F0/5/0/17;
!#VRv953:S-2147483648 F-2147483648/2147483647;
!#IF:M^BOUNDS %V950/%V951/%V952/%V953^;
`)]);
 const program=compileErm(source,{source:'Private original Advanced Classes skill-level routing',bindings:advancedClassSkillLevelsBindings});
 program.originalMessages=['ZVSE private native companion town continuation'];return program;
}
