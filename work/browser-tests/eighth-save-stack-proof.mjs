/** Bounded read-only proof for a unique fixture stack in an actual native save.
 * CStackBasicDescriptor writes CreatureID string/count; empty CArtifactSet writes
 * backpack0/worn0, then current CStackInstance writes dummy armyID−1 and totalXP.
 * Never edits the save and refuses ambiguous/nonempty-artifact records. */
import assert from'node:assert/strict';
export function uniqueEmptyArtifactStack(bytes,key,expectedCount){
 const b=Buffer.from(bytes),word=Buffer.from(key),offset=b.indexOf(word);assert(offset>=0,'Original stack key is present in native saved state');assert.equal(b.indexOf(word,offset+1),-1,'Fixture stack key is unique');let cursor=offset+word.length;
 const integer=()=>{let value=0,shift=0;for(let i=0;i<10;i++){const byte=b[cursor++];assert(byte!==undefined);if(byte&128){value+=(byte&127)*2**shift;shift+=7;}else{return value+(byte&63)*2**shift?((byte&64)?-1:1)*(value+(byte&63)*2**shift):0;}}throw Error('Malformed native integer');};
 const count=integer();assert.equal(count,expectedCount,'Native descriptor count matches observed stack');assert.equal(integer(),0,'Fixture stack has empty artifact backpack');assert.equal(integer(),0,'Fixture stack has no worn artifacts');assert.equal(integer(),-1,'Expected NO_RAW_POINTERS dummy armyID');const totalExperience=integer();assert(totalExperience>=0);return{key,offset,count,totalExperience,bytesRead:cursor-offset};
}
