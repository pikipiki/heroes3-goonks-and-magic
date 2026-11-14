/* Per-game WoG options; no global mod or roster mutation. GPL-2.0-or-later. */
#pragma once
#include <array>
#include <cstddef>
#include <cstdint>
#include <string_view>
#include <algorithm>
namespace era_bridge
{
enum class WogOption : std::size_t
{
    Commanders=0, StackExperience=1, Replacements=2, BuildTwice=3,
    FourthUpgrades=4, EighthCreatures=5
};
inline constexpr std::size_t wogOptionCount=6;
inline constexpr bool validWogChoice(int value){return value>=-1&&value<=1;}
inline constexpr bool resolveWogChoice(int value,bool inherited)
{return value<0?inherited:value==1;}
template<typename Callback>
bool wogOptionEnabled(const Callback & callback,WogOption option,bool inherited)
{
    const auto * start=callback.getStartInfo();
    return !start?inherited:resolveWogChoice(start->extraOptionsInfo.wogOptions[static_cast<std::size_t>(option)],inherited);
}
inline constexpr std::array<std::string_view,9> wogTownFactions{{
    "core:castle","core:rampart","core:tower","core:inferno","core:necropolis",
    "core:dungeon","core:stronghold","core:fortress","core:conflux"}};
inline bool sourceWogTown(std::string_view faction)
{return std::find(wogTownFactions.begin(),wogTownFactions.end(),faction)!=wogTownFactions.end();}
inline constexpr std::array<std::string_view,9> wogFourthCreatures{{
    "tum-era:cherub","tum-era:gemDragon","tum-era:guardianOfZeus","tum-era:antichrist",
    "tum-era:redBonesDragon","tum-era:chasmDragon","tum-era:ancestralBehemoth",
    "tum-era:nightmareHydra","tum-era:divinePhoenix"}};
inline constexpr std::array<std::array<std::string_view,2>,9> wogEighthCreatures{{
    {{"tum-era:eraCreature269","tum-era:eraCreature278"}},{{"tum-era:eraCreature349","tum-era:eraCreature350"}},
    {{"tum-era:eraCreature271","tum-era:eraCreature280"}},{{"tum-era:eraCreature337","tum-era:eraCreature338"}},
    {{"tum-era:eraCreature331","tum-era:eraCreature332"}},{{"tum-era:eraCreature351","tum-era:eraCreature352"}},
    {{"tum-era:eraCreature275","tum-era:eraCreature283"}},{{"tum-era:eraCreature353","tum-era:eraCreature354"}},
    {{"tum-era:eraCreature355","tum-era:eraCreature356"}}}};
// Limit removal to the exact source family's owned identities, and retain row
// positions/stock amounts (notably Dungeon's independent Portal reserve at8).
inline bool wogTownRecruitAllowed(std::string_view faction,std::size_t tier,
    std::string_view creature,bool fourth,bool eighth)
{
    const auto it=std::find(wogTownFactions.begin(),wogTownFactions.end(),faction);
    if(it==wogTownFactions.end())return true;
    const auto index=static_cast<std::size_t>(it-wogTownFactions.begin());
    if(!fourth&&tier==6&&creature==wogFourthCreatures[index])return false;
    if(!eighth&&tier==7&&(creature==wogEighthCreatures[index][0]||creature==wogEighthCreatures[index][1]))return false;
    return true;
}
template<typename Rows,typename Key>
void filterWogTownStock(Rows & rows,std::string_view faction,bool fourth,bool eighth,Key key)
{
    if((fourth&&eighth)||!sourceWogTown(faction))return;
    for(std::size_t tier=6;tier<rows.size()&&tier<=7;++tier)
    {
        auto & variants=rows[tier].second;
        variants.erase(std::remove_if(variants.begin(),variants.end(),[&](const auto & creature)
        {return !wogTownRecruitAllowed(faction,tier,key(creature),fourth,eighth);}),variants.end());
    }
}
}
