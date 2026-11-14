export type HeroesStack = {id: number; side: number; count: number; name: string; creature: string; shooter: boolean; health: number; damageMin?:number;damageMax?:number;defense?:number;attack?:number;speed?:number};
export type BattlePlan = {version: 1; battleId: number; stacks: (HeroesStack & {unit: number; heroes?:boolean})[]};
export type BattleState = {battleId: number; frame: number; finished: boolean; groups: {id: number; side: number; initial: number; survivors: number}[]};
export function battlePlan(value: {battleId: number; stacks: HeroesStack[]}): BattlePlan {
 const plan: BattlePlan = {version:1,battleId:value.battleId,stacks:value.stacks.map(row=>({...row,heroes:!row.creature.startsWith("heroes-starcraft:"),unit:row.creature==="heroes-starcraft:zergling"?37:row.creature.startsWith("heroes-starcraft:")?0:row.shooter?0:37}))};
 validateBattlePlan(plan);return plan;
}
export function validateBattlePlan(value: BattlePlan): void {
 if(value.version!==1 || !Number.isSafeInteger(value.battleId) || value.battleId<0 || !Array.isArray(value.stacks) || value.stacks.length<2 || value.stacks.length>32)throw Error('Combat Heroes invalide.');
 const ids=new Set<number>(),totals=[0,0];
 for(const row of value.stacks){
  if(!Number.isSafeInteger(row.id)||row.id<0||ids.has(row.id)||![0,1].includes(row.side)||!Number.isSafeInteger(row.count)||row.count<1||row.count>128||![0,32,37].includes(row.unit))throw Error('Troupe Heroes invalide.');
  if(row.heroes && (!Number.isSafeInteger(row.health)||row.health<1||row.health>10000))throw Error('Points de vie Heroes invalides.');
  ids.add(row.id);totals[row.side]+=row.count;
 }
 if(totals.some(total=>total<1||total>128))throw Error('Ce test accepte de 1 à 128 créatures par armée.');
}
export function battleResult(plan: BattlePlan,state: BattleState): [number,number][] {
 if(state.battleId!==plan.battleId||!state.finished||!Number.isSafeInteger(state.frame)||state.frame<1||!Array.isArray(state.groups)||state.groups.length!==plan.stacks.length)throw Error('Résultat StarCraft incomplet ou périmé.');
 const seen=new Set<number>(),totals=[0,0];
 const result=state.groups.map(row=>{
  const original=plan.stacks.find(stack=>stack.id===row.id);
  if(!original||seen.has(row.id)||row.side!==original.side||row.initial!==original.count||!Number.isSafeInteger(row.survivors)||row.survivors<0||row.survivors>row.initial)throw Error('Pertes StarCraft incohérentes.');
  seen.add(row.id);totals[row.side]+=row.survivors;return [row.id,row.survivors] as [number,number];
 });
 if(totals.every(total=>total>0))throw Error('La bataille StarCraft continue.');
 return result;
}
