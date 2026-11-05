import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import portraits from'../web/goonk-hd-portraits-data.mjs';
test('Every Goonk evolution has a distinct HD portrait from a transparent source sheet',()=>{
 const creatures=JSON.parse(fs.readFileSync(new URL('../mod/goonk/Content/config/creatures.json',import.meta.url))),files=new Set(),regions=new Set();assert.equal(Object.keys(portraits).length,22);
 for(const key of Object.keys(creatures)){const p=portraits[key.toLowerCase()];assert(p,key);files.add(p.file);regions.add(JSON.stringify(p));assert(p.w>250&&p.h>300,'Use detailed original artwork, not enlarged native icons');assert(p.x>=0&&p.y>=0&&p.x+p.w<=1536&&p.y+p.h<=1024);assert(fs.statSync(new URL('../web/'+p.file,import.meta.url)).size>10000);}
 assert.equal(regions.size,22);assert.equal(files.size,4,'Three shared sheets and the solar portrait cover the entire town');
 for(const grade of['base','royal','exalted']){const source=fs.readFileSync(new URL('../outputs/goonk-art/portraits-hd-'+grade+'-v1.png',import.meta.url));assert.equal(source.readUInt32BE(16),1536);assert.equal(source.readUInt32BE(20),1024);assert.equal(source[25],6,'Preserve RGBA transparency');}
});
