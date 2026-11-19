#pragma once
#include <cstdint>

namespace mobile_raster
{
// The atlas is sent as RGBA bytes. Sample the cropped ARGB surface directly,
// avoiding an intermediate scaled surface and a conversion of every empty tile.
inline void packCreature(const uint32_t * source, int sourceStride,
                         int left, int top, int width, int height,
                         uint32_t * target, int targetStride,
                         int targetLeft, int targetTop, int targetWidth, int targetHeight)
{
 if(targetWidth<=0||targetHeight<=0)return;
 const uint32_t xStep=(uint32_t(width)<<16)/targetWidth,yStep=(uint32_t(height)<<16)/targetHeight;
 for(int y=0;y<targetHeight;++y)
 {
  const auto * row=source+(top+((yStep/2+uint32_t(y)*yStep)>>16))*sourceStride;
  auto * out=target+(targetTop+y)*targetStride+targetLeft;
  for(int x=0;x<targetWidth;++x)
  {
   const uint32_t pixel=row[left+((xStep/2+uint32_t(x)*xStep)>>16)];
   out[x]=(pixel&0xff00ff00u)|((pixel>>16)&0xffu)|((pixel&0xffu)<<16);
  }
 }
}
}
