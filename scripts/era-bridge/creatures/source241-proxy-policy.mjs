/** Source241-only private retirement proposal. No active installer/API. */
import assert from'node:assert/strict';import crypto from'node:crypto';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export const source241ProxyFile='mod/third-upgrades/content/config/creatures/fortress/lvl3Upg2.json';
export const source241ProxyFileSha='5e76c7d4a0ada33a5ef8cabde10d1ae932c59be0079045d37671ca163eecaa9b';
const key='third-upgrades:tumChaoticDragonFly';
const expected={type:'SPELL_AFTER_ATTACK',subtype:'spell.weakness',val:100,addInfo:[1,0]};
export function source241ProxyPolicy(){return{schemaVersion:1,contract:'source241-direct78-ordered-k45-private-v1',enabled:false,nativeValidated:false,sourceId:241,nativeId:key,sourceFile:source241ProxyFile,sourceFileSha256:source241ProxyFileSha,jsonPointer:'/tumChaoticDragonFly/abilities/castWeakness',intrinsic78:'direct-before-ordered-XP-after-phase',xp45:'k-basic1-chance100-all11ranks',requiredBeforeProduction:['Source45 lifecycle native validation','Direct78 slot/removal native validation','Strict sole-provider source241 admission'],patch:{[key]:{abilities:{castWeakness:null}}}};}
export function reviewSource241Proxy(policy,bytes,parsed){
 assert.deepEqual(policy,source241ProxyPolicy(),'Exact inactive source241 policy required');
 assert.equal(sha(bytes),source241ProxyFileSha,'Pinned whole source241 definition required');
 assert.deepEqual(parsed.tumChaoticDragonFly.abilities.castWeakness,expected);
 const before=parsed.tumChaoticDragonFly.abilities,remaining=Object.fromEntries(Object.entries(before).filter(([k])=>k!=='castWeakness'));
 assert.equal(sha(Buffer.from(JSON.stringify(remaining))),'0fdc48377411df1db0b73d0c634debf052cc7a8cde675b0425e309f411bd5cc0');
 // Return an isolated proposal, never mutate parsed production definitions.
 return{activation:false,patch:structuredClone(policy.patch),preservedOtherAbilities:Object.keys(remaining),otherAbilitiesSha256:sha(Buffer.from(JSON.stringify(remaining)))};
}
