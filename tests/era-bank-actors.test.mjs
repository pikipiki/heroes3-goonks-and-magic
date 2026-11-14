import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {BANK_ACTORS,REMAINING_BANKS,bankRushSpell,verifyBankActorCfg} from '../scripts/era-bridge/objects/stage-six-banks.mjs';
import {sourceAdventureFearAura} from '../scripts/era-bridge/objects/source-fear-aura.mjs';

test('whole bank cohort rejects partial or changed CFG admission',()=>{
 assert.deepEqual(REMAINING_BANKS,[48,51,64,65,66,67]);
 assert.equal(BANK_ACTORS.length,10);
 assert.doesNotThrow(()=>verifyBankActorCfg(301,'Flags=16\nLevel=2\nTown=0\nUpgradesTo=302'));
 for(const cfg of ['Flags=16\nLevel=2\nTown=0','Flags=16\nLevel=2\nTown=0\nUpgradesTo=358','Flags=16\nLevel=2\nTown=0\nUpgradesTo=302\nTown=0'])assert.throws(()=>verifyBankActorCfg(301,cfg));
 const rush=bankRushSpell();assert.equal(rush.targetType,'CREATURE');assert.equal(rush.flags.positive,true);
 for(const kind of ['Book','Effect','ScenarioBonus','Scroll'])assert.ok(rush.graphics['icon'+kind]);
});
test('Rush BYTE arithmetic and bank HATE scope preserve exact source domains',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bank-rules-'));
 try{
 fs.writeFileSync(dir+'/test.cpp',`#include "${path.resolve('work/vcmi-wasm/lib/era/EraBankActorRule.h')}"
#include <cassert>
int main(){using namespace era_bridge;
 assert(bankRushCounter(0)==1);assert(bankRushCounter(63)==63);
 assert(bankRushCounter(127)==128);assert(bankRushCounter(255)==0);
 for(int i=0;i<256;++i)for(int n=1;n<63;++n){int expected=(i+n)&255;if(expected<128&&expected>63)expected=63;assert(bankRushCounter(i,n)==expected);}
 assert(bankRushCounter(7,63)==7);assert(bankRushCounter(7,-1)==7);
 assert(bankSourceHatePair(272,277));assert(bankSourceHatePair(281,285));
 assert(bankSourceHatePair(289,292));assert(bankSourceHatePair(290,289));assert(bankSourceHatePair(330,132));
 assert(!bankSourceHatePair(253,132));assert(!bankSourceHatePair(330,133));assert(!bankSourceHateTarget(999));
 assert(bankTiamatDeathStare[1]==5&&bankTiamatDeathStare[10]==30);
 assert(bankLordBlock[10]==60);
 assert(bankDeathStareCap(0)==0&&bankDeathStareCap(1)==1&&bankDeathStareCap(10)==1&&bankDeathStareCap(11)==2&&bankDeathStareCap(2147483647)==214748365);
}`);
 execFileSync('c++',['-std=c++17','-fsanitize=undefined','-o',dir+'/test',dir+'/test.cpp']);execFileSync(dir+'/test');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('pinned source completes all six banks and ten whole actors without missing assets',{skip:!fs.existsSync('../Third-Upgrade-Mod-Full/Data/AmeCre.pac')},async()=>{
 const {prepareSixBankCandidates}=await import('../scripts/era-bridge/objects/stage-six-banks.mjs');
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'whole-bank-source-'));
 try{
 const result=await prepareSixBankCandidates({projectRoot:path.resolve('.'),sourceRoot:path.resolve('../Third-Upgrade-Mod-Full'),outputRoot:out});
 assert.deepEqual(result.bankIds,REMAINING_BANKS);assert.deepEqual(result.pending,[]);
 const review=JSON.parse(fs.readFileSync(out+'/six-banks-review.json'));
 assert.equal(review.activated,false);assert.equal(review.nativeValidationRequired,true);
 assert.equal(review.actors.length,10);for(const a of review.actors)assert.equal(a.sourceInitialCasts,0);
 for(const b of review.banks){const config=JSON.parse(fs.readFileSync(out+'/'+b.config)),definition=Object.values(config['core:creatureBank'].types)[0];const expected=[66,67].includes(Number(b.id))?[0]:[0,1,2,3];assert.equal(definition.rewards.length,expected.length);assert.deepEqual(definition.rewards.map(r=>r.mapDice),expected);}
 for(const a of review.assets)assert.equal(fs.statSync(out+'/'+a.file).size,a.bytes);
 const actors=JSON.parse(fs.readFileSync(out+'/content/config/source-bank-actors.candidate.json'));
 assert.deepEqual(actors.eraCreature253.abilities.sourceFear,sourceAdventureFearAura(253));
 const fear330=actors.eraCreature330.stackExperience.find(r=>r.bonus.stacking==='eraSourceFear:330:v1');
 assert.deepEqual(fear330,{bonus:sourceAdventureFearAura(330),values:[false,false,false,false,false,false,false,true,true,true]});
 for(const [id,spells]of [[289,['core:iceBolt','core:frostRing']],[290,['core:fireball','core:inferno','core:armageddon']]])assert.deepEqual(Object.values(actors['eraCreature'+id].abilities).filter(a=>a.type==='MORE_DAMAGE_FROM_SPELL').map(a=>a.subtype),spells);
 const lord=actors.eraCreature340;assert(!Object.values(lord.abilities).some(a=>a.type==='CASTS'));
 assert.deepEqual(lord.stackExperience.find(r=>r.bonus.type==='CASTS').values,[0,0,0,0,0,0,0,0,0,1]);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});
