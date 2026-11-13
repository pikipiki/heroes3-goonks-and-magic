/* Pure source placement law; engine entry requires explicit XP admission.
 * Original 50C8D0/50C930, 5A0664/5A0846, 5A0BBB, 5A742E.
 * GPL-2.0-or-later. */
#pragma once
#include <array>
#include <cstdint>
#include <stdexcept>
#include <vector>
namespace era_bridge_xp_geometry
{
class SourceRemovalDeck
{
    int minimum;
    std::vector<int> remaining;
public:
    SourceRemovalDeck(int first,int last):minimum(first)
    {
        if(first<0||last<first||last>186)throw std::invalid_argument("Source removal deck domain");
        for(int i=first;i<=last;++i)remaining.push_back(i);
    }
    template<class RawCrtRand> int next(RawCrtRand && rawRand)
    {
        if(remaining.empty())return minimum-1;
        unsigned ordinal=0;
        if(remaining.size()>1)
        {
            const int raw=rawRand();
            if(raw<0||raw>32767)throw std::invalid_argument("Original CRT rand result required");
            ordinal=static_cast<unsigned>(raw)%remaining.size();
        }
        const int value=remaining[ordinal];
        remaining.erase(remaining.begin()+ordinal); //Not swap-with-last.
        return value;
    }
};
struct RawSourceCell
{
    std::uint8_t flags1D4;
    std::int8_t side1DC;
    std::int32_t occupancy1E0;
};
inline bool placementAccepted(int hex,const RawSourceCell & cell)
{
    if(hex<0||hex>186)throw std::invalid_argument("Source battlefield hex");
    return hex%17!=0&&hex%17!=16&&(cell.flags1D4&0x3f)==0&&cell.side1DC<0&&cell.occupancy1E0<=0;
}
inline int placementCount(int mastery)
{
    if(mastery<0||mastery>3)throw std::invalid_argument("Source spell mastery");
    constexpr std::array<int,4> counts{4,4,6,8};return counts[mastery];
}
template<class RawCrtRand,class ReadCell,class Place>
int randomPlacements(int mastery,RawCrtRand && random,ReadCell && readCell,Place && place)
{
    const int wanted=placementCount(mastery);SourceRemovalDeck deck(0,186);int count=0;
    while(count<wanted)
    {
        const int hex=deck.next(random);if(hex<0)break;
        if(!placementAccepted(hex,readCell(hex)))continue;
        place(hex); //Apply source cell updates before drawing the next candidate.
        ++count;
    }
    return count;
}
inline std::vector<std::uint8_t> fireWallCells(int anchor,int mastery,int currentSide)
{
    if(anchor<0||anchor>186||(currentSide!=0&&currentSide!=1))throw std::invalid_argument("Source wall context");
    placementCount(mastery);const bool odd=(anchor/17)%2;
    const int middle=anchor-17+(odd?(currentSide==1?-1:0):(currentSide==0?1:0));
    std::vector<std::uint8_t> cells{static_cast<std::uint8_t>(anchor),static_cast<std::uint8_t>(middle)};
    if(mastery>=2)cells.push_back(static_cast<std::uint8_t>(anchor-34));
    return cells;
}
template<class RawCrtRand,class CanOccupy>
int summonPosition(int currentSide,RawCrtRand && random,CanOccupy && canOccupy)
{
    if(currentSide!=0&&currentSide!=1)throw std::invalid_argument("Source CURRENT side");
    for(int left=1,right=15;right>0;++left,--right)
    {
        SourceRemovalDeck rows(0,10);const int column=currentSide==0?left:right;
        for(int row=rows.next(random);row>=0;row=rows.next(random))
        {
            const int hex=17*row+column;
            if(canOccupy(hex))return hex; //Source446960(tempCreature,hex,0,0) adapter still required.
        }
    }
    return -1;
}
}
