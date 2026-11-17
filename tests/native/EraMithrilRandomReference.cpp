#include "../../work/vcmi-wasm/lib/era/EraMithrilRandomRules.h"
#include <iostream>
#include <string>
#include <cassert>
int main(int argc,char ** argv)
{
    if(argc!=2)return 1;
    const auto seed=static_cast<uint32_t>(std::stoll(argv[1]));
    era_bridge::mithril::ShrineRandom random(seed);
    std::cout<<"{\"raw\":[";
    for(int i=0;i<16;++i){if(i)std::cout<<',';std::cout<<random.next();}
    std::cout<<"],\"shuffle\":[";
    const auto shuffled=era_bridge::mithril::shrineSpellOrder(seed);
    for(size_t i=0;i<shuffled.size();++i){if(i)std::cout<<',';std::cout<<shuffled[i];}
    std::cout<<"],\"ranges\":[";
    era_bridge::mithril::ShrineRandom ranged(seed);
    const int32_t bounds[][2]={{INT32_MIN,0},{INT32_MIN,INT32_MAX},{0,INT32_MAX},{5,5},{10,5},{-100,100},{0,69},{1,69}};
    for(size_t i=0;i<8;++i){if(i)std::cout<<',';std::cout<<ranged.range(bounds[i][0],bounds[i][1]);}
    std::cout<<"],\"safe\":[";
    for(size_t i=0;i<8;++i){if(i)std::cout<<',';std::cout<<era_bridge::mithril::safeRand(seed,bounds[i][0],bounds[i][1]);}
    std::cout<<"],\"choice\":"<<era_bridge::mithril::shrineSpell(seed,{1,3,4,5,66})<<'}';
    assert(era_bridge::mithril::shrineSpell(seed,{})==-1);
    assert(era_bridge::mithril::shrineSpell(seed,{70})==-1);
}
