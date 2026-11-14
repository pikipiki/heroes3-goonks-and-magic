import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export const MYSTERIOUS_CAVE_SOURCE_SHA='d4b9286b930cfc32a742571f21513170fdd243f3bccf08d9a84b14dd53c13c97';
export const MYSTERIOUS_CAVE_CONTRACT='original-mysterious-cave-v1';
const actions={20:'primary',21:'experience',22:'travel-artifacts',23:'expert-logistics',24:'expert-magic-school',25:'resource-artifact',26:'legion-artifact',27:'buy-tome',28:'spells-level1',29:'spells-level2',30:'spells-level1to3',31:'resources',32:'resources',33:'shackles',34:'enchanters',35:'movement10000',36:'first-unvisited-obelisk',37:'first-owned-unfinished-guild',38:'army-enchantments',39:'army-speed',40:'army-health',41:'hero-level',42:'gold-bag',43:'mana',44:'reroll-daily-blessing',45:'reroll-daily-blessing',46:'daily-resources',47:'daily-experience',48:'daily-movement',49:'scouting',50:'expert-estates',51:'neutral-gold-loot',52:'scourge',53:'remote-object-visit',54:'builder'};
for(let i=55;i<=61;i++)actions[i]='commander-artifact';for(let i=62;i<=64;i++)actions[i]='first-unlearned-commander-skill';
export function inspectMysteriousCave(bytes){
 assert(Buffer.isBuffer(bytes));assert.equal(sha(bytes),MYSTERIOUS_CAVE_SOURCE_SHA,'Exact supplied Cave source required');
 const text=bytes.toString('latin1'),callbacks=[...text.matchAll(/^(![?$])([^;\r\n]+);/gm)].map(m=>({kind:m[1],trigger:m[2],line:text.slice(0,m.index).split('\n').length}));
 assert.equal(callbacks.filter(c=>c.kind==='!?').length,33);assert.equal(callbacks.filter(c=>c.kind==='!$').length,1);
 for(const exact of ['!!OW&y2>=300000:R-1/6/d-300000;','!!VRw124:S7;','!!VRy1:S500R1500;','!!VRy10:R0/46/48;','!!VRy2&y1=0:S3;'])assert(text.includes(exact),'Missing source invariant '+exact);
 return {schemaVersion:1,contract:MYSTERIOUS_CAVE_CONTRACT,sourceSha256:sha(bytes),activation:false,nativeValidated:false,callbacks,rewards:Object.entries(actions).map(([choice,action])=>({choice:Number(choice),action})),emptyRange:[10,19],dailyRandomDraws:14,dailySharedAcrossCaves:true,humanTurnScope:'Each human player own-turn refreshes shared daily rolls and decrements all hero timers; AI turns do not refresh.',tomePrice:300000,temporaryCounters:7,weeklyReset:'First weekday, once per human turn; cave values rerolled in source63/56 then63/55 order.',sourceExceptions:[
  {id:'description-versus-execution',rule:'Actual code wins over comments: tome costs300000; XP range500..2000×month; Builder starts7 rather than prose9.'},
  {id:'no-precognition-reward',rule:'Choices44/45 reroll into46..48; watcher hints are an INI setting, not an earned reward.'},
  {id:'ordered-object-search',rule:'Obelisk, guild and remote visits choose the first eligible object in source cursor order; no random choice.'},
  {id:'prison-levels-disabled',rule:'Prison reset DO32466132 and blacksmith ghost removal FU:E are disabled in the supplied source.'}
 ],requiredNativeSubsystems:['Weekly source-order Cave rolls','Shared14-draw daily rolls','Per-human-turn persistent counters','Tome confirmation before spending/marking','First-unvisited obelisk flags and puzzle display','Full guild construction and spells','Battle enchant/speed/health','Neutral HP-based gold payout','Scourge enemy approach restrictions','Remote visit flags and direct stat rewards','Builder demolition, specialty restoration and faction rebuild','Original commander artifact identities and firstmissing-skill mapping']};
}
if(process.argv[1]===new URL(import.meta.url).pathname){const[source,output]=process.argv.slice(2);if(!source||!output)throw Error('SOURCE_ERM OUTPUT_JSON required');fs.writeFileSync(output,JSON.stringify(inspectMysteriousCave(fs.readFileSync(source)),null,2)+'\n');}
