import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('generic45 specialty correction replaces only the original contribution and retains custom native extensions',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'source45-specialty-'));
 try{
  const file=path.join(dir,'x.cpp'),bin=path.join(dir,'x');
  fs.writeFileSync(file,`
#include "EraWeakness45GenericRule.h"
#include <cassert>
using namespace era_bridge;
int main(){
 assert(weakness45GenericMagnitude({-3,"core:azureDragon","core:mirlanda",10,0,true,false})==3);
 // Commander native0 => nativepeculiar3, but original sourcelevel6 =>0.
 assert(weakness45GenericMagnitude({-6,"wake-of-gods.commanders:paladin1","core:mirlanda",0,0,true,false})==3);
 assert(weakness45GenericMagnitude({-6,"core:pikeman","core:mirlanda",1,0,true,false})==6);
 assert(weakness45GenericMagnitude({-3,"core:pikeman","core:mirlanda",1,1,false,false})==3);
 // Native wrapper did not apply a hero specialty, sourcekind2 still usesCURRENThero.
 assert(weakness45GenericMagnitude({-3,"core:pikeman","core:olema",1,2,false,false})==6);
 assert(weakness45GenericMagnitude({-6,"goonk:bubu","core:mirlanda",1,0,true,false})==6);
 assert(weakness45GenericMagnitude({-9,"wake-of-gods.commanders:paladin1","goonk:customHero",0,0,true,false})==9);
 // CustomADD_VALUE3 remains while only originalpeculiar3 is correctedto0.
 assert(weakness45GenericMagnitude({-3,"wake-of-gods.commanders:paladin1","core:mirlanda",0,0,true,false})==0);
 assert(weakness45GenericMagnitude({-9,"wake-of-gods.commanders:paladin1","core:mirlanda",0,0,true,true})==9);
 auto gain=weakness45ApplyGeneric({},10,3,1,-4);assert(gain.attackDelta==4&&gain.state.magnitude==-4);
 auto remove=weakness45Remove(gain.state);assert(remove.attackDelta==-4);
 auto zero=weakness45ApplyGeneric({},10,0,1,-4);assert(zero.state.permanentLoss==-4&&!weakness45Remove(zero.state).removed);
 auto prayer=weakness45ApplyGeneric({},-4,3,1,3);assert(prayer.state.magnitude==-4&&prayer.attackDelta==4);
}
`);
  execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-I'+path.resolve('work/vcmi-wasm/lib/era'),file,'-o',bin]);execFileSync(bin);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
