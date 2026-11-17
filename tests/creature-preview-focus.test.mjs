import test from 'node:test';import assert from 'node:assert/strict';
import {previewFocus} from '../scripts/audit/creature-preview-focus.mjs';
test('One camera preserves an attack lunge and fits every pose without changing scale',()=>{
 const units=[{key:'test:naga',animation:'creatures/Naga',nativeCrops:[[2,0,30,20,40,80],[12,0,10,10,95,85],[12,1,20,15,70,90]]}];
 const camera=previewFocus(units)['CREATURES/NAGA'];assert.deepEqual(camera,[10,10,95,95]);
 const scale=Math.min(100*.8/camera[2],130*.8/camera[3]);
 for(const pose of units[0].nativeCrops){const [,,x,y,w,h]=pose;assert(x>=camera[0]&&y>=camera[1]&&x+w<=camera[0]+camera[2]&&y+h<=camera[1]+camera[3]);assert(w*scale<=80&&h*scale<=104);}
 assert.equal((30-camera[0])*scale-(10-camera[0])*scale,20*scale,'The attack offset stays visible');
});
test('Variants sharing an animation use one complete camera and incomplete audits are rejected',()=>{
 const rows=[{key:'a',animation:'goonk/pink',nativeCrops:[[2,0,30,20,40,80]]},{key:'b',animation:'GOONK/PINK',nativeCrops:[[12,0,10,10,95,85]]}];
 assert.deepEqual(previewFocus(rows),{'GOONK/PINK':[10,10,95,90]});assert.throws(()=>previewFocus([{key:'broken',animation:'x'}]),/Missing measured poses/);assert.throws(()=>previewFocus([{key:'x',animation:'x',nativeCrops:[[0,0,0,0,0,5]]}]),/Invalid crop/);
});

test('Unplayed hit/defence poses cannot shrink the mobile inspection camera',()=>{
 assert.deepEqual(previewFocus([{key:'x',animation:'x',nativeCrops:[[2,0,30,20,40,80],[3,0,0,0,400,400]]}]),{X:[30,20,40,80]});
});
