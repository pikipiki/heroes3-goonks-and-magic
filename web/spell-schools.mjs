// Mobile tab order: All, Air, Earth, Fire, Water.
// Native SpellSchool IDs: ANY=-1, AIR=0, FIRE=1, EARTH=2, WATER=3.
export const spellSchoolIds=Object.freeze([-1,0,2,1,3]);
export const spellSchoolIndex=school=>spellSchoolIds.indexOf(school);
