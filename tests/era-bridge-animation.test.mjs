import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{readCreatureAnimationTable}from'../scripts/era-bridge/resources.mjs';import{readDefFrame}from'../scripts/era-bridge/def-frame.mjs';
test('Original CRANIM timing and missile geometry survive translation without shifting IDs',()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/tum/animation-sample.json',import.meta.url))),rows=readCreatureAnimationTable(fixture.text);
 assert.equal(rows.length,3);assert.deepEqual(rows[0].graphics.animationTime,{walk:1.15,attack:1,idle:10});assert.equal(rows[0].graphics.missile,undefined);
 assert.equal(rows[2].eraId,2);assert.equal(rows[2].graphics.missile.offset.upperX,38);assert.equal(rows[2].graphics.missile.attackClimaxFrame,7);assert.equal(rows[2].graphics.missile.frameAngles[0],90);
 const malformed=fixture.text.split('\n');malformed[3]='broken data';assert.throws(()=>readCreatureAnimationTable(malformed.join('\n')),/INVALID_ANIMATION|24 numeric/);
 assert.deepEqual(fixture.phoenix.graphics.animationTime,{walk:1,attack:1,idle:10});
});
test('Portrait DEF decoder rejects unsafe dimensions, missing frames and truncated input',()=>{
 assert.throws(()=>readDefFrame(Buffer.alloc(10),0),/Invalid DEF/);assert.throws(()=>readDefFrame(Buffer.alloc(800),1),/missing frame/);
 const p=817,b=Buffer.alloc(p+32+4);b.writeUInt32LE(1,12);b.writeUInt32LE(1,788);b.writeUInt32LE(p,813);for(const off of [8,12,16,20])b.writeUInt32LE(2,p+off);b[p+32]=2;b[p+33]=2;b[p+34]=2;b[p+35]=2;b[22]=10;b[23]=20;b[24]=30;
 const image=readDefFrame(b,0);assert.deepEqual([image.width,image.height],[2,2]);assert.deepEqual([...image.rgba.subarray(0,4)],[10,20,30,255]);
 const invalid=Buffer.from(b);invalid.writeUInt32LE(8192,p+8);assert.throws(()=>readDefFrame(invalid,0),/dimensions/);
});
