#include "../../work/vcmi-wasm/lib/era/EraAcidAttack.h"
#include <cassert>
#include <stdexcept>
#include <utility>
#include <initializer_list>
int main()
{
    using era_bridge::AcidAttack;
    assert(!AcidAttack::succeeds(0));assert(AcidAttack::succeeds(1));
    assert(AcidAttack::succeeds(20));assert(!AcidAttack::succeeds(21));
    assert(!AcidAttack::succeeds(100));
    // Source truncates the product once, rather than truncating each creature.
    assert(AcidAttack::damage(75,3)==112);
    assert(AcidAttack::damage(100,3)==150);
    assert(AcidAttack::damage(75,0)==0);
    assert(AcidAttack::damage(0,100)==0);
    assert(AcidAttack::damage(100,21474837)==-1073741798);
    for(const auto pair : {std::pair<int,int64_t>{-1,1},{75,-1},{1,2147483648LL}})
    {
        bool rejected=false;try{AcidAttack::damage(pair.first,pair.second);}catch(const std::runtime_error&){rejected=true;}
        assert(rejected);
    }
}
