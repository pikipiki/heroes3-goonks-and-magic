import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildHenchmenContract,verifyHenchmenContract} from '../scripts/era-bridge/gameplay/henchmen.mjs';

test('Henchmen rules bind to exact upstream blocks and cannot claim system activation',()=>{
 const contract=verifyHenchmenContract();
 assert.equal(contract.enabled,false);
 assert.equal(contract.status,'partial-rule-library');
 assert.equal(contract.blocks.length,13);
 assert(contract.blocks.every(block=>block.source.codeSha256.length===64&&block.status==='arithmetic-unit-tested'));
 assert(contract.unresolved.some(line=>line.includes('battleExpAIPct')));
 assert(contract.unresolved.some(line=>line.includes('save/load')));
});

test('native Henchmen settings map exactly to the supplied profile defaults',()=>{
 const contract=buildHenchmenContract();
 const source=fs.readFileSync(contract.nativeRules,'utf8');
 const mapping={battleExpStatic:'battleStatic',battleExpRandom:'battleRandom',battleHeroExpCoef:'battleHeroCoefficient',
  battleExpPerHeroLv:'battlePerHeroLevel',battleExpMin:'battleMinimum',battleExpMax:'battleMaximum',
  bonusHeroLvUp:'heroLevelBonus',bonusDaily:'dailyBonus',stackExpEnabled:'stackExperience',bannerEnabled:'banner',
  bannerFree:'freeBanner',bonusSpellDmgPerPwr:'spellDamagePerPower',moreSpellEveryXKnl:'knowledgePerExtraSpell',
  battleExpLossPct:'replacementLossPercent',battleExpAIPct:'aiPercent',returnToArmy:'returnToArmy',
  altExpPerLv:'alternativeLevelRate',campaignTransfer:'campaignTransfer',moreSantaGuards:'moreSantaGuards',reviveAnywhere:'reviveAnywhere'};
 assert.deepEqual(Object.keys(mapping).sort(),Object.keys(contract.defaults).sort());
 for(const [sourceName,nativeName]of Object.entries(mapping)){
  const value=contract.defaults[sourceName].replace('TRUE','true').replace('FALSE','false');
  assert.match(source,new RegExp('\\b'+nativeName+'='+value+'\\b'),sourceName);
 }
});
