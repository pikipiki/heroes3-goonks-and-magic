import test from 'node:test';import assert from 'node:assert/strict';
import {previewFocus,referenceScale} from '../scripts/audit/creature-preview-focus.mjs';
const unit={key:'test:gremlin',animation:'creatures/Gremlin',nativeCrops:[[2,0,30,20,40,80,50,60],[0,0,130,20,40,80,150,60],[12,0,0,0,400,150,55,60]]};
test('Travel distance and wide attacks cannot reduce the resting body below 80% of the preview',()=>{
 const camera=previewFocus([unit])['CREATURES/GREMLIN'];assert.deepEqual(camera.reference,[30,20,40,80]);assert.deepEqual(camera.origin,[50,60]);
 const scale=referenceScale(camera);assert.equal(scale,1.3);assert(Math.max(40*scale/100,80*scale/130)>=.8);assert.deepEqual(camera.centers[0][0],[150,60]);assert.deepEqual(camera.centers[12][0],[55,60]);
 const withoutAttack=previewFocus([{...unit,nativeCrops:unit.nativeCrops.slice(0,2)}])['CREATURES/GREMLIN'];assert.equal(referenceScale(camera),referenceScale(withoutAttack),'Zoom stays identical when attacks are added');
});
test('The first resting pose keeps its body size when idle wings or weapons extend',()=>{
 const camera=previewFocus([{...unit,nativeCrops:[...unit.nativeCrops,[2,1,0,0,180,180,50,60]]}])['CREATURES/GREMLIN'];assert.deepEqual(camera.reference,[30,20,40,80]);assert.equal(referenceScale(camera),1.3);
});
test('Shared animations retain their body reference and incomplete calibration is rejected',()=>{
 const row={...unit,key:'test:variant',animation:'CREATURES/GREMLIN'};assert.deepEqual(previewFocus([unit,row]),previewFocus([unit]));assert.throws(()=>previewFocus([{key:'broken',animation:'x'}]),/Missing measured poses/);assert.throws(()=>previewFocus([{key:'x',animation:'x',nativeCrops:[[2,0,0,0,0,5,0,0]]}]),/Invalid crop/);
});
