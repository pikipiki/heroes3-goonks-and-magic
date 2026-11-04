#include "../../work/vcmi-wasm/lib/era/EraPersonalHate.h"
#include <cassert>
#include <cmath>
using EraBridge::personalHateBeforeDefense;
int main()
{
 auto damage=[](double base,double attack,int personal,double defense){return std::floor(personalHateBeforeDefense(base,attack,personal)*defense);};
 // One flat contribution on every physical strike, never one per creature.
 assert(damage(100,1,200,1)==300);
 assert(damage(200,1,200,1)==400);
 assert(damage(40,1,200,1)==240);
 assert(damage(80,1,200,1)==280);
 // Native reductions happen after the addition, including ranged half damage.
 assert(damage(100,1,200,.5)==150);
 assert(damage(200,1,200,.5)==200);
 assert(damage(100,1,200,0)==0);
 // XP h and attack advantage remain additive to each other, not a flat amount.
 assert(damage(100,1+.5+2,200,1)==550);
 assert(2*damage(110,1+.5+2,0,1)==770);
 // A second hit/retaliation calls the physical calculator again.
 assert(2*damage(100,1,200,1)==600);
 // Adding after the half-damage factor would incorrectly produce250.
 assert(damage(101,1,200,.5)==150);
 // A creature pair without this cfg field keeps the former native calculation.
 assert(damage(100,1+.5,0,.5)==75);
}
