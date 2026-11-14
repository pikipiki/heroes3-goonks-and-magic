/** Existing native services admitted for exact original dwelling actors.
 * Other fields remain obligations in the whole-actor ledger.
 */
import crypto from 'node:crypto';
import {sourceAdventureFearAura} from './source-fear-aura.mjs';
import {compileRegenerationService,compileRebirthService,compileDailyResourceService} from '../runtime-policy.mjs';
const sourceHashes={"200":"535d23028567ac0f812d106548cce9c341b198846c83682c2e449dbc5df6436b","239":"dfd3beb08159653cc055690429965864b490271f64c8f46e441ee6d06acc65ad","253":"4828047d3164475face89ca4f42492b225723382756353fd150ee565d8dab721","262":"9efefb0eae56d5ccd1ebe74c08f808024eafe1e5ffb7d945b231b2582dacd9a4","264":"dcba58ecc7e5e016266bff967f6f2acff90e4c6e9bb50a1a63bb765d22fa4a7a","270":"dcec09e66feb24b1adfc172313aa83adb610856a75ef4563d86ec78afeb0adce","272":"6237277d459c6e459de6537139aad65a72ccb313dcdf5ac1a3e689cef90ee0de","274":"9fa5b37c22a99a1cd0b5a6a2e97f7b2786898a01e692069b817ba822e2f9e35c","276":"0302b2373795c352428d4697f4047d0e2bfd4d7645ec8bc00a58fbcf508e4016","277":"f33fb8e8151da817bc4a844f19f58ed0f292fd582b7e3e6572831238f2378cfb","279":"cc7155d21d8436f9f6c98af26615b3e82b379e66531226424bbc24220e700077","281":"fe23b540b870b3873d869c42e07d8aa4ba50ec73d1023ec978523d502b5fe871","282":"741ed683bcc4adb69b92393c787e67f25dac7443734e169dcff7e642aae45c94","284":"ed20a8851002373fafd03391b2828ea48875faf98e4c98cbe42c27ce7b6ab199","285":"2939c40aef905f36fce9dec513e1234efa7db4c02ce970473ee492ba5fdda00f","288":"d5c848fdd04b31bb1aa6cf74b487c90bf9d6533a0cf28f758cc82c3893c34ab6","289":"b4a3b4d7d5c5923f21c891767a1784cda0504b8d081e427d24c11a0f179a2f58","290":"93b074c0135029601e2a84f9654376b2e35d02fb5475fd48dd5fc47441309d8d","292":"e3fabe8b22ee2db68d9260cb2a148512a9fc7552a95991ca9f789fe38900621b","296":"14862b2a2d0615a6250ec451c22125c9eb3ac1741be2dd06670daa1ad949a648","298":"258ba86938bb3f83fe5a6a6656bd9fc1eaacafad199018a09df0cc952343496c","301":"b38646f8c6de8c35bb26a0a80b01f8a48e0378b0b6c000c445a83ae361add8b4","302":"1d597b29f52143db9874df5923db67cbdb6f6f8113b33cdf88f80ab10edd68c7","303":"e979145d61d6c95909d97696fc36b99f5e758bc7ac9eda8103bab0b9b6fe76d9","304":"d5c98e8ccb3dbeddd3efc8fb6d86e8df31d856131f6f7fb078e25ecc9cc476ee","305":"9bbc459d5b40ec5cf360ab6e7a75920b68510f5791f7f9cdf2661c1a42e4286c","306":"b67dee9d6ee1357a45a8919e5b5eaf2fedc7cb54037bd97bc6d6abe28f80ec0d","307":"1dba8fbe0b6ed06b00037ebc8c19c5b686dd17b9501f43083c4840dd24d4b50e","308":"4a62be7e1bff2447a93fd6f6b133cd381b9865b56c28267d60063ed059ff15ac","309":"12834a664943a1d1c1dc4284cad7e43040d66efb8be58a562ea935b115cd0c05","310":"7bb9f790c99bca78d4a459fe1adab7e33d5371848ef14f5351c827714ff0a606","311":"87fb620a9d3137b68fc207678d973d524152aa01ebfd9098368d4d84aef7b4b5","312":"37608ddafcb7381518e4256bc313583561fd5d83569982e0f6e85da6c0d6d2c3","313":"041c88fd2c632f5cc3fa31de191e2c77ed0f3b8d3138f80710d1a18b9da68bcb","314":"199b2f94de5cde0ba76d0d746c49d9747dccfa3b63af9329a6c112b5ffa9567f","315":"c8420cede618e6b63660bcaddfa669e2d4ce789ceed9c5cde50fe503902c4f70","316":"3372befcb214065e055de27714ceeff996a2a2baa0f2a2a0e772b81408496c4a","317":"cb2318398607042cde6cd1b5a1c5a73b5ea67de60f672d6bf08e51a477e5d95d","319":"e9969628055de6c23d289abc5a62d0881ea70eea75c2ad194c5fe712b6b53aac","322":"40535bedc2a7f637b9a0d546f27665c964154c60ee2ea781b1c61849db62dce0","323":"e199a830aff43342dcf5fd759e6dad4c2876d091528a6cee1b3d209fb0ba61a3","325":"fc91bd04544c81b4bf3fa93de169b437c17ee525ddc4ef78baf9eede8eca84e3","326":"d99cfa4861386f48e065c58097453076c789f211b8773fd26f82ba06872ed51a","327":"0e947b5b2ecdb423dca5890b4c7a11e413b299f9b6b7f9e5452df1304d16004c","328":"b7178fdaeaed50e7168fba73d98a97bfb0b78689c13ff6a804b770460f20c53b","330":"a9f9ab79fd741f1199951f8463a5b58c2f0c99dfdb6257f619fecc627fb6bda3","333":"aa47a5a7174c6a2151790a0ead0eeec0e3181d7b1c016d59d5a23e897c000d5d","334":"4620d118021426197aba3710b72d129ffae4e56ecbaafd8bb33129264dd02f9a","335":"ea08cc4f77e7cb2f04076f4d3fe0cc49ed72960e72fb4d349a48e5b1b65ab7f6","336":"23028b1fca3e5dc6d6e77163fd63626e6e02113822fe5c9b27936ee97a511866","340":"abf804d92b00031766c26d839bdb4eac10278f26ff0022fd8552465c9d09c1c9","358":"d88f227fc0a0e4b7635230e8d00abb45f3d97f78efa75c90e31a90cd452d2c2d","360":"f9a22079bf45d93e543daeb171ba829053418ab10790528c10883866b02e3531","362":"13ac70c3eb08199c95b353f98b558050a437c1cca0cd69ce615923bbb2c97679"};
export function compileDwellingServices(id,text,fields,target,definition){
 const hash=crypto.createHash('sha256').update(text).digest('hex');
 if(sourceHashes[id]!==hash)throw Error('Changed dwelling source CFG '+id);
 const runtime={},consumed=[],evidence=[],pending=[];
 const service=(compiled)=>{Object.assign(runtime,compiled.policy.creatures[target]);consumed.push(...compiled.provenance.consumed.map(e=>e.key));evidence.push(compiled.provenance);};
 if(id===292){for(const spell of['lightningBolt','chainLightning','armageddon','titanBolt'])definition.abilities['sourceEarthResistance'+spell]={type:'SPELL_IMMUNITY',subtype:'core:'+spell};consumed.push('Resistance effect');evidence.push({source:'AS_EARTH6→44A50A..44A521 exact IDs26/17/19/57',scope:'No meteor vulnerability, no broad earth-school immunity'});}
 if(id===306){definition.abilities.sourceFear=sourceAdventureFearAura(306);consumed.push('Fear');evidence.push({source:'same Fear1 branch7604D0 and original10% registry law as253',marker:'eraSourceFear:306:v1'});}
 if(id===285){definition.abilities.sourceQuarterSpellDamage={type:'SPELL_DAMAGE_REDUCTION',subtype:'spellSchool.any',val:75};consumed.push('Spell effect','Vulnerability effect');evidence.push({source:'intrinsic selector6→4405C0 chance20 beforelife; spell74 receive; vulnerability1→44B200 signedIDIV4, same nativeIronGolem reduction75',native:'EraDwellingStatus285 + native golem reduction'});}
 if(id===284){consumed.push('ACAST_CUSTOM_Chance','ACAST_CUSTOM_Spell','AfterShootSpell');evidence.push({source:'ACAST_CUSTOM fields only store values1302..1305; selector defaultsACAST_DEFAULT13295 andCFG284 has no Spell effect=CUSTOM, so dormant; active AfterShootSpell54 hook10496..10510',scope:'No fabricated Hypnotize ability; directSlow54 aftershoot retained'});}
 if(id===200){consumed.push('isDragonSlayer','isDragonResistant');evidence.push({scope:'flat creature-pair accumulator before defense',source:'Amethyst Hate_Hook_766DFF8004..8010',slayerFlat:100,resistanceFlat:-50});}
 if(id===296){definition.abilities.sourceVampireDrain={type:'LIFE_DRAIN',val:100};runtime.vampireDrain={};consumed.push('Attack effect');evidence.push({source:'selector0 original440921 living victim, raw damage before physicaldeflection, exact min(rawDamage,preHP) with resurrection'});}
 if(id===308){definition.abilities.sourceFiniteRetaliations={type:'ADDITIONAL_RETALIATION',val:124};consumed.push('Retaliations');evidence.push({source:'Amethyst CounterStrike5051..5076 MOVZX table125; finite125 total including baseline1'});}
 if(id===314){definition.abilities.sourceDestroyWalls={type:'CATAPULT',subtype:'spell.cyclopsShot'};consumed.push('Flags');evidence.push({source:'H3CreatureFlags bit5 DESTROY_WALLS, source314 same basic wall shot flag as Cyclops94, no upgraded95 type-specific bonus',scope:'retain native shooter, doublewide, biology and king bits handled by compiler'});}
 if(id===325){consumed.push('isGhost','GhostFraction');evidence.push({scope:'HP drain with growth ceiling count+kills',source:'756B1F..756CA8/Amethyst756BA0; source default ZGhost percentages',fraction:.005,native:'EraDwellingGhost.h'});}
 if([288,311].includes(id)){const artifact=id===288?123:90;runtime.artifactMimic={artifact};consumed.push('CreatureMimicArtifact');evidence.push({scope:'hero-original-army artifact query/cache only',source:'Emerald duplicate.cpp NewHasArtifact+MonGiveSpell; no copied +500 movement bonus',artifact});}
 if([279,334].includes(id)){
  const targetId=id===279?315:60;
  if(fields['Spell 1']!==2||fields['Spell 2']!==0||fields['Spell 3']!==0||fields.Demonology!==targetId)throw Error('Changed source mode2 Demonology');
  const spell='tum-era:sourceDwellingDemonology'+targetId;
  definition.abilities.sourceDemonCaster={type:'SPELLCASTER',subtype:spell,val:0};
  definition.abilities.sourceDemonPower={type:'SPECIFIC_SPELL_POWER',subtype:spell,val:50};
  consumed.push('Spell 1','Spell 2','Spell 3','Demonology');
  evidence.push({scope:'same source mode2 corpse conversion',source:'tables.cpp10898..10905 and admitted source-demonology-mode2-v1 effect',targetId,powerPerCreature:50});
  pending.push({code:'native-demonology-proof-required',sourceId:id,targetId,tests:['living allied corpse','undead rejection','corpse HP cap','corpse count cap','army slot','save/reload']});
 }
 if([262,264].includes(id)){
  const expected={'Spell 1':10,'Spell 2':2,'Spell 3':1,CreatureSpellPowerMultiplier:0,CreatureSpellPowerAdder:6,CastsSpell:id===262?49:51};
  if(Object.entries(expected).some(([k,v])=>fields[k]!==v))throw Error('Changed fixed-power dwelling caster');
  definition.abilities.sourceFixedCaster={type:'SPELLCASTER',subtype:id===262?'core:mirth':'core:fortune',val:2};
  definition.abilities.sourceFixedEnchantmentDuration={type:'CREATURE_ENCHANT_POWER',val:6};
  consumed.push(...Object.keys(expected));
  evidence.push({scope:'manual spell + fixed enchantment duration',source:'Amethyst Spell_1_mode_exact8110..8153 mastery2; 5A0145 override multiplier0/divider1/adder6',aiEvaluation:1,power:6,targetMode:2});
  pending.push({code:'native-caster-target-proof-required',sourceId:id,targetMode:2,spell:expected.CastsSpell,tests:['friendly living','enemy','undead','antimagic','hypnosis','zero charges','save/reload']});
 }
 if([270,276,279,284,312].includes(id))service(compileRegenerationService(text,{target}));
 if(id===296)service(compileRebirthService(text,{target}));
 if([303,316].includes(id))service(compileDailyResourceService(text,{target,resolveResource:n=>'core:'+['wood','mercury','ore','sulfur','crystal','gems','gold'][n]}));
 if([333,334,360].includes(id)){
  if(fields.isTeleporter!==1)throw Error('Expected original teleporter');
  definition.abilities.sourceTeleportMovement={type:'FLYING',subtype:'movementTeleporting'};
  consumed.push('isTeleporter');evidence.push({scope:'movement only',source:'Amethyst tables.cpp10663..10676: same teleporter branch as Devils54/55; native inferno.json movementTeleporting',nativeValidationRequired:true});
 }
 if([313,314].includes(id)){definition.abilities.sourcePositiveMorale={type:'MORALE',val:1,valueType:'INDEPENDENT_MAX'};consumed.push('AlwaysPositiveMorale');evidence.push({scope:'positive morale floor1 before suppression',source:'same original Amethyst positive-morale branch as admitted269/278 and BankActors340/358'});}
 if(id===323){definition.abilities.sourceMagicMirror={type:'MAGIC_MIRROR',val:20,valueType:'INDEPENDENT_MAX'};consumed.push('MagicMirror');evidence.push({scope:'maximum of active mirror and intrinsic20',source:'h3era.exe448531; original SPTRAITS MagicMirror base0=20'});}
 if(id===317){
  definition.abilities.sourceMagicAura={type:'SPELL_RESISTANCE_AURA',val:25,valueType:'INDEPENDENT_MAX'};
  consumed.push('MagicAura');evidence.push({scope:'resistance aura only',source:'h3era.exe767220..7672E0 original Unicorn24 returns25; Amethyst MagicAura redirects exact source branch'});
 }
 return {runtime,consumed,evidence,pending};
}
