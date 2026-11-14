#include "../../work/vcmi-wasm/lib/era/EraWogOptions.h"
#include <cassert>
#include <string>
#include <vector>
#include <utility>
using namespace era_bridge;
struct Options{std::array<int8_t,6>wogOptions{{-1,-1,-1,-1,-1,-1}};};
struct Start{Options extraOptionsInfo;};
struct Callback{Start start;const Start * getStartInfo()const{return &start;}};
int main()
{
    Callback callback;
    for(std::size_t i=0;i<wogOptionCount;++i)
    {
        const auto option=static_cast<WogOption>(i);
        assert(wogOptionEnabled(callback,option,true));assert(!wogOptionEnabled(callback,option,false));
        callback.start.extraOptionsInfo.wogOptions[i]=0;
        assert(!wogOptionEnabled(callback,option,true));assert(!wogOptionEnabled(callback,option,false));
        callback.start.extraOptionsInfo.wogOptions[i]=1;
        assert(wogOptionEnabled(callback,option,true));assert(wogOptionEnabled(callback,option,false));
        callback.start.extraOptionsInfo.wogOptions[i]=-1;
    }
    assert(validWogChoice(-1)&&validWogChoice(0)&&validWogChoice(1));
    assert(!validWogChoice(-2)&&!validWogChoice(2));
    // Every combination of 300/301 for each source town; explicit OFF removes
    // only that source family's owned identities, never another mod's variant.
    using Row=std::pair<int,std::vector<std::string>>;
    for(std::size_t town=0;town<wogTownFactions.size();++town)
        for(bool fourth:{false,true})for(bool eighth:{false,true})
        {
            std::vector<Row> rows(9);
            for(std::size_t tier=0;tier<rows.size();++tier)rows[tier].first=100+static_cast<int>(tier);
            rows[6].second={"core:original","foreign:fourth",std::string(wogFourthCreatures[town])};
            rows[7].second={std::string(wogEighthCreatures[town][0]),std::string(wogEighthCreatures[town][1]),"foreign:eighth"};
            rows[8].second={"core:portalReserve"};
            const auto original=rows;
            filterWogTownStock(rows,wogTownFactions[town],fourth,eighth,[](const auto & key){return key;});
            assert(rows.size()==original.size());
            for(std::size_t tier=0;tier<rows.size();++tier)assert(rows[tier].first==original[tier].first);
            assert(rows[6].second.size()==(fourth?3u:2u));
            assert(rows[7].second.size()==(eighth?3u:1u));
            assert(rows[6].second[0]=="core:original"&&rows[6].second[1]=="foreign:fourth");
            assert(rows[7].second.back()=="foreign:eighth");assert(rows[8]==original[8]);
            auto goonk=original;filterWogTownStock(goonk,"goonk:goonk",false,false,[](const auto & key){return key;});assert(goonk==original);
            auto other=original;filterWogTownStock(other,"foreign:town",false,false,[](const auto & key){return key;});assert(other==original);
        }
    // An authored missing roster stays missing even with ON; options do not
    // bypass author building restrictions or manufacture a dwelling/stock.
    std::vector<Row> absent(8);filterWogTownStock(absent,"core:castle",true,true,[](const auto & key){return key;});assert(absent[7].second.empty());
}
