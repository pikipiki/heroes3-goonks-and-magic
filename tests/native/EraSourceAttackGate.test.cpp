#include "../../work/vcmi-wasm/lib/era/EraSourceAttackGate.h"
#include <cassert>
int main()
{
 using namespace era_bridge;
 assert(experienceAttackTriggers(50,50));assert(!experienceAttackTriggers(50,51));
 assert(experienceAttackTriggers(100,100));assert(!experienceAttackTriggers(0,1));
 for(int roll=1;roll<=100;++roll)
 {
  assert(!experiencePrimaryTargetAccepts(false,0,roll)); // Immune defender blocks whole mass cast.
  assert(!experiencePrimaryTargetAccepts(true,100,roll));
  assert(experiencePrimaryTargetAccepts(true,0,roll));
  assert(experiencePrimaryTargetAccepts(true,50,roll)==(roll<=50));
 }
 // Initial gate and each recipient resistance are independent: original attacked stack
 // can pass the first gate but resist the resulting mass cast; others still receive it.
 assert(experiencePrimaryTargetAccepts(true,50,50));
 assert(!experiencePrimaryTargetAccepts(true,50,51));
}
