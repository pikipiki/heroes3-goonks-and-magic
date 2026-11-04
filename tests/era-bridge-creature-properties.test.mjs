import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {compileCreatureProperties,parseCreatureProperties,dailyCreatureResources,inventory} from '../scripts/era-bridge/creatures/creature-properties.mjs';
import {parseCreatureExperience,compileCreatureExperience} from '../scripts/era-bridge/creatures/crexpbon.mjs';
const options={freshDefinition:true,analyseOnly:true,resolveCreature:id=>`test:creature${id}`,resolveSpell:id=>`core:spell${id}`,resolveTown:id=>`core:town${id}`,resolveArtifact:id=>`core:artifact${id}`};
const compile=(text,o={})=>compileCreatureProperties(text,{...options,...o});
test('flags reconstruct geometry, attack and slayer traits without retaining inherited abilities',()=>{
 const {definition,policies}=compile('Flags=-2147400549');
 assert.equal(definition.doubleWide,true);
 assert.equal(definition.abilities.amethyst_flag_31.type,'DRAGON_NATURE');
 assert.equal(definition.abilities.amethyst_flag_3.type,'TWO_HEX_ATTACK_BREATH');
 assert.equal(definition.abilities.amethystKing.val,0);
 assert.equal(policies[0].kind,'era-creature-flag-semantics');
});
test('cfgPersonalHate is flat damage; XP HATE percentage is a separate contract',()=>{
 assert.deepEqual(compile('Hate0054=200').definition.abilities.amethyst_Hate0054,{type:'ERA_PERSONAL_HATE_DAMAGE',val:200,subtype:'test:creature54'});
 assert.throws(()=>compile('Hate0054=200',{resolveCreature:undefined}),/MISSING_RESOLVER/);
});
test('unknown, duplicate, malformed and invalid enum input all fail',()=>{
 assert.throws(()=>compile('InventedPower=1'),/UNKNOWN_PROPERTY/);
 assert.throws(()=>parseCreatureProperties('Fear=1\nFear=0'),/DUPLICATE/);
 assert.throws(()=>compile('Fear='),/MALFORMED/);
 assert.throws(()=>compile('Attack effect=42'),/INVALID_INTEGER/);
});
test('ambiguous inherited flag state cannot be compiled',()=>{
 assert.throws(()=>compile('Flags=1',{freshDefinition:false}),/freshDefinition/);
});
test('imposed enchant duration prevents false native ENCHANTED equivalence',()=>{
 const r=compile('ImposedSpell1Number=28\nImposedSpell1Level=3');
 assert.deepEqual(r.definition.abilities,{});
 assert.deepEqual(r.policies[0].parameters,{slot:1,spell:'core:spell28',mastery:3,duration:1000});
 assert.throws(()=>compile('ImposedSpell1Number=28'),/INCOMPLETE_GROUP/);
});
test('runtime obligation cannot masquerade as executable support',()=>{
 assert.throws(()=>compile('Fear=1',{analyseOnly:false,sourceBinaryParity:true}),/UNBOUND_RUNTIME_POLICY/);
 assert.throws(()=>compile('Level=6',{analyseOnly:false}),/SOURCE_BINARY_PARITY/);
 assert.equal(compile('Level=6',{analyseOnly:false,sourceBinaryParity:true}).definition.level,7);
});
test('exact regeneration chance, max aggregation and fractional rebirth are retained',()=>{
 const r=compile('RegenerationHitPoints=50\nRegenerationChance=50\nrebirth chance=1\nrebirth fraction=0.3\nrebirth sure=0.2');
 assert.equal(r.policies[0].parameters.chance,50);
 assert.equal(r.policies[0].parameters.combination,'max(creature,stack)');
 assert.equal(r.policies.filter(p=>p.kind==='era-rebirth').length,3);
});
test('native resistance enums are distinct from elemental creature selectors',()=>{
 const allSpells=compile('Resistance effect=4');
 assert.equal(allSpells.policies[0].parameters.selector,4);
 assert(!Object.values(allSpells.definition.abilities).some(a=>a.type==='LEVEL_SPELL_IMMUNITY'));
 assert.equal(compile('Resistance effect=6').policies[0].parameters.name,'AS_EARTH');
});
test('daily resource generation is max per resource, tax scales per individual',()=>{
 const properties={207:{ResGen_Type:5,ResGen_Amount:3},316:{ResGen_Type:1,ResGen_Amount:1},303:{ResGen_Type:6,ResGen_Tax:25}};
 const resources=dailyCreatureResources([[{creature:207,count:100},{creature:207,count:1}],[{creature:316,count:1},{creature:303,count:8}]],properties);
 assert.deepEqual(resources,[0,1,0,0,0,3,200,0]);
});
test('all nine fourth upgrades and complete numeric corpus are accounted for',()=>{
 const corpus=JSON.parse(readFileSync(new URL('./fixtures/tum/creature-corpus.json',import.meta.url)));
 const numeric=Object.keys(corpus);
 assert.equal(numeric.length,240);
 for(const name of numeric){
   const text=corpus[name];
   const r=compile(text,{source:name});
   assert.equal(r.mappings.length,parseCreatureProperties(text).length,name);
 }
 for(const id of [202,207,212,219,224,231,238,245,252]){
   const r=compile(corpus[id+'.cfg']);
   assert.equal(r.definition.level,7,String(id));
   assert.equal(r.ready,false);
 }
 assert.equal(inventory.sourceBinaryParity,'unverified');
});

test('same creature pair keeps cfg flat200 separate from source XP h fifty-to-two-hundred percent',()=>{
 const cfg=compile('Hate0054=200',{resolveCreature:()=> 'core:devil'}).definition;
 const rows=parseCreatureExperience([202,'h','#54',5,6,7,8,9,10,12,14,16,18,20].join('\t'));
 const xp=compileCreatureExperience(rows,{creatureId:202,installedRows:[],rankZero:'intrinsic',resolveCreature:()=> 'core:devil'});
 assert.equal(xp.ok,true);assert.equal(cfg.abilities.amethyst_Hate0054.type,'ERA_PERSONAL_HATE_DAMAGE');assert.equal(cfg.abilities.amethyst_Hate0054.val,200);
 assert.deepEqual(Object.values(xp.definition.abilities),[{type:'HATE',subtype:'core:devil',valueType:'ADDITIVE_VALUE',val:50}]);
 assert.equal(xp.definition.stackExperience[0].bonus.type,'HATE');assert.equal(xp.definition.stackExperience[0].values.at(-1),150);
});
