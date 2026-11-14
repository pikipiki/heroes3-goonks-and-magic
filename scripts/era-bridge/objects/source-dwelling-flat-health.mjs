/** Exact source H+309/310 carriers. Numeric XP series become deltas in VCMI;
 * a common stacking tag would retain the largest delta instead of the curve.
 * Boolean ERA rank intervals preserve one absolute carrier at every rank.
 */
export const SOURCE_DWELLING_FLAT_HEALTH=Object.freeze([0,1,2,4,5,7,8,10,11,13,14]);
export function sourceDwellingFlatHealthRows(values){
 if(JSON.stringify(values)!==JSON.stringify(SOURCE_DWELLING_FLAT_HEALTH))throw Error('Changed dwelling additive source health');
 return values.slice(1).map((val,index)=>({bonus:{type:'NONE',val,hidden:true,valueType:'ADDITIVE_VALUE',stacking:'sourceDwellingFlatHealth:v1'},values:Array.from({length:10},(_,rank)=>rank===index)}));
}
