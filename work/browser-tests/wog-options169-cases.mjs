import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {eighthTownPrerequisites} from './eighth-town-prerequisites.mjs';

export async function runOptions169({boot, sheet, combat, resolve, state, cmd, wait, page, out, report}) {
  const checkpoint = () => fs.writeFileSync(path.join(out, 'partial-result.json'), JSON.stringify({report}, null, 2));
  const inspectTown = async () => { await cmd(5, 0); await wait(() => goonkMobileState.mode === 'town'); return state(); };
  const returnMap = async () => { await cmd(0); await wait(() => goonkMobileState.mode === 'map'); };
  for (const enabled of [false, true]) {
    const choices = Array(6).fill(enabled ? 1 : 0);
    const options = {replacementTargets: true, townFaction: 'castle', wogChoices: choices, battle: true, enemy: 'core:peasant', enemyAmount: 20, spells: ['core:magicArrow'],
      buildings: [...eighthTownPrerequisites().castle, 'core:dwellingLvl7', 'core:dwellingUpLvl7', 'third-upgrades:dwellingUp2Lvl7', 'tum-era:dwellingUp3Lvl7', 'tum-era:dwellingLvl8', 'tum-era:dwellingUpLvl8']};
    await boot(options);
    assert.deepEqual(report.lastLobby.wogOptions, choices);
    let hero = await sheet();
    assert.equal(Number.isInteger(hero.heroWindow.commanderIcon), enabled, 'Commander is created only when this game enables it');
    await page().locator('[data-hero-close]').tap(); await wait(() => goonkMobileState.mode === 'map');
    const initialTown = await inspectTown();
    assert.equal(initialTown.townFaction, 'core:castle');
    const recruits = initialTown.recruits || [];
    assert.equal(recruits.some(unit => unit.key === 'tum-era:cherub'), enabled, 'Fourth upgrade recruitment follows this game');
    assert.equal(recruits.some(unit => unit.key === 'tum-era:eraCreature269' || unit.key === 'tum-era:eraCreature278'), enabled, 'Eighth recruitment follows this game');
    assert(initialTown.buildings.find(building => building.id === 14)?.allowed, 'Marketplace initially available');
    await cmd(8, 14); await wait(() => goonkMobileState.buildings?.some(building => building.id === 14 && building.built));
    const afterFirst = await state();
    assert.equal(afterFirst.buildings.find(building => building.id === 11)?.allowed, enabled, 'The second construction is available only with228 ON');
    if (enabled) { await cmd(8, 11); await wait(() => goonkMobileState.buildings?.some(building => building.id === 11 && building.built)); }
    const afterBuild = await state();
    await returnMap();
    await combat(64); await resolve();
    const earned = await sheet();
    const troop = earned.armies.flatMap(army => army.slots || []).find(unit => unit?.key === 'goonk:bubu');
    assert(troop);
    assert.equal(troop.experience > 0, enabled, 'Actual battle grants troop XP only when this game enables it');
    await page().locator('[data-hero-close]').tap(); await wait(() => goonkMobileState.mode === 'map');
    await cmd(7); await wait(() => { try { return Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-mobile.vsgm1').size > 0; } catch { return false; } });
    await page().waitForTimeout(400);
    const bytes = await page().evaluate(() => Array.from(Module.FS.readFile('/home/web_user/.local/share/vcmi/Saves/Goonk-mobile.vsgm1')));
    assert(bytes.length > 1000);
    const replacementMarkers = [...Buffer.from(bytes).toString('latin1').matchAll(/_eraCB(\d+)_/g)].map(match => match[1]);
    assert.equal(replacementMarkers.length > 0, enabled, 'Forty real Archer Towers are replaced only when195 is enabled');
    await page().close();
    await boot({loadSave: bytes});
    hero = await sheet(); assert.equal(Number.isInteger(hero.heroWindow.commanderIcon), enabled, 'Commander setting survives native save/reload');
    await page().locator('[data-hero-close]').tap(); await wait(() => goonkMobileState.mode === 'map');
    const reloaded = await inspectTown();
    assert.deepEqual(reloaded.recruits, afterBuild.recruits, 'Saved recruitment identities and stocks remain exact');
    assert.deepEqual(reloaded.buildings.map(building => [building.id, building.built, building.allowed]), afterBuild.buildings.map(building => [building.id, building.built, building.allowed]));
    report[enabled ? 'allOn' : 'allOff'] = {passed: true, choices, initialTown, afterFirst, afterBuild, earned, reloaded, replacementMarkers, saveBytes: bytes.length};
    checkpoint(); await page().close();
  }
  if (process.env.OLD168_SAVE) {
    await boot({loadSave: [...fs.readFileSync(process.env.OLD168_SAVE)]});
    const reloaded = await state(); assert.equal(reloaded.mode, 'map'); assert(reloaded.heroName);
    report.old168Save = {passed: true, state: reloaded}; checkpoint(); await page().close();
  }
}
