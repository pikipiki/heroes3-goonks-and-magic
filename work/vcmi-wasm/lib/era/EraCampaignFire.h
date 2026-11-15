/* WoG 3.58f TAnimation 207/1 and OAnimation daily automaton.
 * Pinned PE: table 0x786820/0x786854, ChangeState 0x709260,
 * AnimateAll 0x7095e0. Delays belong to the destination phase. */
#pragma once
#include <array>
#include <vector>
namespace era_campaign_fire
{
struct Tree
{
 int object=0,x=0,y=0,z=0,mode=0,phase=0,time=1,next=0,delay=0;
};
inline constexpr std::array<int,6> delays={{9,1,2,1,2,2}};
inline bool touches(const Tree & tree,int x,int y,int z,int dx,int dy)
{return tree.z==z&&tree.x<=x+dx&&x<=tree.x+1&&tree.y<=y+dy&&y<=tree.y+1;}
inline void ignite(Tree & tree,int mode,int phase)
{if(tree.mode==0){tree.mode=mode;tree.next=phase;tree.time=0;tree.delay=0;}}
inline void provoke(std::vector<Tree> & trees,int x,int y,int z,int dx,int dy)
{for(auto & tree:trees)if(touches(tree,x,y,z,dx,dy))ignite(tree,2,1);}
inline std::vector<int> advance(std::vector<Tree> & trees)
{
 // Infection precedes transitions and can affect later entries in this scan.
 for(const auto & source:trees)if(source.phase==2&&source.time>=2)
  for(auto & tree:trees)if(touches(tree,source.x,source.y,source.z,1,1))ignite(tree,source.mode,1);
 std::vector<int> changed;
 for(auto & tree:trees)
 {
  if(tree.mode==0)continue;
  if(tree.time>=tree.delay)
  {
   tree.phase=tree.next;tree.time=0;changed.push_back(tree.object);
   if(tree.phase<5){tree.next=tree.phase+1;tree.delay=delays.at(tree.next);}
   else tree.mode=0;
  }
  tree.time=(tree.time+1)&255;
 }
 return changed;
}
}
