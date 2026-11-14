/** Exact aura contract consumed by the existing EraSourceFear service. */
export function sourceAdventureFearAura(sourceId){
 if(![253,306,330].includes(sourceId))throw Error('Unreviewed adventure Fear actor');
 return {type:'FEARFUL',val:10,valueType:'INDEPENDENT_MAX',propagator:'BATTLE_WIDE',propagationUpdater:'BONUS_OWNER_UPDATER',
  limiters:['OPPOSITE_SIDE',['noneOf',...['NO_MORALE','UNDEAD','NON_LIVING','MECHANICAL','SIEGE_WEAPON'].map(bonusType=>({type:'HAS_ANOTHER_BONUS_LIMITER',bonusType}))]],
  stacking:`eraSourceFear:${sourceId}:v1`};
}
export function sourceAdventureFearRank8(row){
 if(row?.bonus?.type!=='FEARFUL'||row.bonus.valueType!=='ADDITIVE_VALUE'||JSON.stringify(row.values)!==JSON.stringify([0,0,0,0,0,0,0,1,1,1]))throw Error('Changed source330 rank8 Fear row');
 return {bonus:sourceAdventureFearAura(330),values:row.values.map(Boolean)};
}
