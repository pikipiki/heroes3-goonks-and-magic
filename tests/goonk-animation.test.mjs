import {reference,motionProfile} from '../work/browser-tests/goonk-animation-profiles.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
const base='mod/goonk/Content/',sprites=base+'Sprites/goonk/',creatures=JSON.parse(fs.readFileSync(base+'config/creatures.json'));
const png=file=>{const bytes=fs.readFileSync(file);assert.equal(bytes.subarray(1,4).toString(),'PNG',file);return{bytes,w:bytes.readUInt32BE(16),h:bytes.readUInt32BE(20)};};
test('Creature backgrounds preserve the original 100-pixel-wide preview geometry at both scales',()=>{
 for(const height of [120,130])for(const scale of [1,2]){const {w,h}=png(base+(scale===1?'Sprites':'Sprites2x')+'/goonk/creature-bg-'+height+'.png');assert.equal(w,100*scale);assert.equal(h,height*scale);}
});
test('All Goonks have distinct walking and attack poses, animated idle frames and bounded native frames',()=>{
 for(const creature of Object.values(creatures)){
  assert.equal(creature.graphics.animationTime.idle,reference.idleFramesPerSecond);
  const stem=creature.graphics.animation.split('/').at(-1),{movement}=motionProfile(stem.replace(/-evo$/,''),stem.endsWith('-evo'));
  const config=JSON.parse(fs.readFileSync(base+'Sprites/'+creature.graphics.animation+'.json'));
  for(const [group,minimum] of [[0,Math.min(6,movement.groups[0])],[2,4],[12,Math.min(6,movement.groups[12])]]){
   const sequence=config.sequences.find(s=>s.group===group);assert(sequence);const hashes=new Set();
   for(const frame of sequence.frames){const {bytes,w,h}=png(base+'Sprites/'+frame);assert.equal(w,450);assert.equal(h,400);assert(bytes.length>1500,'Empty/invalid frame: '+frame);hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));}
   assert(hashes.size>=minimum,creature.name.singular+' lacks distinct poses in group '+group+': '+hashes.size);
  }
  for(const [field,w,h]of [['iconSmall',32,32],['iconLarge',58,64]]){const value=png(base+'Sprites/'+creature.graphics[field]);assert.equal(value.w,w);assert.equal(value.h,h);assert.equal(value.bytes[25],6,'Native creature icons must preserve alpha');}
 }
});
