/** Pinned Archer ERM L/P transitions. This module never infers ERA levels from VCMI levels. */
export const archerContract='tum35-archer-final-experience-v1';
export function finalArcherProfile(eraId, profile, fightValue, bloodFightValue) {
 if(!Number.isInteger(eraId)||!Number.isInteger(fightValue)||!Number.isInteger(bloodFightValue)||bloodFightValue<=0)throw new TypeError('Exact source identity and FightValue required');
 const value={...profile},transitions=[];
 const lp=(phase,fullRank10,rank11Extra)=>{value.fullRank10=fullRank10;value.rank11Extra=rank11Extra;transitions.push({phase,fullRank10,rank11Extra});};
 if(fightValue>=bloodFightValue)lp('OnAfterErmInstructions:720',147000,14700);
 if([220,346,347].includes(eraId)){value.experienceMultiplier=.5;transitions.push({phase:'OnAfterErmInstructions:EA:M500',experienceMultiplier:.5});}
 if([341,342].includes(eraId))lp('OnAfterErmInstructions:727-728',122500,12250);
 if([343,344,345].includes(eraId))lp('OnAfterErmInstructions:729-731',147000,14700);
 if([346,347].includes(eraId))lp('OnAfterErmInstructions:734-735',164500,16450);
 // This later hook intentionally supersedes earlier per-creature L/P writes.
 if(eraId>=197&&fightValue>=bloodFightValue)lp('OnAfterErmInited:1126',147000,14700);
 return {profile:value,transitions,multiplierInstruction:undefined};
}
