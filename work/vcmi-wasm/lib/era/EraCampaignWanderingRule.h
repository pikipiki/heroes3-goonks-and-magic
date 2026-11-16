/* Original WoG wandering-monster route selection; GPL-2.0-or-later. */
#pragma once
#include <array>
#include <cstdint>
#include <functional>
#include <limits>
#include <queue>
#include <stdexcept>
#include <utility>
#include <vector>

namespace era_campaign_wandering
{
struct Point
{
 int x=0,y=0,z=0;
 bool operator==(const Point & other)const{return x==other.x&&y==other.y&&z==other.z;}
};
struct Step
{
 // Original FindStep codes:0 none,1 route,2 adjacent,3 same;
 //4/5/6 are their reachable-line fallbacks.
 int code=0;
 Point next;
};
inline std::uint8_t byte(std::int32_t value){return std::uint32_t(value)&255u;}

// Point::MakeLine runs from the destination towards the monster. Its strict
// negative error comparison matters at half-slope ties.
inline std::vector<Point> line(Point source,Point destination)
{
 std::vector<Point> result;
 const int dx=source.x-destination.x,dy=source.y-destination.y;
 const int ax=dx<0?-dx:dx,ay=dy<0?-dy:dy;
 const int sx=dx<0?-1:1,sy=dy<0?-1:1;
 if(!ax&&!ay)return result;
 Point p{destination.x,destination.y,source.z};
 const bool horizontal=ax>=ay;
 const int major=horizontal?ax:ay,minor=horizontal?ay:ax;
 int error=major;
 for(int i=0;i<=major;++i)
 {
  result.push_back(p);error-=2*minor;
  if(horizontal)p.x+=sx;else p.y+=sy;
  if(error<0){error+=2*major;if(horizontal)p.y+=sy;else p.x+=sx;}
 }
 return result;
}

template<class Free>
Step findStep(int width,int height,Point source,Point destination,Free free)
{
 if(width<=0||height<=0||source.x<0||source.y<0||source.x>=width||source.y>=height)
  throw std::runtime_error("Invalid wandering route bounds");
 constexpr int infinity=std::numeric_limits<int>::max()/4;
 const auto inside=[&](Point p){return p.x>=0&&p.y>=0&&p.x<width&&p.y<height;};
 const auto index=[&](Point p){return p.y*width+p.x;};
 const auto route=[&](Point target,bool fallback)->Step
 {
  if(!inside(target))return {};
  if(source==target)return {fallback?6:3,source};
  std::vector<int> distances(width*height,infinity);
  using Item=std::pair<int,int>;
  std::priority_queue<Item,std::vector<Item>,std::greater<Item>> queue;
  distances[index(target)]=1;queue.push({1,index(target)});
  while(!queue.empty())
  {
   const auto [distance,cell]=queue.top();queue.pop();if(distance!=distances[cell])continue;
   const Point p{cell%width,cell/width,source.z};
   for(int dx=-1;dx<=1;++dx)for(int dy=-1;dy<=1;++dy)
   {
    if(!dx&&!dy)continue;
    const Point next{p.x+dx,p.y+dy,source.z};
    if(!inside(next)||(!(next==source)&&!(next==target)&&!free(next)))continue;
    const int candidate=distance+(dx&&dy?3:2);
    if(candidate<distances[index(next)]){distances[index(next)]=candidate;queue.push({candidate,index(next)});}
   }
  }
  if(distances[index(source)]==infinity)return {};
  // MakeWay scans x then y and chooses strictly smaller values. WhereTo
  // subsequently chooses the first adjacent cell on that entire route.
  std::vector<bool> path(width*height,false);Point p=source;
  while(!(p==target))
  {
   Point best=p;int value=distances[index(p)];
   for(int dx=-1;dx<=1;++dx)for(int dy=-1;dy<=1;++dy)
   {
    if(!dx&&!dy)continue;
    Point next{p.x+dx,p.y+dy,source.z};
    if(inside(next)&&distances[index(next)]<value){value=distances[index(next)];best=next;}
   }
   if(best==p)throw std::runtime_error("Wandering route did not descend");
   path[index(best)]=true;p=best;
  }
  const std::array<std::pair<int,int>,8> priority={{{1,0},{1,-1},{1,1},{0,-1},{0,1},{-1,0},{-1,-1},{-1,1}}};
  for(const auto & [dx,dy]:priority)
  {
   const Point next{source.x+dx,source.y+dy,source.z};
   if(inside(next)&&path[index(next)])return {(next==target?2:1)+(fallback?3:0),next};
  }
  return {};
 };
 if(source.z==destination.z){const auto direct=route(destination,false);if(direct.code)return direct;}
 for(const auto & target:line(source,destination)){const auto alternative=route(target,true);if(alternative.code)return alternative;}
 return {};
}
}
