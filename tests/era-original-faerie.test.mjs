import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {reviewedOriginalFaerie} from '../scripts/era-bridge/creatures/original-faerie.mjs';
const read=()=>JSON.parse(fs.readFileSync(new URL('../outputs/wog-priorities-0.4.147/native-original-faerie134.json',import.meta.url)));
test('Original134 requires all eight genuine paired native casting controls, including chain RNG and five-times-count power',()=>{
 const review=read();
 if(review.complete)assert.deepEqual(reviewedOriginalFaerie(review),{schemaVersion:1,creature:'core:fairieDragon'});
 else assert.throws(()=>reviewedOriginalFaerie(review));
 const noProtection=read();delete noProtection.protectionOrder;assert.throws(()=>reviewedOriginalFaerie(noProtection));
 const partial=read();delete partial.native.report[19];assert.throws(()=>reviewedOriginalFaerie(partial));
 const wrongActor=read();wrongActor.native.report[15].cast.actor='tum-era:eraCreature356';assert.throws(()=>reviewedOriginalFaerie(wrongActor));
 const wrongPower=read();wrongPower.native.report[19].cast.sourcePower=2;assert.throws(()=>reviewedOriginalFaerie(wrongPower));
});
