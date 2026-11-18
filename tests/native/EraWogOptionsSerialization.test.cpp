// Exercise the production serializer with byte boundaries and a following
// sentinel; historical layouts must not consume the next old field.
#define VCMI_LIB_NAMESPACE_BEGIN
#define VCMI_LIB_NAMESPACE_END
#define DLL_LINKAGE
#include "../../work/vcmi-wasm/lib/ExtraOptionsInfo.h"
#include "../../work/vcmi-wasm/lib/serializer/ESerializationVersion.h"
#include <cassert>
#include <vector>
struct Bytes
{
    using Version=ESerializationVersion;
    bool saving;
    Version version;
    std::vector<int8_t> bytes;
    std::size_t cursor=0;
    bool hasFeature(Version v)const{return version>=v;}
    template<class T>Bytes & operator&(T & value)
    {
        if(saving)bytes.push_back(static_cast<int8_t>(value));
        else {assert(cursor<bytes.size());value=static_cast<T>(bytes[cursor++]);}
        return *this;
    }
    Bytes & operator&(uint32_t & value)
    {
        if(!saving)value=0;
        for(unsigned shift=0;shift<32;shift+=8)
        {
            int8_t byte=static_cast<int8_t>(value>>shift);*this&byte;
            if(!saving)value|=static_cast<uint32_t>(static_cast<uint8_t>(byte))<<shift;
        }
        return *this;
    }
    template<class T,std::size_t N>Bytes & operator&(std::array<T,N> & values)
    {for(auto & value:values)*this&value;return *this;}
    Bytes & operator&(std::vector<int8_t> & values)
    {
        auto count=static_cast<uint32_t>(values.size());*this&count;
        if(!saving){assert(count<=100);values.resize(count);}
        for(auto & value:values)*this&value;
        return *this;
    }
};
int main()
{
    using V=ESerializationVersion;
    // Literal historical wire sizes, independent of the production constants.
    const auto countFor=[](V version){return version>=V::GOONK_MITHRIL_WEEKLY_SITES?20u:
        version>=V::GOONK_WOG_INVERTED_SPEEDS?19u:
        version>=V::GOONK_WOG_GROUNDED_FLIERS?18u:
        version>=V::GOONK_WOG_EXTRA_DWELLING_CREATURES?17u:
        version>=V::GOONK_WOG_MONTHLY_VISITS?16u:
        version>=V::GOONK_WOG_TOWN_GRAILS?15u:
        version>=V::GOONK_WOG_ARMY_GROWTH?14u:
        version>=V::GOONK_WOG_OPTION_CATALOGUE?13u:
        version>=V::GOONK_WOG_OPTIONS_EXTENDED?7u:6u;};
    for(auto version:{V::GOONK_WOG_OPTIONS,V::GOONK_ERA_GAMEPLAY,V::GOONK_WOG_OPTIONS_EXTENDED,V::GOONK_HENCHMAN_BATTLE_EXPERIENCE,V::GOONK_WOG_OPTION_CATALOGUE,V::GOONK_WOG_ARMY_GROWTH,V::GOONK_WOG_TOWN_GRAILS,V::GOONK_WOG_MONTHLY_VISITS,V::GOONK_ERA3_QUICK_LOCALS,V::GOONK_WOG_EXTRA_DWELLING_CREATURES,V::GOONK_WOG_GROUNDED_FLIERS,V::GOONK_WOG_INVERTED_SPEEDS,V::GOONK_MITHRIL_SOURCE_DWELLINGS,V::GOONK_ERA3_STRING_LOCALS,V::GOONK_ERA3_STRING_RECEIVERS,V::GOONK_ERA3_RANDOM_RANGES,V::CURRENT})
    {
        ExtraOptionsInfo original;original.cheatsAllowed=false;original.unlimitedReplay=true;
        for(std::size_t i=0;i<original.wogOptions.size();++i)original.wogOptions[i]=static_cast<int8_t>(i%3)-1;
        Bytes writer{true,version,{},0};original.serialize(writer);
        const auto count=countFor(version);const bool catalogue=version>=V::GOONK_WOG_OPTION_CATALOGUE;
        assert(writer.bytes.size()==2+count+(catalogue?4u:0u));writer.bytes.push_back(73);
        Bytes reader{false,version,writer.bytes,0};ExtraOptionsInfo restored;restored.wogOptions.fill(0);restored.serialize(reader);
        assert(!restored.cheatsAllowed&&restored.unlimitedReplay);
        for(std::size_t i=0;i<restored.wogOptions.size();++i)assert(restored.wogOptions[i]==(i<count?original.wogOptions[i]:-1));
        int8_t sentinel=0;reader&sentinel;assert(sentinel==73&&reader.cursor==writer.bytes.size());
    }
    Bytes old{false,V::BONUS_TRIGGER,{1,0,73},0};ExtraOptionsInfo restored;restored.wogOptions.fill(1);restored.serialize(old);
    for(auto choice:restored.wogOptions)assert(choice==-1);
    int8_t sentinel=0;old&sentinel;assert(sentinel==73);
    for(auto version:{V::GOONK_ERA_GAMEPLAY,V::GOONK_WOG_OPTIONS_EXTENDED,V::GOONK_WOG_OPTION_CATALOGUE,V::GOONK_WOG_ARMY_GROWTH,V::GOONK_WOG_TOWN_GRAILS,V::GOONK_WOG_MONTHLY_VISITS,V::GOONK_ERA3_QUICK_LOCALS,V::GOONK_WOG_EXTRA_DWELLING_CREATURES,V::GOONK_WOG_GROUNDED_FLIERS,V::GOONK_WOG_INVERTED_SPEEDS,V::GOONK_MITHRIL_SOURCE_DWELLINGS,V::GOONK_ERA3_STRING_LOCALS,V::GOONK_ERA3_STRING_RECEIVERS,V::GOONK_ERA3_RANDOM_RANGES,V::CURRENT})
        for(int invalid:{-128,-2,2,127})
        {
            const auto count=countFor(version);const auto prefix=version>=V::GOONK_WOG_OPTION_CATALOGUE?4u:0u;
            for(std::size_t i=0;i<count;++i)
            {
                std::vector<int8_t> bytes(2+prefix+count,0);
                if(prefix)bytes[2]=static_cast<int8_t>(count);
                bytes[2+prefix+i]=static_cast<int8_t>(invalid);
                Bytes input{false,version,bytes,0};bool threw=false;
                try{ExtraOptionsInfo value;value.serialize(input);}catch(const std::runtime_error &){threw=true;}
                assert(threw);
            }
        }
    // A shorter stored catalogue inherits appended choices. An unknown larger
    // catalogue is rejected instead of silently dropping gameplay rules.
    for(unsigned count:{0u,3u,13u,14u,15u,16u,17u,18u,19u,static_cast<unsigned>(era_bridge::wogOptionCount+1)})
    {
        std::vector<int8_t> bytes(6+count,0);bytes[2]=static_cast<int8_t>(count);bytes.push_back(73);
        Bytes input{false,V::CURRENT,bytes,0};ExtraOptionsInfo value;bool threw=false;
        try{value.serialize(input);}catch(const std::runtime_error &){threw=true;}
        assert(threw==(count>era_bridge::wogOptionCount));
        if(threw)continue;
        for(std::size_t i=0;i<value.wogOptions.size();++i)assert(value.wogOptions[i]==(i<count?0:-1));
        sentinel=0;input&sentinel;assert(sentinel==73);
    }
    // A new reader must still enforce the capability of an older stream,
    // rather than accepting a future choice merely because its array fits.
    for(auto version:{V::GOONK_WOG_OPTION_CATALOGUE,V::GOONK_WOG_ARMY_GROWTH,V::GOONK_WOG_TOWN_GRAILS,V::GOONK_WOG_MONTHLY_VISITS,V::GOONK_ERA3_QUICK_LOCALS,V::GOONK_WOG_EXTRA_DWELLING_CREATURES,V::GOONK_WOG_GROUNDED_FLIERS,V::GOONK_WOG_INVERTED_SPEEDS,V::GOONK_ERA3_RANDOM_RANGES})
    {
        const auto count=countFor(version)+1;
        std::vector<int8_t> bytes(6+count,0);bytes[2]=static_cast<int8_t>(count);
        Bytes input{false,version,bytes,0};bool threw=false;
        try{ExtraOptionsInfo value;value.serialize(input);}catch(const std::runtime_error &){threw=true;}
        assert(threw);
    }
}
