import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{readJsonc}from'../scripts/era-bridge/objects/production-resolvers.mjs';import{source241ProxyFile,source241ProxyPolicy,reviewSource241Proxy}from'../scripts/era-bridge/creatures/source241-proxy-policy.mjs';
test('source241 exact private sole XP proxy proposal preserves every other ability and rejects activation/tamper',()=>{
 const bytes=fs.readFileSync(source241ProxyFile),data=readJsonc(source241ProxyFile),original=structuredClone(data),policy=source241ProxyPolicy(),result=reviewSource241Proxy(policy,bytes,data);
 assert.equal(result.activation,false);assert.deepEqual(result.patch,{'third-upgrades:tumChaoticDragonFly':{abilities:{castWeakness:null}}});assert.deepEqual(data,original);
 assert.deepEqual(result.preservedOtherAbilities,Object.keys(data.tumChaoticDragonFly.abilities).filter(k=>k!=='castWeakness'));
 for(const field of['enabled','nativeValidated'])assert.throws(()=>reviewSource241Proxy({...policy,[field]:true},bytes,data));
 assert.throws(()=>reviewSource241Proxy({...policy,sourceId:105},bytes,data));
 assert.throws(()=>reviewSource241Proxy({...policy,patch:{'core:dragonFly':{abilities:{castWeakness:null}}}},bytes,data));
 assert.throws(()=>reviewSource241Proxy(policy,Buffer.concat([bytes,Buffer.from(' ')]),data));
 const changed=structuredClone(data);changed.tumChaoticDragonFly.abilities.castWeakness.val=99;assert.throws(()=>reviewSource241Proxy(policy,bytes,changed));
});
