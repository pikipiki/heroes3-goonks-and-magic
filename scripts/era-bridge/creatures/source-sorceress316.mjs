/** Source isSorceress316 and ShotType2; no approximate random-spell replacement. */
export function sourceSorceress316Services(cfg,{deathCloudSpell}={}){
 const fields=Object.fromEntries(cfg.trim().split(/\r?\n/).map(l=>l.split('=').map(s=>s.trim())));
 if(Number(fields.isSorceress)!==1||Number(fields['Shot type'])!==2)throw Error('Exact source316 Sorceress1/ShotType2 required');
 if(!deathCloudSpell?.levels)throw Error('Validated original ShotType2 death-cloud kernel required');
 const spell=structuredClone(deathCloudSpell);spell.name='Sorceress Death Cloud';
 return{consumedKeys:['isSorceress','Shot type'],abilities:{sourceSorceressCloud:{type:'SPELL_LIKE_ATTACK',subtype:'tum-era:sourceSorceressDeathCloud'}},spells:{sourceSorceressDeathCloud:spell},featureSourceId:316,source:{selector:'75C979 shot only,20+2*currentCount',pool:'75B6AE..75B9E4 count thresholds10/20/50, weighted original15 candidates',filters:'75BA20..75C145 original source biology/IDs/artifacts and active effects',resistance:'75C28C..75C50B original hero/racial/XP and pendants',cloud:'ShotType2 source43FCDC, living-only collateral, primary unconditional'}};
}
