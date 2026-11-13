import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function runSourceDefendCases({boot, sheet, state, cmd, wait, page, out, report}) {
  const sourceActor = 'third-upgrades:tumChaoticDragonFly', companion = 'goonk:paingpaing';
  const cases = [
    {name: 'policy-absent', spell: 48, key: 'prayer', policy: false},
    {name: 'no-source-participant', spell: 48, key: 'prayer', actor: 'core:pikeman'},
    {name: 'prayer', spell: 48, key: 'prayer'},
    {name: 'stoneSkin', spell: 46, key: 'stoneSkin'},
    {name: 'frenzy', spell: 56, key: 'frenzy'},
    {name: 'goonk-defensive-stance', spell: 48, key: 'prayer', target: 'goonk:bubu', stance: 5},
  ];
  const normalize = async () => {
    await sheet(); const {clearIntrinsicEquipment} = await import('./eighth-intrinsic-equipment.mjs'); const gear = await clearIntrinsicEquipment({state, cmd, wait});
    await page().locator('[data-hero-close]').tap(); await wait(() => goonkMobileState.mode === 'map'); return gear;
  };
  const passTo = async name => {
    await cmd(3); for (let n = 0; n < 300; n++) {const s = await state(); if (s.mode === 'dialog') await cmd(1); else if (s.mode === 'map' && s.turn && s.heroName === name) return; await page().waitForTimeout(60);} throw Error('Missing hero ' + name);
  };
  const cast = async (id, hex) => {
    const before = await state(), seq = before.battleCamera.sequence; assert(before.canUseMagic && before.heroCanCast);
    await cmd(14, 0); await wait(() => goonkMobileState.mode === 'spellbook'); await cmd(51, 0);
    for (let n = 0; n < 8 && !(await state()).spellbook.spells.some(s => s.id === id); n++) {const old = (await state()).spellbook.page; await cmd(50, 1); await wait(old => goonkMobileState.spellbook.page !== old, old);}
    const book = await state(); assert(book.spellbook.spells.some(s => s.id === id && s.enabled), 'Real castable spell ' + id);
    await cmd(49, id); await wait(seq => goonkMobileState.spellTargeting || goonkMobileState.battleCamera?.sequence > seq, seq);
    if ((await state()).spellTargeting) {assert((await state()).battleCells.find(c => c.hex === hex)?.spellTarget); await cmd(14, 3, hex);}
    await wait(seq => goonkMobileState.mode === 'battle' && !goonkMobileState.spellTargeting && goonkMobileState.canUseMagic && !goonkMobileState.battleCamera?.active && goonkMobileState.battleCamera?.sequence > seq, seq);
    return {book, after: await state()};
  };
  const next = async predicate => {
    for (let n = 0; n < 200; n++) {const s = await state(); if (s.mode === 'dialog') await cmd(1); else if (s.mode === 'battle' && s.canAct && !s.battleCamera?.active) {if (predicate(s)) return s; await cmd(13, s.activeStack, s.round);} await page().waitForTimeout(70);} throw Error('Missing next native action');
  };
  for (const c of cases) {
    if (process.env.SOURCE_DEFEND_CASES && !process.env.SOURCE_DEFEND_CASES.split(',').includes(c.name)) continue;
    if (process.env.SOURCE_DEFEND_PRODUCTION === '1' && c.policy === false) continue;
    const actor = c.actor || sourceActor, target = c.target || 'core:orc', enrolled = c.policy !== false && actor === sourceActor;
    const unit = s => s.battleUnits.find(u => u.key === target);
    console.log('BOOT sourceDefend', c.name);
    // Advanced Water is required by native Dispel to target an enemy stack.
    await boot({artifacts: {}, skills: {'core:wisdom': 'expert', 'core:waterMagic': 'advanced'}, spells: ['core:dispel'], sourceDefend: {policy: process.env.SOURCE_DEFEND_PRODUCTION === '1' ? 'production' : c.policy, controls: {
      [actor]: {speed: 100, hitPoints: 1000000, attack: 0, damage: {min: 1, max: 1}, abilities: {fixtureNoMorale: {type: 'NO_MORALE'}}},
      [target]: {speed: 200, hitPoints: 1000000, attack: 10, defense: 13, damage: {min: 1, max: 1}, abilities: {fixtureNoMorale: {type: 'NO_MORALE'}, ...(c.stance ? {fixtureGoonkStance: {type: 'DEFENSIVE_STANCE', val: c.stance}} : {})}},
      [companion]: {speed: 1, hitPoints: 1000000, attack: 0, damage: {min: 1, max: 1}, abilities: {fixtureNoMorale: {type: 'NO_MORALE'}}},
    }, layout: {attacker: [88,155,122,139,156,173,71], defender: [86,103,120,137,154,171,188]}},
    enemyHero: {power: 5, spells: ['core:' + c.key], skills: {'core:wisdom': 'expert'}, army: [{type: target, amount: 1}]},
    army: [{type: actor, amount: 1}, {type: companion, amount: 3}]});
    const gear = {red: await normalize()}; await passTo('Orrin'); gear.blue = await normalize(); await passTo('Christian');
    await cmd(6); await page().waitForTimeout(150); await page().evaluate(() => {const v = goonkMobileState.mapOverview.view; Module._vcmiMobilePointer(v.x + v.w / 2 + 32, v.y + v.h / 2, 1);}); await wait(() => goonkMobileState.hasPath); await cmd(2);
    for (let n = 0; n < 300; n++) {const s = await state(); if (s.mode === 'dialog') await cmd(1); else if (s.mode === 'battle') {if (s.canUseMagic) break; await cmd(15);} await page().waitForTimeout(70);}
    const before = await next(s => s.round === 1 && s.activeUnit.key === target), baseDefense = unit(before).defense, baseAttack = unit(before).attack;
    const positive = await cast(c.spell, unit(before).occupied[0]);
    const stored = c.spell === 56 ? baseDefense : unit(positive.after).defense;
    const delta = c.stance ? Math.floor((stored + c.stance) * 1.2) - stored : Math.max(1, Math.floor(stored * 0.2));
    await cmd(13, positive.after.activeStack, positive.after.round);
    const defended = await next(s => s.round === 1 && s.activeUnit.key === actor);
    assert.equal(unit(defended).defense, c.spell === 56 ? 0 : stored + delta);
    if (c.spell === 56) assert.equal(unit(defended).attack, baseAttack + baseDefense + delta, 'Frenzy sees stored CC plus stored DEFEND');
    const dispel = await cast(35, unit(defended).occupied[0]);
    report[c.name] = {passed: false, c, before, positive, defended, dispel, gear}; fs.writeFileSync(path.join(out, 'partial-result.json'), JSON.stringify({passed: false, report}, null, 2));
    const expectedDefense = enrolled ? baseDefense + delta : Math.max(baseDefense + 1, Math.floor((baseDefense + (c.stance || 0)) * 1.2));
    assert.equal(unit(dispel.after).defense, expectedDefense, enrolled ? 'Source DEFEND keeps its captured amount after real Dispel' : 'No admission/participant: exact native dynamic DEFEND');
    assert.equal(unit(dispel.after).attack, baseAttack, 'All real beneficial stat effects removed');
    const restored = await next(s => s.round === 2 && s.activeUnit.key === target);
    assert.equal(unit(restored).defense, baseDefense, 'First next-round activation clears DEFEND'); assert.equal(unit(restored).attack, baseAttack);
    report[c.name] = {passed: true, c, enrolled, baseDefense, delta, before, positive, defended, dispel, restored, gear, audit: await page().evaluate(() => sourceDefendValidationAudit)};
    fs.writeFileSync(path.join(out, 'partial-result.json'), JSON.stringify({passed: true, report}, null, 2));
    await page().screenshot({path: path.join(out, c.name + '.png')}); await page().close(); console.log('PASS sourceDefend', c.name);
  }
}
