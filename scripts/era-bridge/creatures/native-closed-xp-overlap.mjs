/** Source bit mutations cannot be layered on top of immutable creature bonuses. */
const bits={A:19,B:3,F:1,M:17,p:10,P:10,R:16,U:18,D:15};
export function intrinsicXPObligations(flags,sourceRows,cfgAbilities={}){
 const mask=flags>>>0,result=[];for(const row of sourceRows){if(row.code==='f'&&bits[row.modifier]!==undefined){const present=!!(mask&(2**bits[row.modifier]));if(present&&row.values.includes(0))result.push({code:'xp-clears-intrinsic-source-flag-not-native-bonus',modifier:row.modifier,line:row.line});if(present&&row.modifier==='D'&&row.values.includes(1))result.push({code:'xp-doubleattack-would-duplicate-intrinsic-additional-attack',line:row.line});if(row.modifier==='U'&&(mask&16)&&row.values.includes(1))result.push({code:'xp-introduces-unproved-ALIVE-plus-UNDEAD',line:row.line});}}
 return result;
}
