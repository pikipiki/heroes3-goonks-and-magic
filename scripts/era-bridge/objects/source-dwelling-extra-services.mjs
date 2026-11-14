/** Additional original modes admitted independently of the existing unit families.
 * The whole actor stays private until gameplay proof closes every obligation.
 */
export function compileDwellingExtraServices(id,fields,target,definition){
 const runtime={},consumed=[],evidence=[],pending=[];
 const exact=expected=>{for(const[k,v]of Object.entries(expected))if(fields[k]!==v)throw Error('Changed source dwelling mode '+id+' '+k);consumed.push(...Object.keys(expected));};
 if([274,282].includes(id)){
  exact({'Spell 1':10,'Spell 2':7,'Spell 3':id===274?2:4,CastsSpell:60});
  definition.abilities.sourceHypnotist={type:'SPELLCASTER',subtype:'core:hypnotize',val:2};
  definition.abilities.sourceHypnotistPower={type:'CREATURE_SPELL_POWER',val:100};
  evidence.push({source:'tables.cpp Spell_1_mode_exact8109..8153, Spell_2_damage_spell9319..9415',mastery:2,power:'CURRENT living count',duration:'CURRENT living count',native:'EraDwellingCaster.h; full count*maxHP and Mirror absolute gates; one1..100 resistance lottery'});
 }
 if(id===288){exact({'Spell 1':10,'Spell 2':2,'Spell 3':1,CreatureSpellPowerMultiplier:0,CreatureSpellPowerAdder:6,CastsSpell:51});definition.abilities.sourceFortuneCaster={type:'SPELLCASTER',subtype:'core:fortune',val:2};definition.abilities.sourceFortuneDuration={type:'CREATURE_ENCHANT_POWER',val:6};evidence.push({source:'same Spell_1_mode_exact advanced mastery and friendly Bloodlust43 target-mode2 as source264',duration:6});}
 if(id===333){exact({'Spell 1':0,'Spell 2':9,'Spell 3':0});evidence.push({source:'spell_1_jumptable[0] original no-cast entry; target-mode9 unused because no invocation',scope:'No fabricated spellcaster'});}
 if(id===317){exact({SpellsCostLess:2});definition.abilities.sourceArmySpellDiscount={type:'CHANGES_SPELL_COST_FOR_ALLY',val:2};runtime.armySpellCost={};evidence.push({source:'766B99/SpellsCostLess routine, existing original-army maximum adapter with TUM XP enabled',scope:'seven adventure-army slots; source count remains until battle end'});}
 const status={305:[2,73,20],310:[7,71,30],312:[5,70,20],335:[7,71,30],336:[7,71,30],360:[3,42,25]}[id];
 if(status){exact({'Spell effect':status[0]});evidence.push({source:'h3era.exe4402B8/440422/440496/44053A',spell:status[1],chance:status[2],native:'EraDwellingStatus.h primary-only after-strike selector, same queued target marker; source poison/disease living check precedes RNG'});}
 if([335,336].includes(id)){exact({'Resistance effect':15});for(const[spell,name]of[[71,'poison'],[73,'disease'],[74,'paralyze'],[80,'acidBreath']])definition.abilities['sourceToxic'+spell]={type:'SPELL_IMMUNITY',subtype:'core:'+name,val:0};evidence.push({source:'same Amethyst Toxic15 exact spell IDs71/73/74/80 as admitted339',scope:'Not whole-school or broad creature-nature immunity'});}
 if(id===360){exact({AfterMeleeSpell:50,AfterMeleeSpell2:52});evidence.push({source:'Amethyst aftermelee441C01/after_retaliation441B62; direct cast expert3, CURRENT power, before each cast target alive',native:'EraPrimordialCastRuntime.h scoped360 branch'});}
 if(consumed.length)pending.push({code:'native-extra-service-proof-required',sourceId:id,services:consumed});
 return{runtime,consumed,evidence,pending};
}
