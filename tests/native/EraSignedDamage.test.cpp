#include "../../work/vcmi-wasm/lib/era/EraSignedDamage.h"
#include <cassert>
#include <cstdint>
int main()
{
    using era_bridge::negativeSpellDamage;
    auto one=negativeSpellDamage(10,200,200,-250);
    assert(one.count==11 && one.firstHPleft==250); // signed IDIV, notceilHP
    assert(int64_t(one.count-1)*200+one.firstHPleft==2250);
    auto two=negativeSpellDamage(10,200,100,-250);
    assert(two.count==10 && two.firstHPleft==350);
    assert(int64_t(two.count-1)*200+two.firstHPleft==2150);
    auto three=negativeSpellDamage(10,200,200,-400);
    assert(three.count==12 && three.firstHPleft==200);
    for(int hp=1;hp<=400;hp+=7)
      for(int first=1;first<=hp;first+=3)
       for(int damage=-1;damage>=-1000;damage-=19)
       {
        auto result=negativeSpellDamage(10,hp,first,damage);
        assert(int64_t(result.count-1)*hp+result.firstHPleft==int64_t(9)*hp+first-damage);
        assert(result.count==10-(hp-first+damage)/hp);
        assert(result.firstHPleft==hp-(hp-first+damage)%hp);
       }
    bool rejected=false;try { negativeSpellDamage(10,200,200,0); }catch(...) {rejected=true;}
    assert(rejected);
}
