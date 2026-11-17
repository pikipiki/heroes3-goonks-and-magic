#include "../../work/vcmi-wasm/lib/era/EraMithrilRules.h"
#include <cassert>
int main()
{
    using namespace era_bridge::mithril;
    for(int resource=0;resource<6;++resource)assert(mineCost(resource)==4);
    assert(mineCost(6)==7&&mineCost(7)==7&&mineCost(-1)==0);
    assert(mineCost(0,true)==1&&mineCost(1,true)==3&&mineCost(6,true)==5);
    assert(dwellingCost(1,false)==1&&dwellingCost(3,false)==1&&dwellingCost(4,false)==2);
    assert(dwellingCost(5,true)==4&&dwellingCost(6,true)==6);
    for(int offset=0;offset<7;++offset)assert(mineActive(20+offset,27));
    assert(!mineActive(27,27)&&!mineActive(99,0));
    assert(daysRemaining(20,27)==7&&daysRemaining(28,27)==0);
    assert(near(1,1,0,2,2,0)&&!near(1,1,0,2,2,1)&&!near(1,1,0,3,1,0));
    assert(fixedCost(43)==1&&fixedCost(45)==1&&fixedCost(87)==3&&fixedCost(104)==4);
    assert(fixedCost(109)==5&&fixedCost(112)==5&&fixedCost(113)==2);
}
