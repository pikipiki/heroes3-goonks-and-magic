// Exercise the production serializer with exact byte boundaries, including a
// following sentinel: appending an option must not consume the next old field.
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
    template<class T,std::size_t N>Bytes & operator&(std::array<T,N> & values)
    {for(auto & value:values)*this&value;return *this;}
};
int main()
{
    for(auto version:{ESerializationVersion::GOONK_WOG_OPTIONS,ESerializationVersion::GOONK_ERA_GAMEPLAY,ESerializationVersion::CURRENT})
    {
        ExtraOptionsInfo original;original.cheatsAllowed=false;original.unlimitedReplay=true;
        original.wogOptions={{-1,0,1,1,0,-1,1}};
        Bytes writer{true,version,{},0};original.serialize(writer);
        const bool extended=version==ESerializationVersion::CURRENT;
        assert(writer.bytes.size()==(extended?9u:8u));writer.bytes.push_back(73);
        Bytes reader{false,version,writer.bytes,0};ExtraOptionsInfo restored;restored.wogOptions.fill(0);restored.serialize(reader);
        assert(!restored.cheatsAllowed&&restored.unlimitedReplay);
        for(std::size_t i=0;i<6;++i)assert(restored.wogOptions[i]==original.wogOptions[i]);
        assert(restored.wogOptions[6]==(extended?1:-1));
        int8_t sentinel=0;reader&sentinel;assert(sentinel==73&&reader.cursor==writer.bytes.size());
    }
    Bytes old{false,ESerializationVersion::BONUS_TRIGGER,{1,0,73},0};ExtraOptionsInfo restored;restored.wogOptions.fill(1);restored.serialize(old);
    for(auto choice:restored.wogOptions)assert(choice==-1);
    int8_t sentinel=0;old&sentinel;assert(sentinel==73);
    for(auto version:{ESerializationVersion::GOONK_ERA_GAMEPLAY,ESerializationVersion::CURRENT})
        for(int invalid:{-128,-2,2,127})
        {
            const auto count=version==ESerializationVersion::CURRENT?7u:6u;
            for(std::size_t i=0;i<count;++i)
            {
                std::vector<int8_t> bytes(2+count,0);bytes[2+i]=static_cast<int8_t>(invalid);
                Bytes input{false,version,bytes,0};bool threw=false;
                try{ExtraOptionsInfo value;value.serialize(input);}catch(const std::runtime_error &){threw=true;}
                assert(threw);
            }
        }
}
