/* Bounded original DEF geometry for source446350, GPL-2.0-or-later. */
#pragma once
#include <cstddef>
#include <cstdint>
#include <optional>
namespace era_bridge
{
inline std::optional<int> dungeonFirstDefTop(const uint8_t * bytes,size_t size)
{
    const auto u32=[&](size_t p)->std::optional<uint32_t>{
        if(p>size || size-p<4)return std::nullopt;
        return uint32_t(bytes[p])|uint32_t(bytes[p+1])<<8|uint32_t(bytes[p+2])<<16|uint32_t(bytes[p+3])<<24;
    };
    const auto groups=u32(12);if(!groups || !*groups || *groups>1024)return std::nullopt;
    size_t group=784;
    for(uint32_t index=0;index<*groups;++index)
    {
        const auto count=u32(group+4);if(!count || *count>100000)return std::nullopt;
        const size_t offsets=group+16+size_t(*count)*13;
        if(offsets>size || size-offsets<size_t(*count)*4)return std::nullopt;
        if(*count)
        {
            const auto frame=u32(offsets);if(!frame)return std::nullopt;
            const auto top=u32(size_t(*frame)+28);
            if(!top || *top>4096)return std::nullopt;
            return int(*top);
        }
        group=offsets+size_t(*count)*4;
    }
    return std::nullopt;
}
inline int dungeonSpriteCentreX(int column,int row,bool wide,bool rightTail)
{return 44*column+(row%2==0?22:0)+(wide?(rightTail?22:-22):0);}
inline int dungeonSpriteCentreY(int row,int marginTop)
{return 42*row-(267-marginTop)/2;}
}
