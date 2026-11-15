/* Lossless decoded original campaign AVI frames; GPL-2.0-or-later. */
#pragma once
#include "EraCampaignMedia.h"
#include <array>
#include <cstdint>
namespace era_campaign_media
{
struct Movie{const char * key;const char * animation;std::uint32_t width,height,frames,fps;};
inline constexpr std::array<Movie,4> movies={{
 {"cmp.res/11_out.avi","era-campaign/movies/11_out",160,120,6,15},
 {"cmp.res/11_shield.avi","era-campaign/movies/11_shield",150,112,21,15},
 {"cmp.res/11_sun.avi","era-campaign/movies/11_sun",80,80,5,15},
 {"cmp.res/11_sword.avi","era-campaign/movies/11_sword",55,200,8,15}
}};
inline const Movie * movie(const std::string & path)
{
 for(const auto & candidate:candidates(path))for(const auto & value:movies)if(candidate.key==value.key)return &value;
 return nullptr;
}
inline std::size_t movieFrame(const Movie & value,std::uint64_t milliseconds)
{return (milliseconds*value.fps/1000)%value.frames;}
}
