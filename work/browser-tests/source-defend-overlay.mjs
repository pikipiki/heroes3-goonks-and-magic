import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';

export async function installSourceDefendOverlay(page, options = {}) {
  const bytes = fs.readFileSync(process.env.SOURCE_DEFEND_POLICY_FILE || 'mod/tum-era/content/config/era-bridge-source-defend.json');
  const policy = JSON.parse(bytes);
  assert.equal(policy.contract, 'source-defend-state-v1');
  assert.equal(policy.enabled, true); assert.equal(policy.complete, true);
  assert.deepEqual(policy.actors, ['third-upgrades:tumChaoticDragonFly']);
  const payload = {policy, policySHA256: crypto.createHash('sha256').update(bytes).digest('hex'), present: options.policy !== false, verifyOnly: options.policy === 'production', policyText: bytes.toString('utf8'), controls: options.controls, layout: options.layout,
    commanders: parseJsonc(fs.readFileSync('mod/wake-of-gods/Mods/Commanders/mod.json', 'utf8'))};
  await page.route('**/game.html?*', async route => {
    const response = await route.fetch(), html = await response.text(), needle = 'module.callMain(["--disable-video"]);'; assert(html.includes(needle));
    const code = `{const p=${JSON.stringify(payload)},FS=module.FS,root='/home/web_user/.local/share/vcmi/',mod=root+'Mods/tum-era/',read=n=>JSON.parse(FS.readFile(mod+n,{encoding:'utf8'})),write=(n,v)=>FS.writeFile(mod+n,JSON.stringify(v));const policy='content/config/era-bridge-source-defend.json';if(p.present){if(p.verifyOnly){if(FS.readFile(mod+policy,{encoding:'utf8'})!==p.policyText)throw Error('Published source DEFEND policy bytes differ');}else write(policy,p.policy);}else{try{FS.unlink(mod+policy);}catch{}}p.commanders.settings.modules.commanders=false;FS.writeFile(root+'Mods/wake-of-gods/Mods/Commanders/mod.json',JSON.stringify(p.commanders));const m=read('mod.json');m.creatures.push('config/source-defend-controls.json');write('content/config/source-defend-controls.json',p.controls);if(p.layout){const a=p.layout.attacker,d=p.layout.defender;m.settings??={};m.settings.combat??={};m.settings.combat.layouts??={};m.settings.combat.layouts.default={tacticsAllowed:false,obstaclesAllowed:false,attackerCommander:137,defenderCommander:149,attackerUnits:a,defenderUnits:d,attackerUnitsLoose:Array.from({length:7},()=>a),attackerUnitsTight:Array.from({length:7},()=>a),defenderUnitsLoose:Array.from({length:7},()=>d),defenderUnitsTight:Array.from({length:7},()=>d)};}write('mod.json',m);window.sourceDefendValidationAudit={policy:p.present?p.policy:null,policySHA256:p.policySHA256,onlyCreatureControls:true,noPrivateXPPoliciesInjected:true,policyVerifiedWithoutReplacement:p.verifyOnly};}`;
    await route.fulfill({response, body: html.replace(needle, code + needle)});
  });
}
