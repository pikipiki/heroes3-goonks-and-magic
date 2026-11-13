#include "EraSourceXpPlacementRule.h"
#include "EraSourceXpGeometryRule.h"
#include <cassert>
#include <iostream>
using namespace era_bridge_xp_geometry;
int main()
{
    int checks=0;
    {int n=0;SourceRemovalDeck deck(0,3);auto rng=[&](){++n;return 1;};for(int expected:{1,2,3,0,-1,-1})assert(deck.next(rng)==expected);assert(n==3);++checks;}
    {int calls=0,placed=0;const auto n=randomPlacements(3,[&](){++calls;return 0;},[](int){return RawSourceCell{1,-1,0};},[&](int){++placed;});assert(n==0&&placed==0&&calls==186);++checks;}
    {for(int level=0;level<4;++level){int calls=0;std::vector<int> result;randomPlacements(level,[&](){++calls;return 0;},[](int){return RawSourceCell{0,-1,0};},[&](int p){result.push_back(p);});assert(int(result.size())==placementCount(level));assert(result.front()==1);assert(calls==placementCount(level)+1);}++checks;}
    {assert(!placementAccepted(18,{0,-1,1}));assert(!placementAccepted(18,{0,0,0}));assert(!placementAccepted(18,{32,-1,0}));assert(placementAccepted(18,{64,-1,0}));++checks;}
    {assert((fireWallCells(88,3,0)==std::vector<uint8_t>{88,71,54}));assert((fireWallCells(88,1,1)==std::vector<uint8_t>{88,70}));assert((fireWallCells(71,2,0)==std::vector<uint8_t>{71,55,37}));++checks;}
    {for(int side:{0,1}){int calls=0;int hex=summonPosition(side,[&](){++calls;return 0;},[&](int h){return h==(side?14:2);});assert(hex==(side?14:2));assert(calls==11);}int calls=0;assert(summonPosition(0,[&](){++calls;return 0;},[](int){return false;})==-1);assert(calls==150);++checks;}
    {HexState s;created(s,88,{88},0,9);created(s,88,{88},1,17);assert(s.flags[88]==25&&s.latest[88]==1);removed(s,88,{88});assert(s.flags[88]==64&&s.latest[88]==-1); //Old mine visual remains, source mechanics gone.
     created(s,88,{88},2,9);assert((s.flags[88]&63)==9&&s.latest[88]==2);++checks;}
    {HexState s;created(s,88,{88},10,17);created(s,88,{88},11,17);removed(s,88,{88});assert((s.flags[88]&63)==0&&s.latest[88]==-1); //Old expired wall clears newer live wall too.
     ++checks;}
    {HexState s;created(s,88,{88,71,54},20,35);assert(s.flags[88]==35&&s.flags[71]==34&&s.latest[54]==20);created(s,71,{71},21,17);removed(s,88,{88,71,54});assert((s.flags[71]&63)==0);++checks;}
    {HexState s;created(s,88,{88},1,9);removed(s,88,{88});auto t=decode(encode(s));assert(t.flags==s.flags&&t.latest==s.latest);bool threw=false;auto p=encode(s);p[2]=128;try{decode(p);}catch(const std::invalid_argument &){threw=true;}assert(threw);++checks;}
    {assert(rawValue(5,20,50)==150);assert(rawValue(5,10,80)==130);assert(rawValue(2147483647,40,100)==60);assert(rawValue(-1,40,25)==-15);++checks;}
    std::cout<<"source geometry contracts "<<checks<<" PASS\n";
}
