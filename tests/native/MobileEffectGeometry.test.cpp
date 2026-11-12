#include <cassert>
#include <array>
#include "../../work/vcmi-wasm/client/render/MobileEffectGeometry.h"
int main()
{
 // Every board cell, both caster directions, tiny/wide/tall/full-screen images.
 for(int ax=0;ax<=800;ax+=22)for(int ay=0;ay<=600;ay+=21)
 for(const auto size:std::array<std::array<int,2>,7>{{{1,1},{31,63},{128,32},{32,512},{800,600},{640,480},{127,255}}})
 for(int offsetX:{-42,0,22})for(int offsetY:{-512,-63,0,21})
 {
  const int w=size[0],h=size[1],x=ax-w/2+offsetX,y=ay+offsetY;
  const auto origin=mobile_effects::anchoredOrigin(x,y,h,ax,ay);
  for(int u:{0,w/2,w-1})for(int v:{0,h/2,h-1})
  {
   // Native clockwise image rotation, then counter-clockwise board projection.
   const int nativeX=origin.x+h-v,nativeY=origin.y+u;
   assert(nativeY-ay==x+u-ax);
   assert(ax-nativeX==y+v-ay);
  }
 }
 // Tiled screen effects use the rotated image footprint, with no gaps or overlap.
 for(const auto size:std::array<std::array<int,2>,5>{{{32,512},{640,480},{128,32},{1,1},{800,600}}})
 {
  const int w=size[0],h=size[1];
  for(int y=0;y<600;y++)for(int x=0;x<800;x++)
  {const int tileX=x/h*h,tileY=y/w*w;assert(tileX<=x&&x<tileX+h&&tileY<=y&&y<tileY+w);}
 }
}
