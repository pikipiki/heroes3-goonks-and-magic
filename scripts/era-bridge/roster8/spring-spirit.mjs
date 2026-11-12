/** Exact shipped350 intrinsic property closure, including inactive fields.
 * amethyst2_4.dll initializes new aftercast selectors to9(DEFAULT), and the
 * second after-defend slot is executed only inside a nonzero first-slot branch.
 * Do not invent Hypnotize or Shield casts from dormant settings.
 */
export const SOURCE_SPRING_SPIRIT_CONTRACT='source-spring-spirit-v1';
export function reviewedSpringSpirit(text,{contract,sourceId}={}){
 if(contract!==SOURCE_SPRING_SPIRIT_CONTRACT||sourceId!==350)throw Error('Explicit source350 contract required');
 const fields=new Map();for(const line of text.split(/\r?\n/)){const m=/^([^=]+)=(.*)$/.exec(line.trim());if(m){if(fields.has(m[1]))throw Error('Duplicate Spring Spirit field');fields.set(m[1],Number(m[2]));}}
 const expected={ACAST_CUSTOM_Chance:100,ACAST_CUSTOM_Spell:60,AfterDefendSpell2:27,Flags:524291,Level:6,Town:1,RegenerationHitPoints:100,RegenerationChance:100,StrikeAllAroundRange:1};
 if(fields.size!==Object.keys(expected).length||Object.entries(expected).some(([k,v])=>fields.get(k)!==v))throw Error('Unreviewed source350 definition');
 return {inactiveKeys:['ACAST_CUSTOM_Chance','ACAST_CUSTOM_Spell','AfterDefendSpell2'],
  services:{sourceRegeneration:{hitPoints:100,chancePercent:100},sourceSplashRangeOne:{}},
  evidence:['amethyst2_4.dll100132CB..DC defaultsaftercastselector9 for1024entries; CFG hasnoSpell effect selector',
   'amethyst2_4.dll1001BCE9..BD67:nonzerofirstAfterDefendslotrequired beforesecondslot',
   'amethyst2_4.dll10015BF0..CA5 and10016E00..63:floor(pixelD²/4096)<=radius² includingsecondhex',
   'Amethyst tables.cppRegeneration5106..5128:uniform0..99 wheneverpoints/chancepositive']};
}
