import test from'node:test';import fs from'node:fs';import os from'node:os';import path from'node:path';import{execFileSync}from'node:child_process';
test('241 native custom-only scope isolates caster+target+78 and restores nested contexts',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'source241-scope-'));try{const cpp=path.join(dir,'x.cpp'),bin=path.join(dir,'x');fs.writeFileSync(cpp,`
#define VCMI_LIB_NAMESPACE_BEGIN
#define VCMI_LIB_NAMESPACE_END
#include "EraDragonFly241DispelScope.h"
#include "EraDragonFly241FrameRule.h"
#include <cassert>
namespace spells{class Caster{};}namespace battle{class Unit{};}
int main(){using namespace era_compat;spells::Caster a,b;battle::Unit x,y;
 assert(!DragonFly241DispelCustomScope::applies(78,&a,&x));
 {DragonFly241DispelCustomScope outer(&a,&x);assert(DragonFly241DispelCustomScope::applies(78,&a,&x));assert(!DragonFly241DispelCustomScope::applies(35,&a,&x));assert(!DragonFly241DispelCustomScope::applies(78,&b,&x));assert(!DragonFly241DispelCustomScope::applies(78,&a,&y));
 {DragonFly241DispelCustomScope inner(&b,&y);assert(DragonFly241DispelCustomScope::applies(78,&b,&y));assert(!DragonFly241DispelCustomScope::applies(78,&a,&x));}
 assert(DragonFly241DispelCustomScope::applies(78,&a,&x));}
 assert(!DragonFly241DispelCustomScope::applies(78,&a,&x));assert(!dragonFly241CustomPositiveSpell(80));assert(!dragonFly241CustomPositiveSpell(81));assert(dragonFly241CustomPositiveSpell(82));
 using Frame=era_bridge::Source241AttackFrame<spells::Caster,battle::Unit>;
 assert(!Frame::handles(&a,&x));{Frame outer(&a,&x);assert(Frame::handles(&a,&x));assert(Frame::consumeLate(&a,&x));assert(!Frame::consumeLate(&a,&x));
 {Frame inner(&b,&y);assert(Frame::handles(&b,&y)&&!Frame::handles(&a,&x));assert(Frame::consumeLate(&b,&y));}
 assert(Frame::handles(&a,&x)&&!Frame::consumeLate(&a,&x));}assert(!Frame::handles(&a,&x));
}
`);execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-I'+path.resolve('work/vcmi-wasm/lib/era'),cpp,'-o',bin]);execFileSync(bin);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
