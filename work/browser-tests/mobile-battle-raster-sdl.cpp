#include "../vcmi-wasm/client/MobileBattleRaster.h"
#include <SDL.h>
#include <cstdio>
#include <vector>
#include <utility>
#include <cstring>
#include <emscripten/emscripten.h>

int main()
{
 unsigned cases=0;
 for(const auto dimensions : {std::pair<int,int>{1,1},{7,11},{43,97},{256,256},{511,487},{800,600}})
 for(const auto targetSize : {std::pair<int,int>{1,1},{13,17},{73,110},{110,110},{400,300}})
 {
  const int w=dimensions.first,h=dimensions.second,dw=targetSize.first,dh=targetSize.second;
  auto * source=SDL_CreateRGBSurfaceWithFormat(0,w+8,h+6,32,SDL_PIXELFORMAT_ARGB8888);
  auto * legacy=SDL_CreateRGBSurfaceWithFormat(0,dw+8,dh+6,32,SDL_PIXELFORMAT_ARGB8888);
  SDL_FillRect(legacy,nullptr,0);
  for(int y=0;y<source->h;++y)for(int x=0;x<source->w;++x)
   reinterpret_cast<uint32_t*>(static_cast<uint8_t*>(source->pixels)+y*source->pitch)[x]=uint32_t((x*17+y*31)%256)<<24|uint32_t((x*13)%256)<<16|uint32_t((y*7)%256)<<8|uint32_t((x+y*3)%256);
  SDL_SetSurfaceBlendMode(source,SDL_BLENDMODE_NONE);
  SDL_Rect crop{3,2,w,h},destination{4,3,dw,dh};
  SDL_BlitScaled(source,&crop,legacy,&destination);
  auto * rgba=SDL_ConvertSurfaceFormat(legacy,SDL_PIXELFORMAT_RGBA32,0);
  std::vector<uint32_t> actual((dw+8)*(dh+6));
  mobile_raster::packCreature(static_cast<const uint32_t*>(source->pixels),source->pitch/4,3,2,w,h,actual.data(),dw+8,4,3,dw,dh);
  for(int y=0;y<dh+6;++y)for(int x=0;x<dw+8;++x)
  {
   const auto expected=reinterpret_cast<const uint32_t*>(static_cast<const uint8_t*>(rgba->pixels)+y*rgba->pitch)[x];
   if(actual[y*(dw+8)+x]!=expected){std::printf("Mismatch %dx%d -> %dx%d at %d,%d: %08x != %08x\n",w,h,dw,dh,x,y,actual[y*(dw+8)+x],expected);return 1;}
  }
  SDL_FreeSurface(rgba);SDL_FreeSurface(legacy);SDL_FreeSurface(source);++cases;
 }
 auto * full=SDL_CreateRGBSurfaceWithFormat(0,800,600,32,SDL_PIXELFORMAT_ARGB8888);
 auto * scaled=SDL_CreateRGBSurfaceWithFormat(0,400,300,32,SDL_PIXELFORMAT_RGBA32);
 SDL_SetSurfaceBlendMode(full,SDL_BLENDMODE_NONE);
 std::vector<uint32_t> packed(400*300);
 volatile uint32_t checksum=0;
 const double start=emscripten_get_now();
 for(int i=0;i<40;++i){SDL_FillRect(full,nullptr,0);SDL_BlitScaled(full,nullptr,scaled,nullptr);checksum^=static_cast<uint32_t*>(scaled->pixels)[i];}
 const double middle=emscripten_get_now();
 for(int i=0;i<40;++i){memset(full->pixels,0,full->pitch*full->h);mobile_raster::packCreature(static_cast<const uint32_t*>(full->pixels),full->pitch/4,0,0,800,600,packed.data(),400,0,0,400,300);checksum^=packed[i];}
 const double end=emscripten_get_now();
 std::printf("BENCH {\"legacyMs\":%.3f,\"directMs\":%.3f}\n",middle-start,end-middle);
 SDL_FreeSurface(scaled);SDL_FreeSurface(full);
 std::printf("PASS %u SDL raster comparisons: crop, scale, alpha, colors and transparent padding\n",cases);
}
