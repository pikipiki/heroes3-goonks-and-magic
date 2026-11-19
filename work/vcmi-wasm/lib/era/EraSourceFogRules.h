/* Original UN:H and source77's player-bitset composition; GPL-2.0-or-later. */
#pragma once
#include <array>
#include <cstdint>
namespace era_bridge::source_fog
{
inline uint16_t preservedPlayers(int index,const std::array<int,8> & teams)
{
    uint16_t result=0x100;
    if(index>=0&&index<8)
        for(int color=0;color<8;++color)if(teams[color]==teams[index])result|=uint16_t(1u<<color);
    return result;
}
inline int darknessArgument(int player,const std::array<int,8> & teams)
{
    if(player<0||player>=8)return 0;
    int result=1<<player;
    if(teams[player]!=-1)
        for(int color=0;color<8;++color)if(teams[color]==teams[player])result|=1<<color;
    return result;
}
inline bool includes(int dx,int dy,int radius)
{
    if(radius<0)return false;
    const auto x=static_cast<int64_t>(dx),y=static_cast<int64_t>(dy),r=static_cast<int64_t>(radius);
    if(x < -r||x>r||y < -r||y>r)return false;
    // Integer distance squared <= (r+.5)^2 is exactly <= r*r+r.
    // Every admitted int32 coordinate product and their sum fit int64.
    return x*x+y*y<=r*r+r;
}
}
